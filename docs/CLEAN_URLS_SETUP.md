# Clean HTTPS URLs (No Port Number)

## 🎯 What You Want

Access your API with clean URLs:
- ✅ `https://api.ventidole.xyz/docs`
- ❌ NOT `https://api.ventidole.xyz:8080/docs`

## 🏗️ How It Works

```
Browser → https://api.ventidole.xyz:443 (standard HTTPS)
            ↓
         GCP Firewall (allows port 443)
            ↓
         iptables forwards 443 → 8080
            ↓
         Docker maps 8080 → container 443
            ↓
         nginx serves HTTPS
            ↓
         Your NestJS app
```

**Result**: Users see clean URLs, server uses port 8080 internally!

## 🚀 Quick Setup

### Step 1: Commit Changes

```bash
git add .
git commit -m "feat: configure nginx for clean HTTPS URLs via port forwarding"
git push origin main
```

### Step 2: Setup Port Forwarding (On Server)

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Pull latest code
cd /home/trantanh227/ventidole-core
git pull origin main

# Run port forwarding setup
chmod +x scripts/setup-port-forward.sh
sudo bash scripts/setup-port-forward.sh
```

This script will:
- ✅ Forward port 443 → 8080
- ✅ Make it permanent (survives reboots)
- ✅ Enable IP forwarding

### Step 3: Open Port 443 in GCP Firewall

```bash
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0
```

Or via GCP Console:
1. VPC Network → Firewall
2. Create rule for TCP port 443

### Step 4: Get SSL Certificate

```bash
# Stop containers
docker-compose -f docker/prod/docker-compose.yaml down

# Get certificate
sudo certbot certonly --standalone \
    -d api.ventidole.xyz \
    --email your-email@ventidole.xyz \
    --agree-tos
```

### Step 5: Start Services

```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### Step 6: Test

```bash
# Should work without port number!
curl -I https://api.ventidole.xyz

# In browser
https://api.ventidole.xyz/docs
```

## ✅ Result

Your API accessible at:
- 🌐 `https://api.ventidole.xyz`
- 📚 `https://api.ventidole.xyz/docs`
- 🔌 `https://api.ventidole.xyz/v1/...`

**No port numbers!** Clean and professional URLs! 🎉

## 📋 What's Configured

| Component | Configuration |
|-----------|--------------|
| **nginx** | Listens on port 443 (HTTPS) inside container |
| **Docker** | Maps container 443 → host 8080 |
| **iptables** | Forwards external 443 → 8080 |
| **GCP Firewall** | Allows port 443 |
| **SSL Certificate** | For api.ventidole.xyz |

## 🔍 Verify Setup

```bash
# Check port forwarding rule
sudo iptables -t nat -L PREROUTING -n | grep 443

# Check what's on port 8080
sudo netstat -tulpn | grep 8080

# Test HTTPS (should work)
curl -I https://api.ventidole.xyz

# Test with port (should also work)
curl -I https://api.ventidole.xyz:8080
```

## 📚 Documentation

- **Full guide**: `docs/PORT_8080_HTTPS.md`
- **Port forwarding script**: `scripts/setup-port-forward.sh`
- **SSL setup**: `docs/SSL_CERTIFICATE_GUIDE.md`

## 🎓 Summary

1. **Port forwarding** redirects 443 → 8080 at OS level
2. **Docker** exposes nginx on port 8080
3. **nginx** handles HTTPS inside container
4. **Users** access standard HTTPS URLs (port 443)
5. **Clean URLs** - no port numbers needed!

---

**Time to setup**: ~10 minutes

**Run the port forwarding script and you're done!** 🚀
