# HTTPS Setup Checklist

Use this checklist to track your HTTPS setup progress.

## 📋 Pre-Setup

- [ ] **Domain name registered** (e.g., yourdomain.com)
- [ ] **Email address for Let's Encrypt** notifications
- [ ] **GCP server IP**: `35.193.66.111`
- [ ] **SSH access** to server working

## 🌐 DNS Configuration

- [ ] Created A record pointing to server IP
  - Type: `A`
  - Name: `api` (or your subdomain)
  - Value: `35.193.66.111`
  - TTL: `300` (or default)

- [ ] Verified DNS propagation (wait 5-15 min)
  ```bash
  dig api.yourdomain.com +short
  # Should return: 35.193.66.111
  ```

## 🔥 Firewall Configuration

- [ ] Port 80 (HTTP) open in GCP firewall
- [ ] Port 443 (HTTPS) open in GCP firewall
- [ ] Verified with:
  ```bash
  telnet 35.193.66.111 80
  telnet 35.193.66.111 443
  ```

## 🔐 SSL Certificate

- [ ] SSH'd into server
  ```bash
  ssh trantanh227@35.193.66.111
  ```

- [ ] Installed certbot
  ```bash
  sudo apt update
  sudo apt install certbot -y
  ```

- [ ] Stopped Docker containers
  ```bash
  cd /home/trantanh227/ventidole-core
  docker-compose -f docker/prod/docker-compose.yaml down
  ```

- [ ] Obtained SSL certificate
  ```bash
  sudo certbot certonly --standalone \
      -d api.yourdomain.com \
      --email your-email@example.com \
      --agree-tos --non-interactive
  ```

- [ ] Verified certificate files exist
  ```bash
  sudo ls -la /etc/letsencrypt/live/api.yourdomain.com/
  # Should see: cert.pem, chain.pem, fullchain.pem, privkey.pem
  ```

## ⚙️ Configuration Files

- [ ] Pulled latest code
  ```bash
  cd /home/trantanh227/ventidole-core
  git pull origin main
  ```

- [ ] Updated `config.d/nginx/default.prod.conf`
  - [ ] Line 23: `server_name api.yourdomain.com;`
  - [ ] Line 27: `ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;`
  - [ ] Line 28: `ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;`
  - [ ] Line 42: `ssl_trusted_certificate /etc/letsencrypt/live/api.yourdomain.com/chain.pem;`

- [ ] Updated `docker/prod/docker-compose.yaml`
  - [ ] Uncommented `gateway` service section
  - [ ] Commented out `ports` in `server` service (optional but recommended)

- [ ] Verified `.env` file has required variables
  ```bash
  cat .env | grep -E "PROJECT|PORT"
  ```

## 🚀 Deployment

- [ ] Started services with nginx gateway
  ```bash
  docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
  ```

- [ ] Verified all containers running
  ```bash
  docker-compose -f docker/prod/docker-compose.yaml ps
  # Should see: server and gateway both "Up"
  ```

- [ ] Checked nginx logs for errors
  ```bash
  docker-compose -f docker/prod/docker-compose.yaml logs gateway
  # Should NOT see "error" or "failed"
  ```

## ✅ Testing

- [ ] **HTTP to HTTPS redirect works**
  ```bash
  curl -I http://api.yourdomain.com
  # Should return: 301 Moved Permanently
  # Location: https://api.yourdomain.com
  ```

- [ ] **HTTPS endpoint responds**
  ```bash
  curl -I https://api.yourdomain.com
  # Should return: HTTP/2 200
  ```

- [ ] **Swagger UI loads over HTTPS**
  - Browser: `https://api.yourdomain.com/docs`
  - [ ] Page loads without security warnings
  - [ ] Browser shows padlock icon (secure)
  - [ ] CSS/JS files load properly

- [ ] **SSL certificate valid**
  ```bash
  openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
  # Should show: Verify return code: 0 (ok)
  ```

- [ ] **SSL Labs test** (optional but recommended)
  - Visit: https://www.ssllabs.com/ssltest/
  - Enter: `api.yourdomain.com`
  - [ ] Grade: A or A+

## 🔄 Auto-Renewal Setup

- [ ] Tested certificate renewal (dry-run)
  ```bash
  sudo certbot renew --dry-run
  # Should complete without errors
  ```

- [ ] Setup auto-renewal cron job
  ```bash
  sudo crontab -e
  # Add: 0 0 * * * certbot renew --quiet --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"
  ```

- [ ] Verified cron job added
  ```bash
  sudo crontab -l
  ```

## 🔐 Security Headers (Optional)

- [ ] Updated NestJS Helmet config for HTTPS
  - File: `src/main.ts`
  - [ ] Enabled HSTS
  - [ ] Enabled COOP/COEP

- [ ] Committed and pushed changes
  ```bash
  git add src/main.ts
  git commit -m "feat: enable HTTPS security headers"
  git push origin main
  ```

- [ ] Waited for GitHub Actions deployment

## 📊 Final Verification

- [ ] API accessible via HTTPS: `https://api.yourdomain.com`
- [ ] Swagger UI accessible: `https://api.yourdomain.com/docs`
- [ ] HTTP redirects to HTTPS automatically
- [ ] No browser security warnings
- [ ] SSL certificate valid and trusted
- [ ] Auto-renewal configured

## 🎉 Success!

If all items are checked, your HTTPS setup is complete! 

**Your API is now secure and accessible at:**
- ✅ `https://api.yourdomain.com`
- ✅ `https://api.yourdomain.com/docs`

## 📝 Notes

Write any issues or customizations here:

```
[Your notes]
```

---

**Completion Date:** _______________

**Domain Used:** _______________

**Server IP:** 35.193.66.111
