# Complete Certbot Reset Guide

## 🧹 Clean Start: Remove All Certbot Data

This guide helps you completely remove Certbot and start fresh with SSL certificate generation.

## 🚀 Quick Clean (Automated)

### Step 1: Run the cleanup script

```bash
# SSH to your server
ssh trantanh227@35.193.66.111

# Navigate to project
cd /home/trantanh227/ventidole-core

# Pull latest changes (includes cleanup script)
git pull origin main

# Make script executable
chmod +x scripts/clean-certbot.sh

# Run cleanup
sudo bash scripts/clean-certbot.sh
```

## 🔧 Manual Cleanup (If you prefer)

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Stop containers
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down

# Remove ALL Certbot data
sudo rm -rf /etc/letsencrypt/*
sudo rm -rf /var/lib/letsencrypt/*
sudo rm -rf /var/log/letsencrypt/*

# Recreate directories
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/lib/letsencrypt
sudo mkdir -p /var/log/letsencrypt

# Update Certbot
sudo apt update
sudo apt install -y certbot

# Verify clean state
sudo ls /etc/letsencrypt/live/
# Should be empty or show "ls: cannot access..."
```

## ✅ After Cleanup: Get Fresh Certificate

### Option 1: HTTP-01 Challenge (if DNSSEC is fixed)

First, verify DNS is working:

```bash
# Check DNS resolution
dig api.ventidole.xyz +short
# Should return: 35.193.66.111

# Check DNSSEC is disabled
dig api.ventidole.xyz +dnssec
# Should show: status: NOERROR (NOT SERVFAIL)
# Should NOT have "ad" flag in flags
```

If DNS is clean, get certificate:

```bash
# Ensure containers are stopped
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down

# Get certificate via HTTP-01
sudo certbot certonly --standalone \
    -d api.ventidole.xyz \
    --preferred-challenges http \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

### Option 2: DNS-01 Challenge (works even with DNSSEC issues)

```bash
# Get certificate via DNS-01
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com
```

**Steps for DNS-01:**
1. Certbot will show you a TXT record value
2. Add to your DNS:
   - Type: `TXT`
   - Name: `_acme-challenge.api`
   - Value: `(value from certbot)`
   - TTL: `300`
3. Verify: `dig _acme-challenge.api.ventidole.xyz TXT +short`
4. Wait 2 minutes for DNS propagation
5. Press Enter in certbot
6. Certificate issued! ✅

### Option 3: Automated DNS Challenge (Cloudflare example)

If using Cloudflare DNS:

```bash
# Install Cloudflare plugin
sudo apt install -y python3-certbot-dns-cloudflare

# Create credentials file
sudo mkdir -p ~/.secrets/certbot
sudo nano ~/.secrets/certbot/cloudflare.ini
```

Add to file:
```ini
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
```

Get API token from: https://dash.cloudflare.com/profile/api-tokens
- Use "Edit zone DNS" template
- Zone Resources: Include → Specific zone → ventidole.xyz

```bash
# Secure the file
sudo chmod 600 ~/.secrets/certbot/cloudflare.ini

# Get certificate automatically
sudo certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini \
    -d api.ventidole.xyz \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

## 🎯 After Getting Certificate

### Verify certificate files:

```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/api.ventidole.xyz/

# Should show:
# - cert.pem (certificate)
# - chain.pem (intermediate certificates)
# - fullchain.pem (cert + chain)
# - privkey.pem (private key)
```

### Start your application:

```bash
cd /home/trantanh227/ventidole-core

# Start with HTTPS
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Check logs
docker-compose -f docker/prod/docker-compose.yaml logs -f gateway

# Test HTTPS
curl -I https://api.ventidole.xyz
```

## 🔍 Verify DNSSEC Status Before Starting

Before attempting certificate generation, check DNSSEC:

```bash
# From your local machine
dig api.ventidole.xyz +dnssec
```

**✅ DNSSEC is FIXED if you see:**
```
;; flags: qr rd ra; QUERY: 1, ANSWER: 1
              ^^^ NO "ad" flag

;; ANSWER SECTION:
api.ventidole.xyz.      3600    IN      A       35.193.66.111
                                        ^^^ NO RRSIG record
```

**❌ DNSSEC is STILL BROKEN if you see:**
```
;; flags: qr rd ra ad;  ← "ad" flag present
OR
status: SERVFAIL  ← Server failure
OR
RRSIG records in ANSWER section
```

## 📋 Troubleshooting

### Certificate generation fails with "Connection refused"

**Problem**: Port 80 is blocked or in use

**Solution**:
```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Stop containers
docker-compose -f docker/prod/docker-compose.yaml down

# Check GCP firewall allows port 80
gcloud compute firewall-rules list | grep allow-http

# If not exists, create it
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0
```

### DNSSEC still broken

**Problem**: DS records not removed from registrar

**Solution**: 
1. Go to your domain registrar (where you bought ventidole.xyz)
2. Find DNSSEC or DS Records settings
3. Delete/Remove all DS records
4. Wait 15-30 minutes
5. Use DNS-01 challenge in the meantime

### "Too many failed authorizations recently"

**Problem**: Hit Let's Encrypt rate limit

**Solution**:
```bash
# Use staging server (doesn't count against rate limits)
sudo certbot certonly --standalone \
    --staging \
    -d api.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com

# Once it works, use production (remove --staging)
```

## 🔄 Certificate Renewal Setup

After getting your first certificate:

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup automatic renewal (runs twice daily)
sudo systemctl status certbot.timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 📝 Quick Reference

### Clean everything:
```bash
sudo bash scripts/clean-certbot.sh
```

### Get certificate (HTTP):
```bash
sudo certbot certonly --standalone -d api.ventidole.xyz --agree-tos --email your-email@example.com
```

### Get certificate (DNS):
```bash
sudo certbot certonly --manual --preferred-challenges dns -d api.ventidole.xyz --agree-tos --email your-email@example.com
```

### Start application:
```bash
cd /home/trantanh227/ventidole-core
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### Test:
```bash
curl -I https://api.ventidole.xyz
```

---

**TL;DR**: 
1. Run `sudo bash scripts/clean-certbot.sh`
2. Wait for DNSSEC to be fixed (or use DNS-01 challenge)
3. Get fresh certificate
4. Start containers
5. Enjoy HTTPS! 🎉
