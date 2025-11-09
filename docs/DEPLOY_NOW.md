# 🚀 Deploy HTTPS for api.ventidole.xyz - Action Items

## ✅ Ready to Deploy

Everything is configured for **api.ventidole.xyz** on ports **8080** (HTTP) and **8443** (HTTPS).

---

## 📝 Step-by-Step Deployment

### 1️⃣ Commit and Push (Local Machine)

```bash
git add .
git commit -m "feat: configure HTTPS for api.ventidole.xyz"
git push origin main
```

### 2️⃣ Open GCP Firewall Ports

**Option A: Via GCP Console**
1. Go to: https://console.cloud.google.com/networking/firewalls
2. Click "CREATE FIREWALL RULE"
3. Create rule for port 8080:
   - Name: `allow-http-8080`
   - Targets: All instances
   - Source: 0.0.0.0/0
   - Protocols and ports: tcp:8080
4. Create rule for port 8443:
   - Name: `allow-https-8443`
   - Targets: All instances
   - Source: 0.0.0.0/0
   - Protocols and ports: tcp:8443

**Option B: Via gcloud CLI**
```bash
gcloud compute firewall-rules create allow-http-8080 --allow tcp:8080
gcloud compute firewall-rules create allow-https-8443 --allow tcp:8443
```

### 3️⃣ SSH to Server

```bash
ssh trantanh227@35.193.66.111
```

### 4️⃣ Verify DNS (Should already work)

```bash
dig api.ventidole.xyz +short
# Should return: 35.193.66.111
```

### 5️⃣ Install Certbot

```bash
sudo apt update
sudo apt install certbot -y
```

### 6️⃣ Stop Current Services

```bash
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down
```

### 7️⃣ Get SSL Certificate

```bash
sudo certbot certonly --standalone \
    -d api.ventidole.xyz \
    --http-01-port 8080 \
    --email your-email@ventidole.xyz \
    --agree-tos \
    --non-interactive
```

**Replace `your-email@ventidole.xyz` with your actual email!**

### 8️⃣ Verify Certificate

```bash
sudo ls -la /etc/letsencrypt/live/api.ventidole.xyz/
# Should see 4 files: cert.pem, chain.pem, fullchain.pem, privkey.pem
```

### 9️⃣ Pull Latest Code

```bash
git pull origin main
```

### 🔟 Start Services with HTTPS

```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### 1️⃣1️⃣ Verify Deployment

```bash
# Check containers
docker-compose -f docker/prod/docker-compose.yaml ps
# Both "server" and "gateway" should be "Up"

# Check nginx logs
docker-compose -f docker/prod/docker-compose.yaml logs gateway | tail -20

# Check server logs
docker-compose -f docker/prod/docker-compose.yaml logs server | tail -20
```

### 1️⃣2️⃣ Test from Server

```bash
# Test HTTP (should redirect)
curl -I http://api.ventidole.xyz:8080

# Test HTTPS (should work)
curl -I https://api.ventidole.xyz:8443

# Test Swagger
curl https://api.ventidole.xyz:8443/docs
```

### 1️⃣3️⃣ Setup Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run --http-01-port 8080

# If successful, add cron job
sudo crontab -e

# Press 'i' to insert, then add this line:
0 0 * * * certbot renew --quiet --http-01-port 8080 --post-hook "docker-compose -f /home/trantanh227/ventidole-core/docker/prod/docker-compose.yaml restart gateway"

# Press Esc, then type :wq and Enter to save
```

### 1️⃣4️⃣ Test in Browser

Open your browser and go to:
```
https://api.ventidole.xyz:8443/docs
```

You should see:
- ✅ Swagger UI loads
- ✅ Browser shows padlock icon 🔒
- ✅ No security warnings

---

## 🎉 Success!

Your API is now live at:

- **Swagger UI**: `https://api.ventidole.xyz:8443/docs`
- **API Base**: `https://api.ventidole.xyz:8443`
- **API v1**: `https://api.ventidole.xyz:8443/v1/...`

---

## 🔍 Troubleshooting

### Problem: certbot fails to get certificate

**Solution**: Make sure port 8080 is open and containers are stopped
```bash
docker-compose -f docker/prod/docker-compose.yaml down
sudo certbot certonly --standalone -d api.ventidole.xyz --http-01-port 8080
```

### Problem: nginx container won't start

**Solution**: Check logs for errors
```bash
docker-compose -f docker/prod/docker-compose.yaml logs gateway
```

Common issues:
- Certificate files not found → Re-run certbot
- Port already in use → Check with `sudo netstat -tulpn | grep 8080`

### Problem: Can't connect to port 8080/8443

**Solution**: Check firewall
```bash
# From outside server
telnet 35.193.66.111 8080
telnet 35.193.66.111 8443

# On server
sudo ufw status
```

### Problem: HTTPS works but HTTP doesn't redirect

**Solution**: Check nginx config
```bash
docker exec ventidole-gateway nginx -t
docker exec ventidole-gateway cat /etc/nginx/conf.d/default.conf | grep 8080
```

---

## 📞 Need Help?

Check detailed guides:
- `docs/SETUP_VENTIDOLE_HTTPS.md` - Full setup guide
- `docs/VENTIDOLE_CONFIG_SUMMARY.md` - Configuration details

---

## ✅ Deployment Checklist

Copy this checklist and check off as you complete:

```
[ ] Committed and pushed configuration files
[ ] Opened firewall ports 8080 and 8443 in GCP
[ ] SSH'd into server: ssh trantanh227@35.193.66.111
[ ] Installed certbot
[ ] Stopped Docker containers
[ ] Got SSL certificate for api.ventidole.xyz
[ ] Verified certificate files exist
[ ] Pulled latest code with git pull
[ ] Started containers with docker-compose up -d
[ ] Verified both containers running
[ ] Tested HTTP redirect (port 8080)
[ ] Tested HTTPS endpoint (port 8443)
[ ] Accessed Swagger UI in browser
[ ] Setup auto-renewal cron job
```

---

**Time to complete**: 10-15 minutes

**Let's secure your API!** 🚀🔒
