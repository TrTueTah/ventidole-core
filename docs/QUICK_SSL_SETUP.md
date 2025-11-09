# Quick SSL Setup Guide

## 🎯 You Have No Certificates Yet

The error `No such file or directory` confirms you need to generate SSL certificates first.

## ✅ Automated Setup (Easiest Way)

I've created a complete automation script that handles everything!

### Run on your GCP server:

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Navigate to project
cd /home/trantanh227/ventidole-core

# Pull the new script
git pull origin main

# Make executable
chmod +x scripts/setup-ssl-complete.sh

# Run it
sudo bash scripts/setup-ssl-complete.sh
```

### What the script does:

1. ✅ Pulls latest code
2. ✅ Offers to clean old certificates
3. ✅ Sets up HTTP-only config
4. ✅ Lets you choose certificate method:
   - **Option 1: DNS-01** (works even with DNSSEC issues)
   - **Option 2: HTTP-01** (requires DNSSEC fixed)
5. ✅ Gets SSL certificate
6. ✅ Verifies certificates exist
7. ✅ Restores HTTPS config
8. ✅ Opens firewall ports
9. ✅ Starts containers with HTTPS
10. ✅ Tests the deployment

### Interactive Prompts:

The script will ask you:
- Clean old certificates? (choose N if first time)
- Choose DNS-01 or HTTP-01? (choose 1 for DNS-01)
- If DNS-01: It will show you the TXT record to add

---

## 🔧 Manual Setup (If You Prefer)

### Quick Steps:

```bash
# 1. SSH to server
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
git pull origin main

# 2. Stop containers
docker-compose -f docker/prod/docker-compose.yaml down

# 3. Get certificate (DNS-01 method)
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com

# 4. Add TXT record when prompted
# Type: TXT
# Name: _acme-challenge.api
# Value: (value from certbot)
# TTL: 300

# 5. Wait 2 minutes, then press Enter

# 6. Verify certificates exist
sudo ls -la /etc/letsencrypt/live/api.ventidole.xyz/
# Should show: fullchain.pem, privkey.pem, cert.pem, chain.pem

# 7. Open firewall
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0

# 8. Start containers
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# 9. Test
curl -I https://api.ventidole.xyz
```

---

## 🚀 Why DNS-01 Challenge?

Your DNSSEC is still broken, so:

- ❌ **HTTP-01 fails**: Requires A/AAAA record lookup (DNSSEC error)
- ✅ **DNS-01 works**: Uses TXT record (not affected by DNSSEC)

### DNS-01 Process:

1. Certbot asks you to add a TXT record
2. You add it to your DNS provider
3. Wait 2 minutes for propagation
4. Certbot verifies the TXT record
5. Certificate issued! ✅

---

## 📋 Adding TXT Record

When certbot shows:

```
_acme-challenge.api.ventidole.xyz.
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Go to your DNS provider and add:

| Field | Value |
|-------|-------|
| **Type** | `TXT` |
| **Name** | `_acme-challenge.api` |
| **Value** | `xxxxxxxxxxxxxxxxxxxxxxxxxxx` (from certbot) |
| **TTL** | `300` |

### Verify before pressing Enter:

```bash
dig _acme-challenge.api.ventidole.xyz TXT +short
# Should show the value you added
```

---

## ⚡ After Certificate is Generated

Your current docker-compose.yaml already has HTTPS configured:

```yaml
gateway:
  ports:
    - "443:443"  # Standard HTTPS
    - "80:80"    # HTTP redirect
  volumes:
    - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
    - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
```

Just restart containers:

```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

---

## 🔍 Verify Certificate Files

After certbot succeeds, check:

```bash
sudo ls -la /etc/letsencrypt/live/api.ventidole.xyz/

# Expected output:
# -rw-r--r-- cert.pem -> ../../archive/api.ventidole.xyz/cert1.pem
# -rw-r--r-- chain.pem -> ../../archive/api.ventidole.xyz/chain1.pem
# -rw-r--r-- fullchain.pem -> ../../archive/api.ventidole.xyz/fullchain1.pem
# -rw-r--r-- privkey.pem -> ../../archive/api.ventidole.xyz/privkey1.pem
```

All 4 files must exist! ✅

---

## 🎯 Recommended: Use Automated Script

The automated script (`setup-ssl-complete.sh`) handles all edge cases and provides clear feedback at each step.

```bash
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
git pull origin main
chmod +x scripts/setup-ssl-complete.sh
sudo bash scripts/setup-ssl-complete.sh
```

Choose **Option 1 (DNS-01)** when prompted.

---

## ✅ Success Indicators

After setup completes:

```bash
# Check containers running
docker ps
# Should show: ventidole-gateway, ventidole-server

# Check HTTPS works
curl -I https://api.ventidole.xyz
# Should show: HTTP/2 200 OK

# Check Swagger
# Open browser: https://api.ventidole.xyz/docs
```

---

## 🆘 If Something Goes Wrong

### Certificate generation fails:

```bash
# Check certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Containers won't start:

```bash
# Check logs
docker logs ventidole-gateway
docker logs ventidole-server
```

### HTTPS doesn't work:

```bash
# Verify certificates exist
sudo ls /etc/letsencrypt/live/api.ventidole.xyz/

# Check firewall
gcloud compute firewall-rules list | grep 443

# Check nginx config
docker exec ventidole-gateway nginx -t
```

---

**TL;DR**: 
1. Run `sudo bash scripts/setup-ssl-complete.sh` on server
2. Choose DNS-01 (option 1)
3. Add TXT record when prompted
4. Wait 2 minutes, press Enter
5. Done! 🎉
