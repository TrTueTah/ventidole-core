import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { Role } from 'src/db/prisma/enums';
import { TokenIssuer } from '@shared/enum/token.enum';
import { ENVIRONMENT } from '@core/config/env.config';
import * as bcrypt from 'bcryptjs';
import { CreateIdolRequest, GetIdolsRequest } from './request/index.request';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { IdolDto } from './response/get-idols.response';
import { CreateIdolResponse } from './response/create-idol.response';

@Injectable()
export class AdminIdolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Create a new idol account with user credentials and profile
   * Only accessible by ADMIN role
   */
  async createIdolAccount(body: CreateIdolRequest) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new CustomError(ErrorCode.EmailAlreadyExists);
    }

    // Check if group exists
    const group = await this.prisma.group.findUnique({
      where: { id: body.groupId },
    });

    if (!group) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create User and Idol in a transaction
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: Role.IDOL,
        deviceToken: body.deviceToken,
        idol: {
          create: {
            stageName: body.stageName,
            groupId: body.groupId,
            avatarUrl: body.avatarUrl,
            backgroundUrl: body.backgroundUrl,
            bio: body.bio,
          },
        },
      },
      include: {
        idol: {
          include: {
            group: true,
          },
        },
      },
    });

    // Generate tokens for the new idol
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        issuer: TokenIssuer.Access,
        secret: ENVIRONMENT.JWT_SECRET,
        expiresIn: '7d',
      }
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        issuer: TokenIssuer.Refresh,
        secret: ENVIRONMENT.JWT_SECRET,
        expiresIn: '30d',
      }
    );

    return BaseResponse.of(
      new CreateIdolResponse(
        user.id,
        user.email,
        user.role,
        user.idol,
        accessToken,
        refreshToken
      )
    );
  }

  /**
   * Get all idols with pagination
   */
  async getAllIdols(query: GetIdolsRequest) {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', search } = query;

    // Construct orderBy object
    const orderByObj: any = {};
    orderByObj[sortBy] = sortOrder;

    const [idols, total] = await Promise.all([
      this.prisma.idol.findMany({
        where: { isActive: true, stageName: { contains: search, mode: 'insensitive' } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isOnline: true,
              isActive: true,
              createdAt: true,
            },
          },
          group: true,
        },
        orderBy: orderByObj,
        skip: query.offset,
        take: limit,
      }),
      this.prisma.idol.count({
        where: { isActive: true },
      }),
    ]);

    const paging: PageInfo = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Transform raw data to DTOs
    const idolDtos = idols.map(idol => new IdolDto(idol));

    return new PaginationResponse(idolDtos, paging);
  }
}