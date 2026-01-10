import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

/**
 * Pagination DTO
 *
 * Standard pagination request parameters.
 */
export class PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value != null ? parseInt(value) : 1))
  page: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value != null ? parseInt(value) : 20))
  limit: number = 20;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

/**
 * Page Info
 *
 * Metadata about pagination.
 */
export class PageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page != null ? page : 0;
    this.limit = limit != null ? limit : 0;
    this.total = total != null ? total : 0;
    this.totalPages = this.limit > 0 ? Math.ceil(this.total / this.limit) : 0;
  }
}

/**
 * Pagination Response
 *
 * Standard pagination response wrapper.
 */
export class PaginationResponse<T> {
  data: T[] | Record<string, any>;
  paging: PageInfo;

  constructor(data: T[] | Record<string, any>, paging: PageInfo) {
    this.data = data;
    this.paging = paging;
  }

  static of<T>(pagination: PaginationResponse<T>): PaginationResponse<T> {
    return new PaginationResponse(pagination.data, pagination.paging);
  }
}
