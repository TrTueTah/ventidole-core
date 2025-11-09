# How to Get SSL Certificate for nginx (api.ventidole.xyz)

## 🔐 SSL Certificate (Not License)

nginx itself is **free and open-source** - no license needed!

What you need is an **SSL/TLS certificate** to enable HTTPS. We'll use **Let's Encrypt** (free, trusted by all browsers).

---

## 🚀 Quick Method: Certbot (Recommended)

### Step 1: SSH to Your Server

```bash
ssh trantanh227@35.193.66.111
```

### Step 2: Install Certbot

```bash
# Update system
sudo apt update

# Install certbot
sudo apt install certbot -y

# Verify installation
certbot --version
```

### Step 3: Stop Docker Containers (Temporary)

Certbot needs port 8080 to verify your domain:

```bash
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down
```

### Step 4: Get SSL Certificate

```bash
sudo certbot certonly --standalone \
    -d api.ventidole.xyz \
    --http-01-port 8080 \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

**Replace `your-email@example.com` with your real email!**

This creates certificate files at:
```
/etc/letsencrypt/live/api.ventidole.xyz/
├── cert.pem          # Your certificate
├── chain.pem         # Certificate chain
├── fullchain.pem     # Full certificate chain
└── privkey.pem       # Private key
```

### Step 5: Verify Certificate Created

```bash
sudo ls -la /etc/letsencrypt/live/api.ventidole.xyz/
```

You should see 4 files listed above.

### Step 6: Restart Your Services

```bash
cd /home/trantanh227/ventidole-core
git pull origin main  # Get latest nginx config
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### Step 7: Test HTTPS

```bash
# Test certificate
curl -I https://api.ventidole.xyz:8443

# Or in browser
https://api.ventidole.xyz:8443/docs
```

---

## 🔄 Alternative Method: Certbot with Webroot (No Downtime)

If you don't want to stop your services:

### Step 1: Create Webroot Directory

```bash
sudo mkdir -p /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

### Step 2: Update nginx Config

Add this to your nginx config (temporarily):

```nginx
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

### Step 3: Get Certificate (No Downtime)

```bash
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d api.ventidole.xyz \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

---

## 🔄 Certificate Auto-Renewal

Let's Encrypt certificates expire after **90 days**. Set up auto-renewal:

### Option 1: Cron Job (Recommended)

```bash
# Edit crontab
sudo crontab -e

# Add this line (renews daily, only updates if needed)
0 0 * * * certbot renew --quiet --http-01-port 8080 --pre-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml down" --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml up -d"
```

### Option 2: Systemd Timer (If Available)

```bash
# Check if certbot timer exists
sudo systemctl status certbot.timer

# Enable it
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Test Auto-Renewal

```bash
# Dry run (test without actually renewing)
sudo certbot renew --dry-run --http-01-port 8080
```

---

## 📋 Certificate Information

### View Certificate Details

```bash
# List all certificates
sudo certbot certificates

# Check expiration date
sudo certbot certificates | grep "Expiry Date"

# View certificate with openssl
sudo openssl x509 -in /etc/letsencrypt/live/api.ventidole.xyz/cert.pem -text -noout
```

### Certificate Locations

```bash
# Certificate files
/etc/letsencrypt/live/api.ventidole.xyz/

# Certificate archive (actual files)
/etc/letsencrypt/archive/api.ventidole.xyz/

# Certbot config
/etc/letsencrypt/renewal/api.ventidole.xyz.conf
```

---

## 🔧 Troubleshooting

### Problem: "Timeout during connect"

**Cause**: Port 8080 not accessible or DNS not pointing correctly

**Solution**:
```bash
# Check DNS
dig api.ventidole.xyz +short
# Should return: 35.193.66.111

# Check port is open
telnet 35.193.66.111 8080

# Check firewall
sudo ufw status
```

### Problem: "Connection refused"

**Cause**: Port 8080 already in use

**Solution**:
```bash
# Check what's using port 8080
sudo netstat -tulpn | grep 8080

# Stop docker containers
docker-compose -f docker/prod/docker-compose.yaml down
```

### Problem: "Rate limit exceeded"

**Cause**: Too many certificate requests

**Solution**:
```bash
# Use staging server for testing
sudo certbot certonly --standalone \
    --staging \
    -d api.ventidole.xyz \
    --http-01-port 8080
```

### Problem: Certificate exists but nginx can't read it

**Cause**: Permission issues

**Solution**:
```bash
# Fix permissions
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/
```

---

## 🎓 Understanding SSL Certificates

### What is Let's Encrypt?

- **Free** SSL/TLS certificates
- **Trusted** by all major browsers
- **Automated** renewal
- Valid for **90 days** (auto-renew recommended)

### Certificate Types

| File | Purpose |
|------|---------|
| `cert.pem` | Your certificate only |
| `chain.pem` | Intermediate certificates |
| `fullchain.pem` | Your cert + chain (use this in nginx) |
| `privkey.pem` | Private key (keep secret!) |

### How Verification Works

1. You request a certificate for `api.ventidole.xyz`
2. Let's Encrypt challenges you to prove you own the domain
3. It tries to access: `http://api.ventidole.xyz:8080/.well-known/acme-challenge/random-string`
4. If successful, certificate is issued
5. Certificate is saved to `/etc/letsencrypt/`

---

## 🔐 Security Best Practices

### 1. Protect Private Key

```bash
# Check private key permissions (should be 600 or 400)
ls -l /etc/letsencrypt/live/api.ventidole.xyz/privkey.pem

# Fix if needed
sudo chmod 600 /etc/letsencrypt/live/api.ventidole.xyz/privkey.pem
```

### 2. Backup Certificates

```bash
# Backup entire letsencrypt directory
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Move backup to safe location
mv letsencrypt-backup-*.tar.gz ~/backups/
```

### 3. Monitor Expiration

```bash
# Check when certificate expires
sudo certbot certificates

# Set up email notifications (already done if you provided email)
```

---

## 📊 Quick Reference

### Get New Certificate

```bash
sudo certbot certonly --standalone -d api.ventidole.xyz --http-01-port 8080
```

### Renew Certificate

```bash
sudo certbot renew --http-01-port 8080
```

### List Certificates

```bash
sudo certbot certificates
```

### Delete Certificate

```bash
sudo certbot delete --cert-name api.ventidole.xyz
```

### Test Renewal

```bash
sudo certbot renew --dry-run --http-01-port 8080
```

---

## 🎯 For Your Setup (api.ventidole.xyz)

### Complete Command

```bash
# 1. SSH to server
ssh trantanh227@35.193.66.111

# 2. Install certbot
sudo apt install certbot -y

# 3. Stop containers
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down

# 4. Get certificate
sudo certbot certonly --standalone \
    -d api.ventidole.xyz \
    --http-01-port 8080 \
    --email your-email@ventidole.xyz \
    --agree-tos

# 5. Start containers
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# 6. Test
curl -I https://api.ventidole.xyz:8443
```

### Your nginx Already Configured

Your nginx config already points to:
```
/etc/letsencrypt/live/api.ventidole.xyz/fullchain.pem
/etc/letsencrypt/live/api.ventidole.xyz/privkey.pem
```

Just get the certificate and restart!

---

## 🎉 Success

After getting the certificate, your API will be accessible at:

- ✅ `https://api.ventidole.xyz:8443` (Secure)
- ✅ `https://api.ventidole.xyz:8443/docs` (Swagger)
- ✅ Browser shows 🔒 padlock icon

---

## 💡 Summary

1. **nginx** = Free software (no license needed)
2. **SSL Certificate** = What you need for HTTPS
3. **Let's Encrypt** = Free SSL certificates (via Certbot)
4. **Certbot** = Tool to get/manage certificates
5. **Auto-renewal** = Setup cron job (certificates expire in 90 days)

**Ready to get your certificate?** Follow the commands above! 🚀
