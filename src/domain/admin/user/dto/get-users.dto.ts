import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/db/prisma/enums';

export class GetUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by email or username',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: Role,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by active status',
  })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'email', 'username', 'role'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
