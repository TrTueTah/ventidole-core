# SSL Certificate Setup

## 🎯 What You Need

You need an **SSL/TLS certificate** (not a license) to enable HTTPS on nginx.

**nginx is free and open-source** - no license required! ✅

---

## 🚀 Quick Setup (Automated)

### Option 1: Use the Setup Script (Easiest)

```bash
# On your GCP server
ssh trantanh227@35.193.66.111

# Navigate to app directory
cd /home/trantanh227/ventidole-core

# Pull latest code (includes the script)
git pull origin main

# Make script executable
chmod +x scripts/setup-ssl.sh

# Run the setup script
sudo bash scripts/setup-ssl.sh
```

The script will:
- ✅ Install certbot (if needed)
- ✅ Verify DNS configuration
- ✅ Stop containers temporarily
- ✅ Get SSL certificate from Let's Encrypt
- ✅ Start containers with HTTPS
- ✅ Setup auto-renewal
- ✅ Test HTTPS connection

**Time**: ~5 minutes

---

## 📖 Manual Setup

### Option 2: Step-by-Step Commands

```bash
# 1. SSH to server
ssh trantanh227@35.193.66.111

# 2. Install certbot
sudo apt update && sudo apt install certbot -y

# 3. Stop containers
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down

# 4. Get certificate
sudo certbot certonly --standalone \
    -d api-prod.ventidole.xyz \
    --http-01-port 8080 \
    --email your-email@ventidole.xyz \
    --agree-tos

# 5. Start containers with HTTPS
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# 6. Test
curl -I https://api-prod.ventidole.xyz:8443
```

**Time**: ~5 minutes

---

## 📚 Detailed Guide

For complete documentation, see:
- **`docs/SSL_CERTIFICATE_GUIDE.md`** - Full guide with troubleshooting
- **`docs/DEPLOY_NOW.md`** - Complete deployment steps

---

## 🔄 Certificate Auto-Renewal

Certificates expire after 90 days. Auto-renewal is setup automatically by the script.

### Manual Setup:

```bash
sudo crontab -e
```

Add this line:
```
0 0 * * * certbot renew --quiet --http-01-port 8080 --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"
```

---

## ✅ Verification

After setup, verify:

```bash
# Check certificate
sudo certbot certificates

# Test HTTPS
curl -I https://api-prod.ventidole.xyz:8443

# Browser test
https://api-prod.ventidole.xyz:8443/docs
```

---

## 🔍 Troubleshooting

### Port 8080 not accessible
```bash
# Check firewall
gcloud compute firewall-rules list | grep 8080

# Open port if needed
gcloud compute firewall-rules create allow-http-8080 --allow tcp:8080
```

### DNS not configured
```bash
# Check DNS
dig api-prod.ventidole.xyz +short
# Should return your server IP
```

### Certificate exists but nginx can't read
```bash
# Fix permissions
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/
```

For more troubleshooting, see `docs/SSL_CERTIFICATE_GUIDE.md`

---

## 🎯 Summary

1. **nginx** = Free software (no license needed)
2. **SSL Certificate** = What you need for HTTPS (free from Let's Encrypt)
3. **Certbot** = Tool to get certificates (automated)
4. **Setup time** = ~5 minutes
5. **Cost** = $0 (completely free!)

---

## 🚀 Ready to Setup?

**Easiest way:**
```bash
sudo bash scripts/setup-ssl.sh
```

**Manual way:**
See `docs/SSL_CERTIFICATE_GUIDE.md`

---

Your API will be accessible at: **https://api-prod.ventidole.xyz:8443** 🔒
