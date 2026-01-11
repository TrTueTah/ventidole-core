import { PrismaClient } from '@database/prisma/client';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

/**
 * Prisma Service
 *
 * Provides access to the Prisma ORM client.
 * Handles connection lifecycle (connect on init, disconnect on destroy).
 *
 * This service is injected into repository implementations in the infra layer.
 * Domain layer MUST NOT import or use this service directly.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as any, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log errors
    this.$on('error' as any, (e: any) => {
      this.logger.error('Prisma error:', e);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  /**
   * Clean database (useful for testing)
   * WARNING: This deletes all data!
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Object.keys(this).filter(
      (key) => !key.startsWith('_') && !key.startsWith('$'),
    );

    for (const model of models) {
      if (typeof this[model]?.deleteMany === 'function') {
        await this[model].deleteMany();
      }
    }

    this.logger.warn('Database cleaned');
  }
}
