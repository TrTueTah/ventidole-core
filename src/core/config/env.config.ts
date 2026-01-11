import { ConfigModuleOptions } from '@nestjs/config';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';
import { NodeEnv } from '../types/environment.enum';
import { convertStringToBool } from '../utils/convert';

class EnvironmentVariable {
  @IsEnum(NodeEnv)
  @IsNotEmpty()
  NODE_ENV: NodeEnv;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  CORS: string;

  @Transform(({ value }) => convertStringToBool(value))
  @IsBoolean()
  @IsNotEmpty()
  CORS_CREDENTIALS: boolean;

  @IsString()
  @IsNotEmpty()
  COOKIE_SECRET: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  OTP_LENGTH: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  OTP_LIMIT: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  OTP_DAY_LIMIT: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  OTP_EXPIRE_TIME: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  VERIFICATION_SESSION: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  MAIL_PORT: number;

  @IsString()
  @IsNotEmpty()
  MAIL_HOST: string;

  @IsString()
  @IsNotEmpty()
  MAIL_USER: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  REDIS_PORT: number;

  @IsString()
  @IsNotEmpty()
  REDIS_USER: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_SENSITIVE_SECRET: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  JWT_EXPIRED: number;

  @IsString()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  FIREBASE_CLIENT_EMAIL: string;

  @IsString()
  @IsNotEmpty()
  STREAM_CHAT_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  STREAM_CHAT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  KNOCK_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  KNOCK_SIGNING_KEY: string;

  @IsString()
  KNOCK_PUSH_CHANNEL_ID: string;

  @IsString()
  KNOCK_IN_APP_CHANNEL_ID: string;

  @IsString()
  KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY: string;

  @IsString()
  @IsNotEmpty()
  PAYOS_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  PAYOS_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  PAYOS_CHECKSUM_KEY: string;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  RECOMMENDATION_API_URL: string;
}

export const ENVIRONMENT = {} as EnvironmentVariable;

function initEnvironmentVariable(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariable, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length) {
    let errorMessage = errors
      .map(
        (message) => message.constraints?.[Object.keys(message.constraints)[0]],
      )
      .join('\n');

    const color = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      fgRed: '\x1b[31m',
    };

    errorMessage = `${color.fgRed}${color.bright}${errorMessage}${color.reset}`;
    throw new Error(errorMessage);
  }

  Object.assign(ENVIRONMENT, validatedConfig);
  return validatedConfig;
}

export const initEnvironmentConfig = () =>
  ({
    cache: true,
    isGlobal: true,
    expandVariables: true,
    validate: initEnvironmentVariable,
  }) as ConfigModuleOptions;
