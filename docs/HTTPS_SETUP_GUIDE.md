# Complete HTTPS Setup Guide for GCP Server

This guide will help you configure HTTPS for your NestJS application using nginx and Let's Encrypt SSL certificates.

## 📋 Prerequisites

- ✅ A domain name (e.g., `api.yourdomain.com`)
- ✅ Domain DNS pointing to your GCP server IP: `35.193.66.111`
- ✅ Ports 80 and 443 open in GCP firewall
- ✅ SSH access to your GCP server

## 🎯 Overview

Your setup will be:
```
Internet → Nginx (443/HTTPS) → NestJS App (8080/HTTP)
```

Nginx handles SSL/TLS and forwards requests to your NestJS application.

## 📝 Step-by-Step Setup

### Step 1: Configure DNS (Do this first!)

Point your domain to your GCP server:

```
Type: A Record
Name: api (or @)
Value: 35.193.66.111
TTL: 300
```

Wait 5-15 minutes for DNS propagation. Verify:
```bash
# Check if DNS is working
dig api.yourdomain.com +short
# Should return: 35.193.66.111

# Or use nslookup
nslookup api.yourdomain.com
```

### Step 2: Open Firewall Ports on GCP

```bash
# In Google Cloud Console or using gcloud CLI:
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP"

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTPS"
```

Or via GCP Console:
1. Go to VPC Network → Firewall
2. Create rule for port 80 (HTTP)
3. Create rule for port 443 (HTTPS)

### Step 3: SSH into Your GCP Server

```bash
ssh trantanh227@35.193.66.111
```

### Step 4: Install Certbot (Let's Encrypt Client)

```bash
# Update packages
sudo apt update

# Install certbot
sudo apt install certbot -y

# Verify installation
certbot --version
```

### Step 5: Stop Current Docker Containers

```bash
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down
```

### Step 6: Obtain SSL Certificate

**Option A: Using Standalone Mode (Server must be stopped)**

```bash
# Replace api.yourdomain.com with your actual domain
sudo certbot certonly --standalone \
    -d api.yourdomain.com \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com

# For multiple domains/subdomains:
sudo certbot certonly --standalone \
    -d api.yourdomain.com \
    -d www.api.yourdomain.com \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com
```

**Option B: Using Webroot Mode (Server can stay running)**

```bash
# Create webroot directory
sudo mkdir -p /var/www/certbot

# Get certificate
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d api.yourdomain.com \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com
```

### Step 7: Verify Certificate Installation

```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/api.yourdomain.com/

# Should see:
# - cert.pem
# - chain.pem
# - fullchain.pem
# - privkey.pem
```

### Step 8: Update Nginx Configuration

Update your domain in the nginx config:

```bash
cd /home/trantanh227/ventidole-core

# Edit the production nginx config
nano config.d/nginx/default.prod.conf
```

Replace `yourdomain.com` with your actual domain in these lines:
```nginx
server_name api.yourdomain.com;  # Line 23

ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;  # Line 27
ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;  # Line 28
ssl_trusted_certificate /etc/letsencrypt/live/api.yourdomain.com/chain.pem;  # Line 42
```

Save and exit (Ctrl+X, Y, Enter).

### Step 9: Update docker-compose.yaml

Uncomment the nginx gateway service:

```bash
nano docker/prod/docker-compose.yaml
```

Uncomment these lines:
```yaml
  gateway:
    image: nginx:alpine
    container_name: ${PROJECT}-gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ../../config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
      - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
    depends_on:
      - server
    restart: always
```

### Step 10: Update Server Port Configuration

Update your server to not expose port directly (nginx will handle it):

```yaml
  server:
    build:
      context: ../..
      dockerfile: docker/prod/Dockerfile
    container_name: ${PROJECT}-server
    # Remove or comment out the ports section
    # ports:
    #   - ${PORT}:${PORT}
    env_file:
      - ../../.env
    restart: always
```

### Step 11: Start Services with HTTPS

```bash
cd /home/trantanh227/ventidole-core

# Pull latest code
git pull origin main

# Start all services
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Check if everything is running
docker-compose -f docker/prod/docker-compose.yaml ps

# Check nginx logs
docker-compose -f docker/prod/docker-compose.yaml logs gateway
```

### Step 12: Test HTTPS

```bash
# Test SSL certificate
curl -I https://api.yourdomain.com

# Should see:
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains

# Test API endpoint
curl https://api.yourdomain.com/health

# Test in browser
https://api.yourdomain.com/docs
```

### Step 13: Enable Helmet HTTPS Features

Update your NestJS application to enable HTTPS security headers:

```typescript
// In src/main.ts
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
    hsts: {
      maxAge: 31536000,           // 1 year
      includeSubDomains: true,
      preload: true,
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: true,
  }),
);
```

Commit and push:
```bash
git add src/main.ts
git commit -m "feat: enable HTTPS security headers"
git push origin main
```

The GitHub Actions workflow will redeploy automatically.

## 🔄 Certificate Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# If successful, set up cron job
sudo crontab -e

# Add this line to check for renewal twice daily:
0 0,12 * * * certbot renew --quiet --deploy-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"
```

Or use systemd timer:
```bash
# Check if renewal timer is active
sudo systemctl status certbot.timer

# Enable it
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 🔍 Troubleshooting

### Issue: Certificate acquisition fails

**Check DNS:**
```bash
dig api.yourdomain.com +short
# Must return your server IP
```

**Check firewall:**
```bash
sudo ufw status
# Port 80 and 443 should be open
```

**Check certbot logs:**
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Issue: Nginx fails to start

**Test nginx configuration:**
```bash
docker run --rm \
  -v $(pwd)/config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine nginx -t
```

**Check nginx logs:**
```bash
docker-compose -f docker/prod/docker-compose.yaml logs gateway
```

### Issue: Certificate not found

**Verify certificate path:**
```bash
sudo ls -la /etc/letsencrypt/live/
sudo ls -la /etc/letsencrypt/live/api.yourdomain.com/
```

**Check file permissions:**
```bash
# Nginx needs read access
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/
```

### Issue: SSL certificate error in browser

**Test SSL configuration:**
```bash
# Using openssl
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# Using SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=api.yourdomain.com
```

### Issue: HTTP to HTTPS redirect not working

**Check nginx config:**
```bash
docker exec ventidole-gateway nginx -t
docker exec ventidole-gateway cat /etc/nginx/conf.d/default.conf
```

## 📊 Verification Checklist

After setup:

- [ ] DNS points to your server IP
- [ ] Ports 80 and 443 are open
- [ ] SSL certificate obtained successfully
- [ ] Nginx gateway container is running
- [ ] HTTP redirects to HTTPS
- [ ] `https://api.yourdomain.com/docs` loads
- [ ] Browser shows padlock (secure connection)
- [ ] SSL Labs test gives A or A+ rating
- [ ] Auto-renewal is configured

## 🎉 Success!

You should now be able to access your API securely:

- ✅ `https://api.yourdomain.com` (secure)
- ✅ `http://api.yourdomain.com` (redirects to HTTPS)
- ✅ `https://api.yourdomain.com/docs` (Swagger with HTTPS)

## 🔐 Security Best Practices

1. **Keep certificates updated** - Auto-renewal handles this
2. **Use strong SSL configuration** - Already configured in nginx
3. **Enable HSTS** - Already configured
4. **Regular security updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose pull
   ```

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs Testing](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

## 💡 Tips

- **Use a subdomain** (e.g., `api.yourdomain.com`) instead of root domain
- **Test with staging certificates first** if worried about rate limits:
  ```bash
  certbot certonly --standalone --staging -d api.yourdomain.com
  ```
- **Backup certificates:**
  ```bash
  sudo tar -czf letsencrypt-backup.tar.gz /etc/letsencrypt/
  ```

---

Need help? Check the troubleshooting section or create an issue!
