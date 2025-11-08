# Cross-Origin-Opener-Policy Warning Fix

## 🐛 Problem

Browser console warning:
```
The Cross-Origin-Opener-Policy header has been ignored, because the URL's origin was untrustworthy. 
It was defined either in the final response or a redirect. Please deliver the response using the 
HTTPS protocol. You can also use the 'localhost' origin instead.
```

## 🔍 Root Cause

Helmet.js sets strict security headers by default, including:
- `Cross-Origin-Opener-Policy` (COOP)
- `Cross-Origin-Embedder-Policy` (COEP)

These headers are designed for HTTPS environments and cause warnings when used over HTTP.

## ✅ Solution Applied

Updated `src/main.ts` to configure Helmet with appropriate settings:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],    // For Swagger UI
        scriptSrc: ["'self'", "'unsafe-inline'"],   // For Swagger UI
        imgSrc: ["'self'", 'data:', 'https:'],      // For Swagger images
      },
    },
    crossOriginOpenerPolicy: false,   // Disable for HTTP environments
    crossOriginEmbedderPolicy: false, // Disable for HTTP environments
  }),
);
```

## 📋 What Changed

### Disabled Headers for HTTP:
- ❌ `Cross-Origin-Opener-Policy` - Disabled (causes warnings on HTTP)
- ❌ `Cross-Origin-Embedder-Policy` - Disabled (causes warnings on HTTP)

### Configured for Swagger:
- ✅ `Content-Security-Policy` - Allows inline styles/scripts for Swagger UI
- ✅ Other Helmet protections remain active (XSS, frame options, etc.)

## 🎯 Benefits

1. **No more console warnings** - COOP/COEP disabled for HTTP
2. **Swagger UI works** - CSP allows necessary inline content
3. **Still secure** - Other Helmet protections remain active:
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - etc.

## 🔒 Production Considerations

### For HTTPS Production Environments

If you deploy with HTTPS/SSL, you can re-enable these headers for better security:

```typescript
// In src/main.ts
import { NodeEnv } from '@shared/enum/environment.enum';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    // Only enable COOP/COEP in production with HTTPS
    crossOriginOpenerPolicy: ENVIRONMENT.NODE_ENV === NodeEnv.Production 
      ? { policy: 'same-origin' } 
      : false,
    crossOriginEmbedderPolicy: ENVIRONMENT.NODE_ENV === NodeEnv.Production
      ? true
      : false,
  }),
);
```

### Setting Up HTTPS

Your nginx gateway in `docker/prod/docker-compose.yaml` is already configured for SSL:

```yaml
gateway:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
    - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
```

To enable HTTPS:

1. **Uncomment the gateway service** in your docker-compose.yaml
2. **Get SSL certificates** using Let's Encrypt:
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```
3. **Configure nginx** to use the certificates
4. **Re-enable COOP/COEP** headers in production

## 🧪 Verification

After this fix:

```bash
# Start server
npm run start:dev

# Access in browser
open http://localhost:3000/docs
```

✅ No console warnings
✅ Swagger UI loads correctly
✅ API works normally

## 📚 Additional Resources

- [Helmet.js Configuration](https://helmetjs.github.io/)
- [Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
- [Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🚀 Deployment

```bash
git add src/main.ts
git commit -m "fix: configure helmet for HTTP environments"
git push origin main
```

The GitHub Actions workflow will automatically deploy to GCP.

---

**Note**: These settings are appropriate for development and HTTP environments. For production HTTPS deployments, consider re-enabling COOP/COEP headers for enhanced security isolation.
