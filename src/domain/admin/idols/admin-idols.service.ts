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
import { CreateIdolRequest, GetIdolsRequest, UpdateIdolRequest } from './request/index.request';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { IdolDto } from './response/get-idols.response';
import { CreateIdolResponse } from './response/create-idol.response';
import { UpdateIdolResponse } from './response/update-idol.response';
import { GetIdolDetailResponse } from './response/get-idol-detail.response';

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

    // Check if community exists
    const community = await this.prisma.community.findUnique({
      where: { id: body.communityId },
    });

    if (!community) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create User with IDOL role in the community
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: Role.IDOL,
        deviceToken: body.deviceToken,
        username: body.username,
        bio: body.bio,
        avatarUrl: body.avatarUrl,
        backgroundUrl: body.backgroundUrl,
        communityId: body.communityId,
      },
      include: {
        community: true,
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
        user,
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
      this.prisma.user.findMany({
        where: {
          role: Role.IDOL,
          isActive: true,
          ...(search && {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          })
        },
        include: {
          community: true,
        },
        orderBy: orderByObj,
        skip: query.offset,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          role: Role.IDOL,
          isActive: true,
        },
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

  /**
   * Get idol detail by ID
   */
  async getIdolDetail(idolId: string) {
    const idol = await this.prisma.user.findUnique({
      where: { id: idolId, role: Role.IDOL },
      include: {
        community: true,
      },
    });

    if (!idol) {
      throw new CustomError(ErrorCode.IdolNotFound);
    }

    return BaseResponse.of(new GetIdolDetailResponse(idol));
  }

  /**
   * Update idol information
   */
  async updateIdol(idolId: string, body: UpdateIdolRequest) {
    // Check if user exists and is an idol
    const existingIdol = await this.prisma.user.findUnique({
      where: { id: idolId, role: Role.IDOL },
    });

    if (!existingIdol) {
      throw new CustomError(ErrorCode.IdolNotFound);
    }

    // If communityId is being updated, check if the new community exists
    if (body.communityId && body.communityId !== existingIdol.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: body.communityId },
      });

      if (!community) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }
    }

    // Update idol user
    const updatedIdol = await this.prisma.user.update({
      where: { id: idolId },
      data: {
        ...(body.username && { username: body.username }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.backgroundUrl !== undefined && { backgroundUrl: body.backgroundUrl }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.communityId && { communityId: body.communityId }),
      },
      include: {
        community: true,
      },
    });

    return BaseResponse.of(new UpdateIdolResponse(updatedIdol));
  }
}