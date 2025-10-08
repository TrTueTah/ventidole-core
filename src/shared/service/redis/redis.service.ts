import { REDIS_CLIENT } from "@core/config/redis.config";
import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttlSeconds) await this.redis.set(key, serializedValue, "EX", ttlSeconds);
    else await this.redis.set(key, serializedValue);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const serializedMember = JSON.stringify(member);
    const result = await this.redis.sismember(key, serializedMember);
    return result === 1;
  }

  async smembers<T>(key: string): Promise<T[]> {
    const members = await this.redis.smembers(key);
    return members.map((member) => JSON.parse(member) as T);
  }

  async sadd<T>(key: string, members: T[]): Promise<void> {
    const serializedMembers = members.map((member) => JSON.stringify(member));
    await this.redis.sadd(key, ...serializedMembers);
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }
}
