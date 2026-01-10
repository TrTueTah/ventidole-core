import { UserAggregate } from './user.aggregate';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Email } from './value-objects/email.vo';
import { Username } from './value-objects/username.vo';

/**
 * User Repository Interface
 *
 * Defines the contract for User aggregate persistence.
 * Implementation belongs in the infrastructure layer.
 *
 * IMPORTANT:
 * - This is an INTERFACE only (no implementation)
 * - Domain layer defines WHAT operations are needed
 * - Infrastructure layer implements HOW they work
 * - Never import Prisma or any ORM in this file
 */
export interface UserRepository {
  /**
   * Save a user (create or update)
   * @param user - The user aggregate to persist
   */
  save(user: UserAggregate): Promise<void>;

  /**
   * Find user by ID
   * @param id - The user ID
   * @returns User aggregate or null if not found
   */
  findById(id: UserId): Promise<UserAggregate | null>;

  /**
   * Find user by email
   * @param email - The email address
   * @returns User aggregate or null if not found
   */
  findByEmail(email: Email): Promise<UserAggregate | null>;

  /**
   * Find user by username
   * @param username - The username
   * @returns User aggregate or null if not found
   */
  findByUsername(username: Username): Promise<UserAggregate | null>;

  /**
   * Check if email exists
   * @param email - The email to check
   * @param excludeId - Optional user ID to exclude from check (for updates)
   * @returns True if email exists, false otherwise
   */
  existsByEmail(email: Email, excludeId?: UserId): Promise<boolean>;

  /**
   * Check if username exists
   * @param username - The username to check
   * @param excludeId - Optional user ID to exclude from check (for updates)
   * @returns True if username exists, false otherwise
   */
  existsByUsername(username: Username, excludeId?: UserId): Promise<boolean>;

  /**
   * Find all users with pagination and filters
   * @param params - Pagination and filter parameters
   * @returns Paginated list of users
   */
  findAll(params: {
    page: number;
    limit: number;
    role?: string;
    isActive?: boolean;
    searchTerm?: string;
  }): Promise<{
    users: UserAggregate[];
    total: number;
  }>;

  /**
   * Delete user (hard delete - use with caution)
   * @param id - The user ID to delete
   */
  delete(id: UserId): Promise<void>;
}
