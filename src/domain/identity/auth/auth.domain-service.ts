/**
 * Auth Domain Service
 *
 * Handles authentication-related business logic that doesn't belong
 * to a specific aggregate.
 *
 * Responsibilities:
 * - Password validation rules
 * - Token generation rules
 * - Authentication attempt tracking
 *
 * Note: This is PURE business logic. No Prisma, no HTTP, no side effects.
 * Password hashing should be done in application layer using bcrypt.
 */
export class AuthDomainService {
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
}
