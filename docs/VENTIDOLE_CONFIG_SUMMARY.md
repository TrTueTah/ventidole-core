# Configuration Summary for api-prod.ventidole.xyz

## ✅ What's Been Configured

All configuration files have been updated for your domain: **api-prod.ventidole.xyz**

### Files Modified:

1. ✅ **`config.d/nginx/default.prod.conf`**
   - Server name: `api-prod.ventidole.xyz`
   - HTTP port: `8080`
   - HTTPS port: `8443`
   - SSL certificates: `/etc/letsencrypt/live/api-prod.ventidole.xyz/`

2. ✅ **`docker/prod/docker-compose.yaml`**
   - nginx gateway enabled (uncommented)
   - Ports mapped: `8080:8080` and `8443:8443`
   - Server port hidden (nginx handles traffic)

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ api-prod.ventidole.xyz
                 │ (DNS → 35.193.66.111)
                 │
        ┌────────┴─────────┐
        │                  │
   Port 8080          Port 8443
   (HTTP)             (HTTPS/SSL)
        │                  │
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │  Nginx Gateway   │  ← Handles SSL/TLS
        │   (Container)    │  ← Redirects HTTP→HTTPS
        └────────┬─────────┘
                 │
                 │ Internal Docker Network
                 │ Port 8080
                 │
        ┌────────▼─────────┐
        │   NestJS App     │  ← Your application
        │   (Container)    │  ← HTTP only (internal)
        └──────────────────┘
```

## 📋 Port Configuration

| Port | Protocol | Purpose | Access |
|------|----------|---------|--------|
| 8080 | HTTP | Redirects to HTTPS | Public |
| 8443 | HTTPS | Secure API access | Public |
| 8080 (internal) | HTTP | NestJS app | Docker network only |

## 🚀 Quick Deploy Commands

### On Your Local Machine

```bash
# Commit and push changes
git add .
git commit -m "feat: configure HTTPS for api-prod.ventidole.xyz on ports 8080/8443"
git push origin main
```

### On Your GCP Server

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Navigate to app directory
cd /home/trantanh227/ventidole-core

# Stop current services
docker-compose -f docker/prod/docker-compose.yaml down

# Get SSL certificate (one-time setup)
sudo certbot certonly --standalone \
    -d api-prod.ventidole.xyz \
    --http-01-port 8080 \
    --email your-email@example.com \
    --agree-tos

# Pull latest code
git pull origin main

# Start with HTTPS
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Verify
docker-compose -f docker/prod/docker-compose.yaml ps
```

## 🧪 Test Commands

```bash
# Test HTTP redirect
curl -I http://api-prod.ventidole.xyz:8080
# Expected: 301 Moved Permanently → https://api-prod.ventidole.xyz:8443

# Test HTTPS
curl -I https://api-prod.ventidole.xyz:8443
# Expected: HTTP/2 200

# Test Swagger UI
curl https://api-prod.ventidole.xyz:8443/docs
# Expected: HTML content

# Test API endpoint
curl https://api-prod.ventidole.xyz:8443/v1/your-endpoint
```

## 📱 Browser Access

After deployment, access your API at:

- **Swagger Documentation**: 
  ```
  https://api-prod.ventidole.xyz:8443/docs
  ```

- **API Endpoints**:
  ```
  https://api-prod.ventidole.xyz:8443/v1/auth/...
  https://api-prod.ventidole.xyz:8443/v1/users/...
  https://api-prod.ventidole.xyz:8443/v1/posts/...
  ```

## ⚙️ Environment Variables

Make sure your `.env` file on the server has:

```env
PROJECT=ventidole
PORT=8080

# Other required variables
DATABASE_URL=...
REDIS_HOST=...
# etc.
```

## 🔐 Security Features Enabled

- ✅ **TLS 1.2 & 1.3** - Modern encryption
- ✅ **HTTP/2** - Better performance
- ✅ **HSTS** - Forces HTTPS
- ✅ **Security Headers** - XSS protection, frame options, etc.
- ✅ **OCSP Stapling** - Faster certificate validation
- ✅ **Auto-redirect** - HTTP → HTTPS

## 📅 Maintenance

### Certificate Renewal

Certificates expire after 90 days. Auto-renewal:

```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 0 * * * certbot renew --quiet --http-01-port 8080 --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"
```

### Update Application

```bash
# On server
cd /home/trantanh227/ventidole-core
git pull origin main
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d --build
```

## 🎯 Next Steps

1. **Commit and push** configuration files
2. **Open firewall** ports 8080 and 8443 on GCP
3. **Get SSL certificate** using certbot
4. **Deploy** with the commands above
5. **Test** your HTTPS endpoint
6. **Setup auto-renewal** for certificates

## 📚 Detailed Guide

For step-by-step instructions, see:
- `docs/SETUP_VENTIDOLE_HTTPS.md`

---

**Your Domain**: `api-prod.ventidole.xyz`  
**HTTP**: Port 8080 (redirects)  
**HTTPS**: Port 8443 (secure) 🔒
