import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '@domain/identity/user/user.repository';
import { UserAggregate } from '@domain/identity/user/user.aggregate';
import { Email } from '@domain/identity/user/value-objects/email.vo';
import { Username } from '@domain/identity/user/value-objects/username.vo';

/**
 * Auth Domain Service
 *
 * Handles authentication-related business logic that doesn't belong
 * to a specific aggregate.
 *
 * Responsibilities:
 * - Password validation rules
 * - Token generation rules
 * - Email/username uniqueness validation
 * - User registration coordination
 *
 * Note: This is PURE business logic. No Prisma access (uses repository interfaces).
 * Password hashing should be done in application layer using bcrypt.
 */
@Injectable()
export class AuthDomainService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}
  /**
   * Validate password strength
   *
   * Business rules:
   * - Password must be at least 8 characters
   * - Password must contain at least one uppercase letter
   * - Password must contain at least one lowercase letter
   * - Password must contain at least one number
   * - Password must contain at least one special character
   *
   * @param password - Plain text password
   * @throws Error if password doesn't meet requirements
   */
  static validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  /**
   * Generate a secure random token
   *
   * @param length - Token length (default: 32)
   * @returns Random token string
   */
  static generateToken(length: number = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return token;
  }

  /**
   * Generate a numeric OTP code
   *
   * @param length - OTP length (default: 6)
   * @returns Numeric OTP string
   */
  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return otp;
  }

  /**
   * Validate that email is available (not already taken)
   *
   * Business rule: Email must be unique across all users
   *
   * @param email - Email value object
   * @throws ConflictException if email already exists
   */
  async validateEmailAvailable(email: Email): Promise<void> {
    const exists = await this.userRepository.existsByEmail(email);

    if (exists) {
      throw new ConflictException('Email already exists');
    }
  }

  /**
   * Validate that username is available (not already taken)
   *
   * Business rule: Username must be unique across all users
   *
   * @param username - Username value object
   * @throws ConflictException if username already exists
   */
  async validateUsernameAvailable(username: Username): Promise<void> {
    const exists = await this.userRepository.existsByUsername(username);

    if (exists) {
      throw new ConflictException('Username already exists');
    }
  }

  /**
   * Register a new user
   *
   * Coordinates the user registration process:
   * 1. Validates email uniqueness
   * 2. Validates username uniqueness
   * 3. Creates user aggregate
   *
   * Business rules enforced:
   * - Email must be unique
   * - Username must be unique
   * - Password must already be hashed (done in application layer)
   *
   * @param props - User registration properties
   * @returns New UserAggregate ready to be persisted
   * @throws ConflictException if email or username already exists
   */
  async registerUser(props: {
    email: string;
    username: string;
    passwordHash: string;
    role?: string;
  }): Promise<UserAggregate> {
    const email = Email.create(props.email);
    const username = Username.create(props.username);

    // Business rule: Check email uniqueness
    await this.validateEmailAvailable(email);

    // Business rule: Check username uniqueness
    await this.validateUsernameAvailable(username);

    // Create user aggregate (uses factory method with domain events)
    return UserAggregate.register({
      email: props.email,
      username: props.username,
      passwordHash: props.passwordHash,
      role: props.role,
    });
  }
}
