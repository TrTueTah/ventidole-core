# Pagination Decorator Fix - Swagger Schema

## Problem
The Swagger schema for paginated responses was showing:
```json
{
  "data": {
    "data": ["string"],  // ❌ Wrong: showing "string" instead of actual DTO
    "paging": { ... }
  }
}
```

## Root Cause
The `@ApiPaginationResponse()` decorator was missing the `ApiExtraModels()` call, which is required to register the DTO model with Swagger's schema registry.

Without `ApiExtraModels()`, Swagger cannot resolve the `$ref` reference to the model schema, so it falls back to showing generic `"string"` type.

## Solution

### Before (Broken)
```typescript
export function ApiPaginationResponse<TModel extends Type<unknown>>(model: TModel) {
  return applyDecorators(
    // ❌ Missing ApiExtraModels()
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) }, // Can't resolve this!
              },
            },
          },
        },
      },
    }),
  );
}
```

### After (Fixed)
```typescript
export function ApiPaginationResponse<TModel extends Type<unknown>>(model: TModel) {
  return applyDecorators(
    // ✅ Register all models with Swagger
    ApiExtraModels(model, PaginationResponse, PageInfo, BaseResponse),
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) }, // Now resolves correctly!
              },
            },
          },
          errorCode: {
            type: 'string',
            nullable: true, // ✅ Also fixed: made errorCode nullable
          },
        },
      },
    }),
  );
}
```

## What Changed

1. **Added `ApiExtraModels()`**: Registers the model and related classes
2. **Made `errorCode` nullable**: Changed from `type: 'string'` to include `nullable: true`

## Correct Swagger Schema

Now the schema correctly shows:

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "data": [
      {
        "id": "user-123",
        "email": "user@example.com",
        "role": "FAN",
        "isOnline": true,
        "isActive": true,
        // ... all UserDto properties with correct types
      }
    ],
    "paging": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  },
  "error": null,
  "errorCode": null
}
```

## How It Works

```typescript
// In your controller
@Get('users')
@ApiPaginationResponse(UserDto)  // ← Pass your DTO class
async getUsers(@Query() query: PaginationDto) {
  // implementation
}
```

The decorator chain works like this:

1. **`ApiExtraModels(model, ...)`**
   - Registers `UserDto` with Swagger's schema registry
   - Also registers `PaginationResponse`, `PageInfo`, `BaseResponse`
   - Creates schema definitions that can be referenced via `$ref`

2. **`ApiOkResponse({ schema: ... })`**
   - Defines the response structure
   - Uses `$ref: getSchemaPath(UserDto)` to reference the registered schema
   - Swagger resolves the `$ref` and inlines the full `UserDto` schema

3. **Result**: Swagger UI shows the complete, type-accurate schema

## Verification

After restarting your server, check Swagger UI at `http://localhost:8080/api/docs`:

1. Navigate to your endpoint with `@ApiPaginationResponse(UserDto)`
2. Expand the response schema
3. You should see:
   - ✅ Full `UserDto` properties (id, email, role, etc.) with correct types
   - ✅ Each property showing its `@ApiProperty()` description and example
   - ✅ Proper enum values for enum fields (like `role: "FAN" | "IDOL" | "ADMIN"`)
   - ✅ Optional fields marked with `?`

## Common Issues

### Issue 1: Still showing "string"
**Cause**: DTO class doesn't use `@ApiProperty()` decorators
**Fix**: Add `@ApiProperty()` to all DTO fields:
```typescript
export class UserDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  id: string;
  
  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  email: string;
  
  // ... etc
}
```

### Issue 2: "Cannot read property of undefined"
**Cause**: Circular dependency or missing imports
**Fix**: Ensure all referenced classes are imported at the top:
```typescript
import { PaginationResponse, PageInfo } from '@shared/dto/pagination-response.dto';
```

### Issue 3: Schema not updating
**Cause**: Swagger cache or server not restarted
**Fix**: 
1. Stop the dev server (Ctrl+C)
2. Clear `.nest` cache: `rm -rf dist .nest`
3. Restart: `yarn start:dev`
4. Hard refresh Swagger UI (Ctrl+Shift+R)

## Testing the Fix

```bash
# 1. Restart server
yarn start:dev

# 2. Open Swagger UI
open http://localhost:8080/api/docs

# 3. Find endpoint with pagination
# Look for endpoints using @ApiPaginationResponse()

# 4. Check "Responses" → "200" → "Schema"
# Should show full DTO structure, not ["string"]

# 5. Test the actual API
curl -X GET "http://localhost:8080/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Related Files
- `/src/core/decorator/doc.decorator.ts` - Decorator implementation (FIXED)
- `/src/domain/user/response/user.response.ts` - Example DTO with proper decorators
- `/src/shared/dto/pagination-response.dto.ts` - Pagination wrapper classes
- `/docs/PAGINATION_DECORATOR.md` - Usage guide

## Key Takeaway

**Always use `ApiExtraModels()` when using `$ref` and `getSchemaPath()`** in custom Swagger decorators. Without it, Swagger cannot resolve the model references and will show generic types like `"string"` instead of the actual DTO structure.

```typescript
// ✅ Correct pattern
export function MyCustomResponse(model: Type<any>) {
  return applyDecorators(
    ApiExtraModels(model),  // ← Register first!
    ApiOkResponse({
      schema: {
        properties: {
          data: { $ref: getSchemaPath(model) }  // ← Then reference
        }
      }
    })
  );
}
```
