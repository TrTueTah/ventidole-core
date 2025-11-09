# HTTPS Setup for api-prod.ventidole.xyz

## 🎯 Your Configuration

- **Domain**: `api-prod.ventidole.xyz`
- **Server IP**: `35.193.66.111`
- **HTTP Port**: `80` (standard)
- **HTTPS Port**: `443` (standard)

## ✅ DNS Status

Your domain is already pointing to the server. Verify:
```bash
dig api-prod.ventidole.xyz +short
# Should return: 35.193.66.111
```

## 🚀 Setup Steps

### Step 1: Open Firewall Ports on GCP

Make sure ports 80 and 443 are open:

```bash
# Via gcloud CLI:
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0
```

Or via GCP Console:
1. Go to VPC Network → Firewall
2. Create rule: Allow TCP port 80
3. Create rule: Allow TCP port 443

### Step 2: SSH to Your Server

```bash
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
```

### Step 3: Install Certbot (if not already installed)

```bash
sudo apt update
sudo apt install certbot -y
```

### Step 4: Stop Current Services

```bash
docker-compose -f docker/prod/docker-compose.yaml down
```

### Step 5: Get SSL Certificate

```bash
sudo certbot certonly --standalone \
    -d api-prod.ventidole.xyz \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

**Note**: Replace `your-email@example.com` with your actual email.

### Step 6: Verify Certificate

```bash
sudo ls -la /etc/letsencrypt/live/api-prod.ventidole.xyz/
# Should see: cert.pem, chain.pem, fullchain.pem, privkey.pem
```

### Step 7: Pull Latest Configuration

```bash
git pull origin main
```

### Step 8: Start Services with HTTPS

```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### Step 9: Check Status

```bash
# Check all containers are running
docker-compose -f docker/prod/docker-compose.yaml ps

# Check nginx logs
docker-compose -f docker/prod/docker-compose.yaml logs gateway

# Check server logs
docker-compose -f docker/prod/docker-compose.yaml logs server
```

## ✅ Testing

### Test HTTP (Port 8080)
```bash
curl -I http://api-prod.ventidole.xyz:8080
# Should redirect to HTTPS (301)
```

### Test HTTPS (Port 8443)
```bash
curl -I https://api-prod.ventidole.xyz:8443
# Should return: HTTP/2 200
```

### Test in Browser

**Swagger UI:**
- HTTP: `http://api-prod.ventidole.xyz:8080/docs` (redirects to HTTPS)
- HTTPS: `https://api-prod.ventidole.xyz:8443/docs`

**API Endpoint:**
```bash
curl https://api-prod.ventidole.xyz:8443/v1/your-endpoint
```

## 🔄 Auto-Renewal Setup

Set up automatic certificate renewal:

```bash
# Test renewal
sudo certbot renew --dry-run --http-01-port 8080

# If successful, add cron job
sudo crontab -e

# Add this line:
0 0 * * * certbot renew --quiet --http-01-port 8080 --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"
```

## 📋 Port Configuration Summary

| Service | Internal Port | External Port | Protocol | Access |
|---------|--------------|---------------|----------|---------|
| NestJS App | 8080 | - | HTTP | Internal only |
| Nginx HTTP | 8080 | 8080 | HTTP | Public (redirects) |
| Nginx HTTPS | 8443 | 8443 | HTTPS | Public |

## 🎯 Final URLs

After setup, your API will be accessible at:

- ✅ **HTTP**: `http://api-prod.ventidole.xyz:8080` → Redirects to HTTPS
- ✅ **HTTPS**: `https://api-prod.ventidole.xyz:8443` ← Use this
- ✅ **Swagger**: `https://api-prod.ventidole.xyz:8443/docs`
- ✅ **API v1**: `https://api-prod.ventidole.xyz:8443/v1/...`

## 🔍 Troubleshooting

### Issue: Port 8080/8443 connection refused

**Check firewall:**
```bash
# On server
sudo ufw status

# Or test from outside
telnet 35.193.66.111 8080
telnet 35.193.66.111 8443
```

### Issue: Certificate not found

**Verify certificate path:**
```bash
sudo ls -la /etc/letsencrypt/live/api-prod.ventidole.xyz/
```

**If missing, get certificate again:**
```bash
sudo certbot certonly --standalone \
    -d api-prod.ventidole.xyz \
    --http-01-port 8080
```

### Issue: nginx fails to start

**Check nginx config:**
```bash
docker run --rm \
  -v $(pwd)/config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine nginx -t
```

**Check logs:**
```bash
docker-compose -f docker/prod/docker-compose.yaml logs gateway
```

### Issue: SSL certificate error

**Check certificate validity:**
```bash
openssl s_client -connect api-prod.ventidole.xyz:8443 -servername api-prod.ventidole.xyz
# Should show: Verify return code: 0 (ok)
```

## 🎉 Success Checklist

- [ ] DNS points to server: `api-prod.ventidole.xyz` → `35.193.66.111`
- [ ] Ports 8080 and 8443 open in firewall
- [ ] SSL certificate obtained for `api-prod.ventidole.xyz`
- [ ] Docker containers running (server + gateway)
- [ ] HTTP (8080) redirects to HTTPS (8443)
- [ ] HTTPS works: `https://api-prod.ventidole.xyz:8443`
- [ ] Swagger accessible: `https://api-prod.ventidole.xyz:8443/docs`
- [ ] Auto-renewal configured

## 📝 Notes

- Your setup uses **non-standard ports** (8080/8443) instead of standard (80/443)
- Remember to include port number in URLs: `:8080` or `:8443`
- Let's Encrypt certificate valid for 90 days, auto-renewal recommended
- nginx handles SSL/TLS, NestJS app stays on HTTP internally

---

**Your API**: `https://api-prod.ventidole.xyz:8443` 🚀
