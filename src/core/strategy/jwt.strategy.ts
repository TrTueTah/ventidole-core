import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenStrategyKey } from '../types/token.enum';

/**
 * JWT Strategy
 *
 * Validates JWT tokens and extracts user payload.
 */
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, TokenStrategyKey.Jwt) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    // This payload is attached to request.user by Passport
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  }
}
