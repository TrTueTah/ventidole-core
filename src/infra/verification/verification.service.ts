import { AuthDomainService } from '@domain/identity/auth/auth.domain-service';
import {
  VerificationType as DomainVerificationType,
  Verification,
} from '@domain/identity/auth/verification.entity';
import { PrismaService } from '@infra/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@infra/mail/mail.service';

/**
 * Verification Infrastructure Service
 *
 * Handles OTP generation, storage, and email sending.
 *
 * Responsibilities:
 * - Generate OTP codes
 * - Store verification in database
 * - Send verification emails (TODO: integrate with mail service)
 * - Validate and confirm OTP codes
 *
 * Note: This is an infrastructure service that can be used by application layer.
 */
@Injectable()
export class VerificationService {
  private readonly OTP_EXPIRE_TIME: number;
  private readonly OTP_LENGTH: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.OTP_EXPIRE_TIME =
      this.configService.get<number>('OTP_EXPIRE_TIME') || 300; // 5 minutes
    this.OTP_LENGTH = this.configService.get<number>('OTP_LENGTH') || 6;
  }

  /**
   * Map application verification type to domain verification type
   */
  private mapToDomainVerificationType(type: string): DomainVerificationType {
    const typeMap: Record<string, DomainVerificationType> = {
      REGISTER_ACCOUNT: DomainVerificationType.REGISTER_ACCOUNT,
      RESET_PASSWORD: DomainVerificationType.RESET_PASSWORD,
      CHANGE_PASSWORD: DomainVerificationType.CHANGE_EMAIL, // Using CHANGE_EMAIL as proxy
      FIND_EMAIL: DomainVerificationType.FIND_EMAIL,
    };

    return typeMap[type] || DomainVerificationType.REGISTER_ACCOUNT;
  }

  /**
   * Send verification code
   *
   * Generates an OTP and creates a verification record.
   * Prevents sending multiple active verifications for the same email/type.
   */
  async sendVerification(
    email: string,
    verificationType: string,
  ): Promise<{ expiresAt: number }> {
    // Check if there's an active (unused) verification that hasn't expired
    const recentVerification = await this.prisma.verification.findFirst({
      where: {
        email,
        type: verificationType,
        isActive: true, // Only active (unused) verifications
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentVerification) {
      throw new ConflictException(
        'Verification code already sent. Please wait before requesting a new one.',
      );
    }

    // Generate OTP using domain service
    const otp = AuthDomainService.generateOTP(this.OTP_LENGTH);

    // Create verification entity
    const domainVerificationType =
      this.mapToDomainVerificationType(verificationType);
    const verification = Verification.create(
      email,
      otp,
      domainVerificationType,
      Math.floor(this.OTP_EXPIRE_TIME / 60), // Convert seconds to minutes
    );

    // Persist to database
    // isActive defaults to true (unused/unconfirmed state)
    await this.prisma.verification.create({
      data: {
        id: verification.id,
        email: verification.email,
        token: verification.token,
        type: verificationType,
        expiresAt: verification.expiresAt,
        createdAt: verification.createdAt,
        // isActive defaults to true from schema
        // confirmedAt is null initially
      },
    });

    // Send verification email
    try {
      const expirationMinutes = Math.floor(this.OTP_EXPIRE_TIME / 60);
      await this.mailService.sendOTPEmail(email, otp, expirationMinutes);

      console.log(
        `[Verification] OTP email sent to ${email} (expires at ${verification.expiresAt})`,
      );
    } catch (error) {
      console.error(
        `[Verification] Failed to send OTP email to ${email}:`,
        error.message,
      );
      // Don't throw - verification was created, email failure is non-critical
      // User can request a new code if needed
    }

    return {
      expiresAt: verification.expiresAt.getTime(), // Return timestamp
    };
  }

  /**
   * Confirm verification code
   *
   * Validates the OTP code and marks the verification as confirmed.
   * Sets isActive=false to indicate the verification has been used.
   * This follows the legacy pattern where isActive=false means confirmed.
   */
  async confirmVerification(
    email: string,
    code: string,
    verificationType: string,
  ): Promise<void> {
    // Find active (unused) verification with matching code
    const dbVerification = await this.prisma.verification.findFirst({
      where: {
        email,
        type: verificationType,
        token: code,
        isActive: true, // Only find active (unused) verifications
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!dbVerification) {
      throw new ConflictException('Invalid or expired verification code');
    }

    // Check if verification has expired
    if (new Date() > dbVerification.expiresAt) {
      throw new ConflictException('Verification code has expired');
    }

    // Reconstitute domain entity
    const domainVerificationType =
      this.mapToDomainVerificationType(verificationType);
    const verification = Verification.fromPersistence({
      id: dbVerification.id,
      email: dbVerification.email,
      token: dbVerification.token,
      type: domainVerificationType,
      expiresAt: dbVerification.expiresAt,
      createdAt: dbVerification.createdAt,
      isUsed: !dbVerification.isActive, // Map isActive to isUsed
      usedAt: dbVerification.confirmedAt,
    });

    // Mark as used (domain logic validates expiry)
    verification.markAsUsed();

    // Update database: set isActive=false and confirmedAt timestamp
    // This follows the legacy pattern where isActive=false means the verification was confirmed
    await this.prisma.verification.update({
      where: { id: verification.id },
      data: {
        isActive: false, // Mark as inactive (used/confirmed)
        confirmedAt: new Date(), // Record when it was confirmed
      },
    });
  }

  /**
   * Check if verification was confirmed (for registration, password reset flows)
   *
   * Validates that:
   * 1. User has a confirmed verification for this email and type
   * 2. Verification was confirmed recently (within session timeout)
   *
   * This follows the legacy pattern where isActive=false means confirmed/used
   */
  async validatePreviousVerification(
    email: string,
    verificationType: string,
  ): Promise<void> {
    const recentConfirmedVerification =
      await this.prisma.verification.findFirst({
        where: {
          email,
          type: verificationType,
          isActive: false, // isActive=false means the verification was confirmed/used
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!recentConfirmedVerification) {
      throw new ConflictException(
        'No verification found. Please verify your email first.',
      );
    }

    // Check if verification was confirmed recently (within 10 minutes)
    // This matches the legacy VERIFICATION_SESSION timeout
    if (!recentConfirmedVerification.confirmedAt) {
      throw new ConflictException(
        'Verification not confirmed. Please verify your email first.',
      );
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (recentConfirmedVerification.confirmedAt < tenMinutesAgo) {
      throw new ConflictException(
        'Verification session expired. Please verify your email again.',
      );
    }
  }
}
