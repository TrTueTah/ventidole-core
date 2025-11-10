# API Response Pattern - BaseResponse Wrapper

## Overview

All API endpoints in the Post feature now return responses wrapped in the `BaseResponse` pattern, ensuring consistency across the entire API.

## BaseResponse Structure

```typescript
class BaseResponse<T> {
  statusCode: number;     // HTTP status code (200, 201, 400, etc.)
  message: string;        // Response message ("OK", "CREATED", error message)
  data: T | null;        // Actual response data
  error?: unknown;       // Error details (if any)
  errorCode?: ErrorCode; // Application-specific error code (if any)
}
```

## Response Examples

### Success Response (Create Post)
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "postId": "post-abc123",
    "userId": "user-456",
    "username": "johndoe",
    "displayName": "John Doe",
    "content": "Hello world!",
    "mediaUrls": [],
    "hashtags": ["hello"],
    "mentions": [],
    "location": null,
    "createdAt": "2025-11-10T10:30:00Z",
    "counters": {
      "likesCount": 0,
      "commentsCount": 0,
      "sharesCount": 0
    }
  },
  "error": null
}
```

### Success Response with Pagination (Get Posts)
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "data": [
      {
        "postId": "post-1",
        "userId": "user-123",
        "displayName": "John Doe",
        "content": "First post",
        // ... other fields
      },
      {
        "postId": "post-2",
        "userId": "user-456",
        "displayName": "Jane Smith",
        "content": "Second post",
        // ... other fields
      }
    ],
    "paging": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  },
  "error": null
}
```

### Update/Delete Response
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "postId": "post-abc123",
    "message": "Post updated successfully",
    "updatedAt": "2025-11-10T10:35:00Z"
  },
  "error": null
}
```

### Error Response
```json
{
  "statusCode": 404,
  "message": "Post not found",
  "data": null,
  "error": {
    "details": "Post with ID 'invalid-id' does not exist"
  },
  "errorCode": "POST_NOT_FOUND"
}
```

## Implementation Pattern

### Service Layer
All service methods return `BaseResponse<T>`:

```typescript
// Before
async createPost(...): Promise<CreatePostResponse> {
  const response: CreatePostResponse = { /* ... */ };
  return response;
}

// After
async createPost(...): Promise<BaseResponse<CreatePostResponse>> {
  const response: CreatePostResponse = { /* ... */ };
  return BaseResponse.of(response);
}
```

### Helper Methods

```typescript
// Success with data
BaseResponse.of(data)
// Example: BaseResponse.of(createPostResponse)

// Success without data
BaseResponse.ok()
// Example: For operations that don't return data

// Created (201)
BaseResponse.created()
// Example: For resource creation

// Error with custom message
BaseResponse.fault(errorMessage, data)
// Example: For validation errors

// Exception
BaseResponse.exception(statusCode, errorCode, message, error)
// Example: For system errors
```

## Benefits

### 1. **Consistency** ✅
All endpoints return the same structure, making client integration easier:
```typescript
// Client knows what to expect
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
}
```

### 2. **Error Handling** ✅
Consistent error format across all endpoints:
```typescript
if (response.statusCode !== 200) {
  console.error(response.message, response.error);
}
```

### 3. **Type Safety** ✅
TypeScript ensures correct data types:
```typescript
const response: BaseResponse<CreatePostResponse> = await api.createPost();
// response.data is typed as CreatePostResponse
```

### 4. **Swagger Documentation** ✅
API docs show the complete response structure including wrapper:
```yaml
responses:
  200:
    description: Success
    content:
      application/json:
        schema:
          type: object
          properties:
            statusCode:
              type: number
            message:
              type: string
            data:
              $ref: '#/components/schemas/CreatePostResponse'
```

## Migration from Direct Returns

### Before (Direct Object Return)
```typescript
// Service
async createPost(...): Promise<CreatePostResponse> {
  return {
    postId,
    userId,
    // ...
  };
}

// Controller
@Post()
createPost(@Body() body: CreatePostRequest) {
  return this.postService.createPost(body);
}

// Client receives
{
  "postId": "post-123",
  "userId": "user-456",
  // ...
}
```

### After (BaseResponse Wrapper)
```typescript
// Service
async createPost(...): Promise<BaseResponse<CreatePostResponse>> {
  const response: CreatePostResponse = {
    postId,
    userId,
    // ...
  };
  return BaseResponse.of(response);
}

// Controller (unchanged)
@Post()
createPost(@Body() body: CreatePostRequest) {
  return this.postService.createPost(body);
}

// Client receives
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "postId": "post-123",
    "userId": "user-456",
    // ...
  }
}
```

## All Post Endpoints with BaseResponse

| Endpoint | Method | Response Type | Wrapper |
|----------|--------|---------------|---------|
| `/v1/post` | POST | `BaseResponse<CreatePostResponse>` | ✅ |
| `/v1/post` | GET | `BaseResponse<GetPostsResponse>` | ✅ |
| `/v1/post/:id` | GET | `BaseResponse<GetPostResponse>` | ✅ |
| `/v1/post/:id` | PATCH | `BaseResponse<UpdatePostResponse>` | ✅ |
| `/v1/post/:id` | DELETE | `BaseResponse<DeletePostResponse>` | ✅ |

## Client-Side Usage

### TypeScript Client
```typescript
interface BaseResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  error?: unknown;
}

// Creating a post
const response = await fetch('/v1/post', {
  method: 'POST',
  body: JSON.stringify(postData),
  headers: { 'Authorization': 'Bearer token' }
});

const result: BaseResponse<CreatePostResponse> = await response.json();

if (result.statusCode === 200 && result.data) {
  console.log('Post created:', result.data.postId);
} else {
  console.error('Error:', result.message);
}
```

### JavaScript Client
```javascript
// Getting posts with pagination
const response = await fetch('/v1/post?page=1&limit=20');
const result = await response.json();

if (result.statusCode === 200) {
  const { data, paging } = result.data;
  console.log(`Showing ${data.length} of ${paging.total} posts`);
  data.forEach(post => {
    console.log(`${post.displayName}: ${post.content}`);
  });
}
```

### React Hook Example
```typescript
const useCreatePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (data: CreatePostRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/v1/post', data);
      const result: BaseResponse<CreatePostResponse> = response.data;
      
      if (result.statusCode === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading, error };
};
```

## Best Practices

### ✅ DO:
- Always wrap service responses with `BaseResponse.of()`
- Use appropriate status codes (200, 201, 400, 404, etc.)
- Provide clear error messages
- Include error details when available
- Keep response data structure consistent

### ❌ DON'T:
- Return raw objects from services
- Mix wrapped and unwrapped responses
- Include sensitive data in error responses
- Return inconsistent structures
- Forget to handle null data in error cases

## Advantages Over Direct Returns

1. **Metadata Included**: Status codes and messages are part of the response
2. **Error Information**: Standardized error handling
3. **Future Extensibility**: Easy to add fields (e.g., `requestId`, `timestamp`)
4. **Monitoring**: Status codes make it easier to track API health
5. **Client Libraries**: Easier to build generic API clients

## Testing

### Example Test
```typescript
describe('PostService', () => {
  it('should return BaseResponse when creating a post', async () => {
    const result = await postService.createPost(postData, request);
    
    expect(result).toHaveProperty('statusCode', 200);
    expect(result).toHaveProperty('message', 'OK');
    expect(result.data).toHaveProperty('postId');
    expect(result.data?.userId).toBe(request.user.id);
  });

  it('should return error in BaseResponse when post not found', async () => {
    try {
      await postService.getPost('invalid-id', request);
    } catch (error) {
      // Exception handling would wrap this in BaseResponse at HTTP layer
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });
});
```

## Summary

The BaseResponse pattern provides:
- ✅ **Consistent API structure** across all endpoints
- ✅ **Better error handling** with standardized format
- ✅ **Type safety** with TypeScript generics
- ✅ **Easier client integration** with predictable responses
- ✅ **Future-proof** design for adding metadata

This pattern is used by major APIs and is considered a best practice for RESTful API design.
