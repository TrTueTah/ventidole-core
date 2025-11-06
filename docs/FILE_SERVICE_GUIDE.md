# File Service Documentation

## Overview
The File Service provides comprehensive file management capabilities using Firebase Storage. It supports file uploads, deletions, URL generation, and various file operations.

## Features

- ✅ Single and multiple file uploads
- ✅ File validation (size and MIME type)
- ✅ Public and signed URL generation
- ✅ File metadata retrieval
- ✅ Folder management
- ✅ File existence checking
- ✅ Secure file operations with JWT authentication

## Configuration

### Environment Variables
Make sure you have the following Firebase configuration in your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

### Storage Bucket
The default storage bucket is automatically configured as: `{FIREBASE_PROJECT_ID}.appspot.com`

## API Endpoints

### 1. Upload File
**POST** `/v1/file/upload`

Upload a single file to Firebase Storage.

**Headers:**
- `Authorization: Bearer {token}`

**Request (multipart/form-data):**
```typescript
{
  file: File,
  folder: 'posts' | 'profiles' | 'attachments' | 'documents' | 'thumbnails' | 'temp',
  customFileName?: string
}
```

**Response:**
```json
{
  "url": "https://storage.googleapis.com/bucket-name/posts/file-uuid.jpg",
  "fileName": "file-uuid.jpg",
  "filePath": "posts/file-uuid.jpg",
  "size": 102400,
  "mimeType": "image/jpeg",
  "uploadedAt": "2025-11-06T08:00:00.000Z"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:8080/v1/file/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=posts" \
  -F "customFileName=my-custom-name"
```

---

### 2. Upload Multiple Files
**POST** `/v1/file/upload-multiple`

Upload multiple files at once.

**Headers:**
- `Authorization: Bearer {token}`

**Request (multipart/form-data):**
```typescript
{
  files: File[],
  folder: string
}
```

---

### 3. Delete File
**DELETE** `/v1/file/delete`

Delete a file from storage.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "filePath": "posts/file-uuid.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 4. Get File URL
**GET** `/v1/file/url?filePath={filePath}`

Get the public URL of a file.

**Query Parameters:**
- `filePath`: Path to the file in storage

**Response:**
```json
{
  "url": "https://storage.googleapis.com/bucket-name/posts/file-uuid.jpg"
}
```

---

### 5. Get Signed URL
**GET** `/v1/file/signed-url?filePath={filePath}&expiresInMinutes={minutes}`

Generate a temporary signed URL for secure file access.

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `filePath`: Path to the file
- `expiresInMinutes`: Expiration time (default: 60)

**Response:**
```json
{
  "signedUrl": "https://storage.googleapis.com/bucket-name/posts/file-uuid.jpg?X-Goog-Algorithm=...",
  "expiresAt": "2025-11-06T09:00:00.000Z"
}
```

---

### 6. Check File Exists
**GET** `/v1/file/exists?filePath={filePath}`

Check if a file exists in storage.

**Response:**
```json
{
  "exists": true
}
```

---

### 7. Get File Metadata
**GET** `/v1/file/metadata?filePath={filePath}`

Get detailed metadata about a file.

**Headers:**
- `Authorization: Bearer {token}`

---

### 8. List Files in Folder
**GET** `/v1/file/list?folder={folder}`

List all files in a specific folder.

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "files": [
    "posts/file-1.jpg",
    "posts/file-2.png",
    "posts/file-3.pdf"
  ]
}
```

---

### 9. Delete Folder
**DELETE** `/v1/file/folder`

Delete all files in a folder.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "folder": "temp"
}
```

---

## Usage Examples

### In a Service

```typescript
import { Injectable } from '@nestjs/common';
import { FileService } from '@shared/service/file/file.service';
import { FileFolder } from '@shared/enum/file.enum';

@Injectable()
export class PostService {
  constructor(private readonly fileService: FileService) {}

  async createPostWithImage(file: Buffer, originalName: string, mimeType: string) {
    // Upload file
    const uploadResult = await this.fileService.uploadFile({
      file,
      originalName,
      mimeType,
      folder: FileFolder.Posts,
      userId: 'user-123',
    });

    // Save post with image URL
    const post = await this.savePost({
      imageUrl: uploadResult.url,
      imagePath: uploadResult.filePath,
    });

    return post;
  }

  async deletePost(postId: string, imagePath: string) {
    // Delete file from storage
    await this.fileService.deleteFile({ filePath: imagePath });

    // Delete post from database
    await this.deletePostFromDb(postId);
  }
}
```

### With Custom Validation

```typescript
const uploadResult = await this.fileService.uploadFile(
  {
    file: buffer,
    originalName: 'photo.jpg',
    mimeType: 'image/jpeg',
    folder: FileFolder.Profiles,
  },
  {
    maxSizeInMB: 5, // 5MB max
    allowedMimeTypes: [
      AllowedMimeType.JPEG,
      AllowedMimeType.PNG,
      AllowedMimeType.WEBP,
    ],
  }
);
```

---

## File Validation

### Default Limits
- **Max File Size:** 10MB
- **Allowed MIME Types:** All types in `AllowedMimeType` enum

### Allowed File Types

#### Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WEBP (`image/webp`)
- SVG (`image/svg+xml`)

#### Documents
- PDF (`application/pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- PowerPoint (`.ppt`, `.pptx`)

#### Text
- Plain Text (`text/plain`)
- CSV (`text/csv`)

#### Video
- MP4 (`video/mp4`)
- WEBM (`video/webm`)
- OGG (`video/ogg`)

#### Audio
- MP3 (`audio/mpeg`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)

---

## Folder Structure

Files are organized into the following folders:

- **profiles** - User profile images
- **posts** - Post images and media
- **attachments** - General attachments
- **documents** - Document files
- **thumbnails** - Image thumbnails
- **temp** - Temporary files

---

## Error Handling

### Error Codes

- `FILE_TOO_LARGE` - File exceeds maximum size
- `INVALID_FILE_TYPE` - File type not allowed
- `UPLOAD_FAILED` - Upload operation failed
- `DELETE_FAILED` - Delete operation failed
- `FILE_NOT_FOUND` - File doesn't exist
- `INVALID_FILE_NAME` - Invalid file name provided

### Error Response Example

```json
{
  "statusCode": 400,
  "message": "File size exceeds maximum allowed size of 10MB",
  "code": "FILE_TOO_LARGE"
}
```

---

## Security

- All upload/delete operations require JWT authentication
- Files are validated for size and type before upload
- Signed URLs provide temporary secure access
- File paths are sanitized to prevent path traversal attacks

---

## Best Practices

1. **Always delete files when deleting related entities**
   ```typescript
   await this.fileService.deleteFile({ filePath: post.imagePath });
   await this.postRepository.delete(postId);
   ```

2. **Use signed URLs for sensitive content**
   ```typescript
   const signedUrl = await this.fileService.getSignedUrl(filePath, 30); // 30 min expiry
   ```

3. **Validate file types on frontend AND backend**

4. **Use appropriate folders for organization**

5. **Clean up temporary files periodically**
   ```typescript
   await this.fileService.deleteFolder(FileFolder.Temp);
   ```

6. **Store file paths in database for easy deletion**

---

## Testing

```typescript
// Example test
describe('FileService', () => {
  it('should upload a file successfully', async () => {
    const mockFile = Buffer.from('test content');
    
    const result = await fileService.uploadFile({
      file: mockFile,
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      folder: FileFolder.Posts,
    });

    expect(result.url).toContain('storage.googleapis.com');
    expect(result.fileName).toBeTruthy();
  });
});
```

---

## Troubleshooting

### Issue: "Failed to upload file to storage"
- Check Firebase credentials in `.env`
- Verify storage bucket exists in Firebase Console
- Check internet connectivity

### Issue: "File not found"
- Verify file path is correct
- Check if file was successfully uploaded
- Ensure file wasn't already deleted

### Issue: "NOAUTH Authentication required"
- Update Firebase service account credentials
- Verify service account has Storage Admin role

---

## Additional Resources

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
