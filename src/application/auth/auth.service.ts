import { AuthDomainService } from '@domain/identity/auth/auth.domain-service';
import { UserAggregate } from '@domain/identity/user/user.aggregate';
import { UserRepository } from '@domain/identity/user/user.repository';
import { Email } from '@domain/identity/user/value-objects/email.vo';
import { Username } from '@domain/identity/user/value-objects/username.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { VerificationService } from '@infra/verification/verification.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  AuthResponseDto,
  ChangePasswordDto,
  ConfirmVerificationDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendVerificationDto,
  TokenResponseDto,
  VerificationType,
} from './dto';

/**
 * Auth Application Service
 *
 * Handles authentication use cases.
 *
 * Responsibilities:
 * - User registration
 * - User login
 * - Token generation and refresh
 * - Password hashing and verification
 */
@Injectable()
export class AuthApplicationService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verificationService: VerificationService,
    private readonly authDomainService: AuthDomainService,
  ) {}

  /**
   * Register new user
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // STEP 1: Validate email verification (application layer concern)
    await this.verificationService.validatePreviousVerification(
      dto.email,
      VerificationType.REGISTER_ACCOUNT,
    );

    // STEP 2: Validate password strength (domain service)
    AuthDomainService.validatePasswordStrength(dto.password);

    // STEP 3: Hash password (infrastructure)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // STEP 4: Register user (domain service coordinates uniqueness checks + creation)
    const user = await this.authDomainService.registerUser({
      email: dto.email,
      username: dto.username,
      passwordHash,
      role: dto.role || 'FAN',
    });

    // STEP 5: Persist (application orchestration)
    await this.userRepository.save(user);

    // STEP 6: Generate tokens (infrastructure)
    const tokens = await this.generateTokens(user);

    // STEP 7: Map to response DTO
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapToUserInfoDto(user),
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // 1. Find user by credential (email or username)
    const user = await this.findUserByCredential(dto.credential);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Domain invariant: Check if user can login
    user.canLogin();

    // 3. Verify password (bcrypt is infrastructure, stays in application layer)
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash.value,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Generate tokens (infrastructure)
    const tokens = await this.generateTokens(user);

    // 5. Map to response DTO
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapToUserInfoDto(user),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh-secret',
      });

      // Get user
      const user = await this.userRepository.findById({
        value: payload.sub,
      } as any);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Domain invariant: Check if user can login
      user.canLogin();

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Send verification code
   */
  async sendVerification(
    dto: SendVerificationDto,
  ): Promise<{ expiresAt: number }> {
    // Check if email already exists for registration verification type
    if (dto.verificationType === VerificationType.REGISTER_ACCOUNT) {
      const existingUser = await this.userRepository.existsByEmail(
        Email.create(dto.email),
      );

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if user exists for password reset
    if (dto.verificationType === VerificationType.RESET_PASSWORD) {
      const user = await this.userRepository.findByEmail(
        Email.create(dto.email),
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // Send verification
    return await this.verificationService.sendVerification(
      dto.email,
      dto.verificationType,
    );
  }

  /**
   * Confirm verification code
   */
  async confirmVerification(dto: ConfirmVerificationDto): Promise<void> {
    await this.verificationService.confirmVerification(
      dto.email,
      dto.code,
      dto.verificationType,
    );
  }

  /**
   * Reset password
   *
   * Allows users to reset their password after verifying their email.
   * Used when user forgets their password.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // STEP 1: Validate that user has verified their email
    // This ensures only the email owner can reset the password
    await this.verificationService.validatePreviousVerification(
      dto.email,
      VerificationType.RESET_PASSWORD,
    );

    // STEP 2: Validate password strength
    AuthDomainService.validatePasswordStrength(dto.password);

    // STEP 3: Find user
    const user = await this.userRepository.findByEmail(Email.create(dto.email));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // STEP 4: Hash new password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // STEP 5: Update password using domain method
    user.changePassword(passwordHash);

    // STEP 6: Persist
    await this.userRepository.save(user);
  }

  /**
   * Change password (authenticated user)
   *
   * Requires email verification for security.
   * User must verify their email before changing password.
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    // STEP 1: Find user
    const user = await this.userRepository.findById(UserId.fromString(userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // STEP 2: Validate that user has verified their email
    // This ensures the password change is authorized
    await this.verificationService.validatePreviousVerification(
      user.email.value,
      VerificationType.CHANGE_PASSWORD,
    );

    // STEP 3: Validate password strength
    AuthDomainService.validatePasswordStrength(dto.password);

    // STEP 4: Verify old password
    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash.value,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    // STEP 5: Hash new password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // STEP 6: Update password using domain method
    user.changePassword(passwordHash);

    // STEP 7: Persist
    await this.userRepository.save(user);
  }

  /**
   * Helper: Find user by credential (email or username)
   */
  private async findUserByCredential(
    credential: string,
  ): Promise<UserAggregate | null> {
    // Check if credential is email format (contains @)
    if (credential.includes('@')) {
      return this.userRepository.findByEmail(Email.create(credential));
    }

    // Otherwise, treat as username
    return this.userRepository.findByUsername(Username.create(credential));
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(UserId.fromString(userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserInfoDto(user);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: UserAggregate): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.id.value,
      email: user.email.value,
      username: user.username.value,
      role: user.role.value,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token (15 minutes)
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
        expiresIn: '15m',
      }),
      // Refresh token (7 days)
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh-secret',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Map UserAggregate to UserInfoDto
   */
  private mapToUserInfoDto(user: UserAggregate) {
    return {
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      role: user.role.value,
      avatarUrl: user.profile.avatarUrl,
      backgroundUrl: user.profile.backgroundUrl,
      bio: user.profile.bio,
    };
  }
}
