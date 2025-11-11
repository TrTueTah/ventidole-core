# Group Management - Admin Endpoints

## Overview
Admin endpoints for creating and managing K-pop groups in the Ventidole platform.

## Endpoints

### POST /admin/groups
Create a new group (Admin only)

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "groupName": "StarLight",
  "description": "A talented K-pop group known for their powerful performances",
  "logoUrl": "https://res.cloudinary.com/bucket/starlight-logo.jpg",
  "backgroundUrl": "https://res.cloudinary.com/bucket/starlight-bg.jpg"
}
```

**Validation:**
- `groupName`: Required, max 100 characters, must be unique
- `description`: Optional, max 500 characters
- `logoUrl`: Optional, max 255 characters
- `backgroundUrl`: Optional, max 255 characters

**Response:**
```json
{
  "code": 0,
  "data": {
    "id": "clxx123abc",
    "groupName": "StarLight",
    "description": "A talented K-pop group known for their powerful performances",
    "logoUrl": "https://res.cloudinary.com/bucket/starlight-logo.jpg",
    "backgroundUrl": "https://res.cloudinary.com/bucket/starlight-bg.jpg",
    "isActive": true,
    "createdAt": "2025-11-11T10:00:00.000Z",
    "updatedAt": "2025-11-11T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not admin
- `400 ValidationFailed`: Group name already exists

---

### GET /admin/groups
Get all groups with idols and statistics (Admin only)

**Authentication:** Required (Admin role)

**Response:**
```json
{
  "code": 0,
  "data": [
    {
      "id": "clxx123abc",
      "groupName": "StarLight",
      "description": "A talented K-pop group known for their powerful performances",
      "logoUrl": "https://res.cloudinary.com/bucket/starlight-logo.jpg",
      "backgroundUrl": "https://res.cloudinary.com/bucket/starlight-bg.jpg",
      "isActive": true,
      "createdAt": "2025-11-11T10:00:00.000Z",
      "updatedAt": "2025-11-11T10:00:00.000Z",
      "idols": [
        {
          "id": "idol_xyz789",
          "stageName": "Luna Star",
          "avatarUrl": "https://cdn.example.com/luna.jpg"
        },
        {
          "id": "idol_abc456",
          "stageName": "Solar Kim",
          "avatarUrl": "https://cdn.example.com/solar.jpg"
        }
      ],
      "_count": {
        "idols": 2,
        "followers": 15000
      }
    }
  ]
}
```

**Features:**
- Lists all active groups
- Includes active idols for each group
- Shows follower count and idol count
- Ordered by creation date (newest first)

---

## Usage Examples

### Create a Group
```bash
curl -X POST http://localhost:8080/admin/groups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "StarLight",
    "description": "A talented K-pop group known for their powerful performances",
    "logoUrl": "https://res.cloudinary.com/bucket/logo.jpg",
    "backgroundUrl": "https://res.cloudinary.com/bucket/bg.jpg"
  }'
```

### Get All Groups
```bash
curl -X GET http://localhost:8080/admin/groups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Complete Workflow: Create Group → Create Idol → Assign to Group
```bash
# 1. Create a group
GROUP_RESPONSE=$(curl -X POST http://localhost:8080/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "StarLight",
    "description": "Rising stars in K-pop",
    "logoUrl": "https://cdn.example.com/starlight-logo.jpg"
  }')

# Extract group ID
GROUP_ID=$(echo $GROUP_RESPONSE | jq -r '.data.id')

# 2. Create idol and assign to group
curl -X POST http://localhost:8080/admin/idols \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luna@starlight.com",
    "password": "SecurePass@123",
    "stageName": "Luna Star",
    "groupId": "'$GROUP_ID'",
    "avatarUrl": "https://cdn.example.com/luna.jpg",
    "bio": "Main vocalist of StarLight 🎤✨"
  }'

# 3. Verify group has the idol
curl -X GET http://localhost:8080/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Database Schema

### Group Model
```prisma
model Group {
  id              String            @id @default(cuid())
  isActive        Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  version         Int               @default(0)
  description     String?           @db.VarChar(500)
  logoUrl         String?           @db.VarChar(255)
  backgroundUrl   String?           @db.VarChar(255)
  groupName       String            @db.VarChar(100)
  idols           Idol[]
  followers       FanFollowGroup[]
  chatChannels    ChatChannel[]
}
```

## Business Rules

1. **Group Name Uniqueness**: Each group must have a unique name
2. **Active Groups Only**: GET endpoint only returns active groups (`isActive: true`)
3. **Cascade Relations**: Groups are connected to:
   - Idols (members of the group)
   - Followers (fans following the group)
   - Chat Channels (announcement channels for the group)

## Integration Points

### With Idol Creation
- When creating an idol via `POST /admin/idols`, the `groupId` must reference an existing group
- Idols are automatically associated with their group
- Group's idol count is automatically updated

### With Chat System
- Groups can have announcement channels
- Idols can create channels associated with their group
- Fans can follow groups to receive updates

### With Fan System
- Fans can follow groups via `FanFollowGroup` relationship
- Follower count tracked automatically

## Error Handling

### ValidationFailed
Thrown when:
- Group name already exists
- Invalid data format
- Missing required fields

### Unauthenticated
Thrown when:
- No JWT token provided
- Invalid JWT token
- Expired JWT token

### Unauthorized
Thrown when:
- User is not an admin
- Insufficient permissions

## Testing

```typescript
describe('Group Management', () => {
  it('should create a group', async () => {
    const response = await request(app)
      .post('/admin/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        groupName: 'Test Group',
        description: 'A test K-pop group',
      })
      .expect(201);

    expect(response.body.data.groupName).toBe('Test Group');
    expect(response.body.data.isActive).toBe(true);
  });

  it('should reject duplicate group names', async () => {
    // Create first group
    await createTestGroup('StarLight');

    // Try to create duplicate
    await request(app)
      .post('/admin/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ groupName: 'StarLight' })
      .expect(400);
  });

  it('should list all groups with idols', async () => {
    const response = await request(app)
      .get('/admin/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0].idols).toBeDefined();
    expect(response.body.data[0]._count).toBeDefined();
  });

  it('should reject non-admin users', async () => {
    await request(app)
      .post('/admin/groups')
      .set('Authorization', `Bearer ${fanToken}`)
      .send({ groupName: 'Test Group' })
      .expect(403);
  });
});
```

## Future Enhancements

- [ ] Update group endpoint (PUT /admin/groups/:id)
- [ ] Delete group endpoint (DELETE /admin/groups/:id)
- [ ] Deactivate/activate group (PATCH /admin/groups/:id/status)
- [ ] Get group by ID with detailed statistics
- [ ] Upload group logo/background directly
- [ ] Group social media links
- [ ] Group debut date and anniversary tracking
- [ ] Group awards and achievements
- [ ] Group discography integration
