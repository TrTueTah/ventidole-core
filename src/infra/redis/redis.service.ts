import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Redis Service
 *
 * Provides access to Redis for caching and session management.
 *
 * Usage:
 * ```typescript
 * // Set value with TTL
 * await this.redisService.set('key', 'value', 3600);
 *
 * // Get value
 * const value = await this.redisService.get('key');
 *
 * // Delete value
 * await this.redisService.del('key');
 * ```
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured, Redis service will not be available',
      );
      return;
    }

    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis error:', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  /**
   * Set a key-value pair with optional TTL (in seconds)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return;
    }

    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return null;
    }

    return await this.client.get(key);
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return 0;
    }

    return await this.client.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return false;
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration on a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return false;
    }

    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return [];
    }

    return await this.client.keys(pattern);
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<void> {
    if (!this.client) {
      this.logger.warn('Redis client not available');
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush Redis in production');
    }

    await this.client.flushall();
    this.logger.warn('Redis flushed');
  }

  /**
   * Get raw Redis client for advanced operations
   */
  getClient(): Redis | null {
    return this.client;
  }
}
