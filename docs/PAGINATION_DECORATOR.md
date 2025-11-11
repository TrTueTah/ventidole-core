# Pagination Response Decorator

## Overview
The `@ApiPaginationResponse()` decorator provides automatic Swagger documentation for paginated API responses. It wraps your data in the standard `BaseResponse<PaginationResponse<T>>` structure.

## Response Structure

```typescript
{
  statusCode: 200,
  message: "OK",
  data: {
    data: T[],           // Array of your items
    paging: {
      total: number,     // Total items across all pages
      page: number,      // Current page number
      limit: number,     // Items per page
      totalPages: number // Total number of pages
    }
  },
  error: null,
  errorCode: null
}
```

## Usage

### 1. Import the decorator
```typescript
import { ApiPaginationResponse } from '@core/decorator/doc.decorator';
import { PaginationRequestDto } from '@shared/dto/pagination-request.dto';
import { PaginationResponse, PageInfo } from '@shared/dto/pagination-response.dto';
import { BaseResponse } from '@shared/helper/response';
```

### 2. Apply to your controller endpoint
```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiPaginationResponse } from '@core/decorator/doc.decorator';
import { UserDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth()
  @ApiPaginationResponse(UserDto)
  async getUsers(@Query() query: PaginationRequestDto) {
    return this.userService.getUsers(query);
  }
}
```

### 3. Implement in your service
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { PaginationRequestDto } from '@shared/dto/pagination-request.dto';
import { PaginationResponse, PageInfo } from '@shared/dto/pagination-response.dto';
import { BaseResponse } from '@shared/helper/response';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(query: PaginationRequestDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.user.count();

    // Get paginated data
    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Create pagination metadata
    const pageInfo = new PageInfo(page, limit, total);

    // Create pagination response
    const paginationResponse = new PaginationResponse(users, pageInfo);

    // Wrap in BaseResponse
    return BaseResponse.of(paginationResponse);
  }
}
```

## Example Request

```bash
curl -X GET "http://localhost:8080/users?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Example Response

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "data": [
      {
        "id": "user_123",
        "email": "user1@example.com",
        "role": "FAN",
        "createdAt": "2025-11-11T10:00:00.000Z"
      },
      {
        "id": "user_124",
        "email": "user2@example.com",
        "role": "IDOL",
        "createdAt": "2025-11-11T09:30:00.000Z"
      }
    ],
    "paging": {
      "total": 100,
      "page": 2,
      "limit": 20,
      "totalPages": 5
    }
  },
  "error": null
}
```

## Swagger Documentation

The decorator automatically generates comprehensive Swagger documentation including:
- ✅ Request query parameters (page, limit)
- ✅ Response schema with pagination structure
- ✅ Data model schema (your DTO)
- ✅ Paging metadata schema
- ✅ Example values for all fields

## Advanced Usage

### With Filters
```typescript
@Get()
@ApiPaginationResponse(UserDto)
async getUsers(
  @Query() query: PaginationRequestDto,
  @Query('role') role?: Role,
  @Query('search') search?: string,
) {
  return this.userService.getUsers(query, { role, search });
}
```

### Service Implementation with Filters
```typescript
async getUsers(
  query: PaginationRequestDto,
  filters?: { role?: Role; search?: string },
) {
  const { page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (filters?.role) {
    where.role = filters.role;
  }
  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { fan: { username: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  // Get total count with filters
  const total = await this.prisma.user.count({ where });

  // Get paginated data with filters
  const users = await this.prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const pageInfo = new PageInfo(page, limit, total);
  const paginationResponse = new PaginationResponse(users, pageInfo);

  return BaseResponse.of(paginationResponse);
}
```

## Related Files
- `/src/core/decorator/doc.decorator.ts` - Decorator implementation
- `/src/shared/dto/pagination-request.dto.ts` - Request DTO
- `/src/shared/dto/pagination-response.dto.ts` - Response DTOs
- `/src/shared/helper/response.ts` - BaseResponse wrapper

## Best Practices

1. **Always use consistent page numbering**: Start from page 1, not 0
2. **Set reasonable default limits**: Usually 10-50 items per page
3. **Add max limit validation**: Prevent users from requesting too many items
4. **Include total count**: Always return total count for proper pagination UI
5. **Return empty array**: When no results found, return empty array with proper paging info

```typescript
// Good: Returns empty array with correct paging
{
  "data": {
    "data": [],
    "paging": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 0
    }
  }
}
```

6. **Use indexes**: Ensure database queries use proper indexes for performance
7. **Consider cursor-based pagination**: For very large datasets or real-time data

## Validation

Use the built-in `PaginationRequestDto` which includes validation:
```typescript
export class PaginationRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)  // Prevent excessive limits
  @Type(() => Number)
  limit?: number = 10;
}
```

## Testing

```typescript
describe('UserController', () => {
  it('should return paginated users', async () => {
    const result = await controller.getUsers({ page: 1, limit: 10 });
    
    expect(result.statusCode).toBe(200);
    expect(result.data.data).toBeInstanceOf(Array);
    expect(result.data.paging).toEqual({
      total: expect.any(Number),
      page: 1,
      limit: 10,
      totalPages: expect.any(Number),
    });
  });
});
```
