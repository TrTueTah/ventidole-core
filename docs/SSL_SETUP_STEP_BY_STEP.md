# Step-by-Step SSL Certificate Setup

## 🚨 Current Issue

```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/api-prod.ventidole.xyz/fullchain.pem"
```

**Problem**: Nginx is trying to load SSL certificates that don't exist yet.

## ✅ Solution: Two-Phase Setup

### Phase 1: Start with HTTP (Get Certificates)
### Phase 2: Switch to HTTPS (Use Certificates)

---

## 📋 Phase 1: HTTP Setup & Certificate Generation

### Step 1: SSH to your server

```bash
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
git pull origin main
```

### Step 2: Use temporary HTTP-only config

```bash
# Backup current config
cp config.d/nginx/default.prod.conf config.d/nginx/default.prod.conf.backup

# Use temporary HTTP-only config
cp config.d/nginx/default.temp.conf config.d/nginx/default.prod.conf
```

### Step 3: Update docker-compose to expose port 80

Edit `docker/prod/docker-compose.yaml`:

```yaml
gateway:
  image: nginx:alpine
  container_name: ${PROJECT}-gateway
  ports:
    - "80:80"      # HTTP only for now
  volumes:
    - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ../../config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro
    # Comment out SSL certificate volumes for now
    # - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
    # - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
  depends_on:
    - server
  restart: always
```

### Step 4: Start containers (HTTP only)

```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml down
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### Step 5: Test HTTP access

```bash
# Should work now
curl -I http://api-prod.ventidole.xyz
```

### Step 6: Stop containers to free port 80

```bash
docker-compose -f docker/prod/docker-compose.yaml down
```

### Step 7: Get SSL certificate using DNS-01 challenge

Since DNSSEC is still broken, use DNS-01:

```bash
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api-prod.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com
```

**Follow the prompts:**
1. Certbot will show you a TXT record value
2. Add to your DNS:
   - Type: `TXT`
   - Name: `_acme-challenge.api`
   - Value: (paste the value)
   - TTL: `300`
3. Verify: `dig _acme-challenge.api-prod.ventidole.xyz TXT +short`
4. Wait 2 minutes
5. Press Enter in certbot
6. Certificate generated! ✅

### Step 8: Verify certificates exist

```bash
sudo ls -la /etc/letsencrypt/live/api-prod.ventidole.xyz/

# Should show:
# cert.pem
# chain.pem
# fullchain.pem
# privkey.pem
```

---

## 📋 Phase 2: Switch to HTTPS

### Step 1: Restore production nginx config with SSL

```bash
# Restore the backup (which has HTTPS config)
cp config.d/nginx/default.prod.conf.backup config.d/nginx/default.prod.conf
```

### Step 2: Update docker-compose for HTTPS

Edit `docker/prod/docker-compose.yaml`:

```yaml
gateway:
  image: nginx:alpine
  container_name: ${PROJECT}-gateway
  ports:
    - "443:443"    # HTTPS
    - "80:80"      # HTTP (optional - for redirects)
  volumes:
    - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ../../config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
    - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
  depends_on:
    - server
  restart: always
```

### Step 3: Open firewall for HTTPS

```bash
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0
```

### Step 4: Start with HTTPS

```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### Step 5: Test HTTPS

```bash
curl -I https://api-prod.ventidole.xyz
```

### Step 6: Access Swagger

```bash
# Open in browser
https://api-prod.ventidole.xyz/docs
```

---

## 🚀 Quick Commands (Copy-Paste)

### Phase 1: Get Certificates

```bash
# On server
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
git pull origin main

# Use HTTP-only config
cp config.d/nginx/default.temp.conf config.d/nginx/default.prod.conf

# Edit docker-compose.yaml - comment out SSL volumes, use only port 80
nano docker/prod/docker-compose.yaml

# Start HTTP
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Test
curl -I http://api-prod.ventidole.xyz

# Stop for certbot
docker-compose -f docker/prod/docker-compose.yaml down

# Get certificate (DNS-01)
sudo certbot certonly --manual --preferred-challenges dns -d api-prod.ventidole.xyz --agree-tos --email your-email@example.com

# Verify
sudo ls -la /etc/letsencrypt/live/api-prod.ventidole.xyz/
```

### Phase 2: Enable HTTPS

```bash
# Restore production config
git checkout config.d/nginx/default.prod.conf

# Edit docker-compose.yaml - enable SSL volumes, use ports 443 & 80
nano docker/prod/docker-compose.yaml

# Open firewall
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0

# Start HTTPS
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Test
curl -I https://api-prod.ventidole.xyz
```

---

## 🔧 Alternative: HTTP-01 Challenge (If DNSSEC is Fixed)

If your DNSSEC issue is resolved:

```bash
# Stop containers
docker-compose -f docker/prod/docker-compose.yaml down

# Get certificate via HTTP-01 (simpler)
sudo certbot certonly --standalone \
    -d api-prod.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com
```

---

## 📝 Docker-Compose Configurations

### For Phase 1 (HTTP only):

```yaml
gateway:
  ports:
    - "80:80"
  volumes:
    - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ../../config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro
    # SSL volumes commented out
```

### For Phase 2 (HTTPS):

```yaml
gateway:
  ports:
    - "443:443"
    - "80:80"
  volumes:
    - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ../../config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
    - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
```

---

## ⚠️ Common Issues

### Issue: "cannot load certificate"

**Cause**: Certificates don't exist yet
**Solution**: Follow Phase 1 to generate certificates first

### Issue: "Address already in use" on port 80

**Cause**: Containers still running
**Solution**: `docker-compose down` before certbot

### Issue: DNSSEC validation failure

**Cause**: DNSSEC still broken
**Solution**: Use DNS-01 challenge (manual TXT record)

### Issue: HTTP/2 deprecation warning

**Fixed**: Updated nginx config to use `http2 on;` directive

---

## ✅ Success Checklist

- [ ] Phase 1: HTTP works (`curl -I http://api-prod.ventidole.xyz`)
- [ ] Certificates generated (`sudo ls /etc/letsencrypt/live/api-prod.ventidole.xyz/`)
- [ ] Phase 2: HTTPS works (`curl -I https://api-prod.ventidole.xyz`)
- [ ] Swagger accessible (`https://api-prod.ventidole.xyz/docs`)
- [ ] No nginx warnings in logs
- [ ] Firewall rules configured (443, 80)

---

**TL;DR**: 
1. Start with HTTP-only config (no SSL)
2. Get certificates via DNS-01 challenge
3. Switch to HTTPS config with certificates
4. Enjoy! 🎉
