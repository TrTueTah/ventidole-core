# Create Group Endpoint - Quick Reference

## Endpoint Added ✅

### POST /admin/groups
Create a new K-pop group

**URL:** `http://localhost:8080/admin/groups`  
**Method:** `POST`  
**Auth:** Required (Admin Bearer Token)

---

## Request

```bash
curl -X POST http://localhost:8080/admin/groups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "StarLight",
    "description": "A talented K-pop group known for their powerful performances",
    "logoUrl": "https://res.cloudinary.com/bucket/logo.jpg",
    "backgroundUrl": "https://res.cloudinary.com/bucket/background.jpg"
  }'
```

**Body Schema:**
```typescript
{
  groupName: string;        // Required, max 100 chars, unique
  description?: string;     // Optional, max 500 chars
  logoUrl?: string;         // Optional, max 255 chars
  backgroundUrl?: string;   // Optional, max 255 chars
}
```

---

## Response

**Success (201):**
```json
{
  "code": 0,
  "data": {
    "id": "clxx123abc",
    "groupName": "StarLight",
    "description": "A talented K-pop group known for their powerful performances",
    "logoUrl": "https://res.cloudinary.com/bucket/logo.jpg",
    "backgroundUrl": "https://res.cloudinary.com/bucket/background.jpg",
    "isActive": true,
    "createdAt": "2025-11-11T10:00:00.000Z",
    "updatedAt": "2025-11-11T10:00:00.000Z"
  }
}
```

**Error (400) - Duplicate Group Name:**
```json
{
  "statusCode": 400,
  "errorCode": "validation_failed",
  "message": "Validation failed"
}
```

---

## Additional Endpoint: GET /admin/groups

List all groups with idols and statistics

```bash
curl -X GET http://localhost:8080/admin/groups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "code": 0,
  "data": [
    {
      "id": "clxx123abc",
      "groupName": "StarLight",
      "description": "...",
      "logoUrl": "...",
      "backgroundUrl": "...",
      "isActive": true,
      "createdAt": "2025-11-11T10:00:00.000Z",
      "updatedAt": "2025-11-11T10:00:00.000Z",
      "idols": [
        {
          "id": "idol_xyz789",
          "stageName": "Luna Star",
          "avatarUrl": "https://..."
        }
      ],
      "_count": {
        "idols": 5,
        "followers": 15000
      }
    }
  ]
}
```

---

## Complete Workflow Example

```bash
# 1. Login as admin
ADMIN_TOKEN=$(curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ventidole.com","password":"admin123"}' \
  | jq -r '.data.accessToken')

# 2. Create a group
GROUP_ID=$(curl -X POST http://localhost:8080/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "StarLight",
    "description": "Rising stars in K-pop",
    "logoUrl": "https://cdn.example.com/logo.jpg"
  }' | jq -r '.data.id')

# 3. Create idol in the group
curl -X POST http://localhost:8080/admin/idols \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luna@starlight.com",
    "password": "SecurePass@123",
    "stageName": "Luna Star",
    "groupId": "'$GROUP_ID'",
    "bio": "Main vocalist 🎤"
  }'

# 4. Verify group with idol
curl -X GET http://localhost:8080/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Files Created/Modified

**New Files:**
- ✅ `/src/domain/admin/request/create-group.request.ts`
- ✅ `/src/domain/admin/response/create-group.response.ts`
- ✅ `/docs/ADMIN_GROUP_MANAGEMENT.md`

**Modified Files:**
- ✅ `/src/domain/admin/admin.service.ts` - Added `createGroup()` and `getAllGroups()`
- ✅ `/src/domain/admin/admin.controller.ts` - Added POST and GET group endpoints
- ✅ `/src/domain/admin/request/index.request.ts` - Export CreateGroupRequest
- ✅ `/src/domain/admin/response/index.response.ts` - Export CreateGroupResponse

---

## Features

✅ **Group Creation** - Create new K-pop groups with name, description, images  
✅ **Group Listing** - View all groups with idol members and statistics  
✅ **Unique Names** - Prevents duplicate group names  
✅ **Admin Only** - Protected by admin authentication  
✅ **Idol Count** - Automatically tracks number of idols per group  
✅ **Follower Count** - Tracks number of fans following each group  

---

## Related Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/groups` | POST | Create new group |
| `/admin/groups` | GET | List all groups |
| `/admin/idols` | POST | Create idol (requires groupId) |
| `/admin/idols` | GET | List all idols |

---

## Documentation

📚 **Full Docs:** `/docs/ADMIN_GROUP_MANAGEMENT.md`  
📋 **Implementation:** `/docs/ADMIN_IMPLEMENTATION_SUMMARY.md`
