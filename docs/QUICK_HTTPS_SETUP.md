# Quick HTTPS Setup

## 🚀 Quick Start (5 Minutes)

### 1. Point Your Domain
```
DNS A Record: api.yourdomain.com → 35.193.66.111
Wait 5-10 minutes for propagation
```

### 2. SSH to Server
```bash
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
```

### 3. Get SSL Certificate
```bash
# Install certbot
sudo apt update && sudo apt install certbot -y

# Stop current services
docker-compose -f docker/prod/docker-compose.yaml down

# Get certificate (replace with your domain)
sudo certbot certonly --standalone \
    -d api.yourdomain.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

### 4. Update Configuration
```bash
# Pull latest code (includes nginx configs)
git pull origin main

# Edit nginx config - replace 'yourdomain.com' with your domain
nano config.d/nginx/default.prod.conf
```

Update these lines:
- Line 23: `server_name api.yourdomain.com;`
- Line 27-28: Certificate paths with your domain
- Line 42: Trusted certificate path

### 5. Uncomment Gateway in docker-compose.yaml
```bash
nano docker/prod/docker-compose.yaml
```

Uncomment the `gateway` service section (lines ~23-35).

### 6. Start with HTTPS
```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### 7. Test
```bash
curl -I https://api.yourdomain.com
```

Browser: `https://api.yourdomain.com/docs`

## 🔄 Auto-Renewal
```bash
# Setup auto-renewal
sudo crontab -e

# Add this line:
0 0 * * * certbot renew --quiet --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"
```

## ✅ Done!

Your API is now accessible via HTTPS! 🎉

---

For detailed guide, see: `docs/HTTPS_SETUP_GUIDE.md`
