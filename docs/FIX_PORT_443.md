# Fix: Connection Failed to Port 443

## 🐛 Problem

```bash
curl: (7) Failed to connect to api-prod.ventidole.xyz port 443
```

**Reason**: Your server is listening on port 8080, not 443.

## ✅ Quick Test (Verify Server is Working)

```bash
# Test with the actual port (8080)
curl -I https://api-prod.ventidole.xyz:8080

# If this works, your server is fine - you just need port forwarding
```

## 🎯 Solutions

### Option 1: Use Port Forwarding (Recommended - Clean URLs)

This allows users to access `https://api-prod.ventidole.xyz` without port numbers.

#### On your GCP server:

```bash
# 1. Open port 443 in GCP firewall
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTPS traffic"

# 2. Set up iptables forwarding
sudo bash /home/trantanh227/ventidole-core/scripts/setup-port-forward.sh

# 3. Test
curl -I https://api-prod.ventidole.xyz
```

**What this does:**
- External requests to port 443 → forwarded to port 8080
- Users see: `https://api-prod.ventidole.xyz` (clean URL)
- Server listens: port 8080 internally

### Option 2: Change Docker to Use Standard Port 443

Modify docker-compose.yaml to use port 443 directly:

```yaml
# Change from:
ports:
  - "8080:443"

# To:
ports:
  - "443:443"
  - "80:80"
```

#### Steps:

1. **Edit docker-compose.yaml** on your server:
```bash
ssh trantanh227@35.193.66.111
cd /home/trantanh227/ventidole-core
nano docker/prod/docker-compose.yaml
```

2. **Change the ports section:**
```yaml
gateway:
  image: nginx:alpine
  container_name: ${PROJECT}-gateway
  ports:
    - "443:443"  # Standard HTTPS port
    - "80:80"    # Standard HTTP port
  volumes:
    - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ../../config.d/nginx/default.prod.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
    - /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro
  depends_on:
    - server
  restart: always
```

3. **Restart containers:**
```bash
docker-compose --env-file .env -f docker/prod/docker-compose.yaml down
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

4. **Test:**
```bash
curl -I https://api-prod.ventidole.xyz
```

### Option 3: Keep Port 8080 (Current Setup)

If you want to keep using port 8080:

```bash
# Access with port number
curl -I https://api-prod.ventidole.xyz:8080

# Or use HTTP on 8081
curl -I http://api-prod.ventidole.xyz:8081
```

**Update your frontend/apps to use:**
- `https://api-prod.ventidole.xyz:8080/api/...`

## 🔧 GCP Firewall Configuration

Make sure the port you're using is open:

```bash
# Check current firewall rules
gcloud compute firewall-rules list

# For port 443 (if using Option 1 or 2)
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0

# For port 8080 (if using Option 3)
gcloud compute firewall-rules create allow-8080 \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0

# For port 80 (HTTP)
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0
```

## 🔍 Debug Commands

```bash
# On your GCP server, check what ports are listening
sudo netstat -tulpn | grep LISTEN

# Check Docker containers
docker ps

# Check nginx logs
docker logs ventidole-gateway

# Check if port is accessible from outside
# (from your local machine)
telnet api-prod.ventidole.xyz 443
telnet api-prod.ventidole.xyz 8080
```

## 📊 Comparison

| Option | URL | Setup Complexity | Best For |
|--------|-----|------------------|----------|
| **Port Forwarding** | `https://api-prod.ventidole.xyz` | Medium (iptables) | Production - Clean URLs |
| **Change to 443** | `https://api-prod.ventidole.xyz` | Easy (edit YAML) | Production - Standard |
| **Keep 8080** | `https://api-prod.ventidole.xyz:8080` | None | Development/Testing |

## ✅ Recommended Solution

**For production, use Option 2 (Change to port 443)** - it's the simplest and most standard approach.

### Quick Implementation:

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Open firewall
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0
gcloud compute firewall-rules create allow-http --allow tcp:80 --source-ranges 0.0.0.0/0

# Edit docker-compose.yaml
cd /home/trantanh227/ventidole-core
nano docker/prod/docker-compose.yaml

# Change:
#   - "8080:443" → "443:443"
#   - "8081:80"  → "80:80"

# Restart
docker-compose --env-file .env -f docker/prod/docker-compose.yaml down
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Test
curl -I https://api-prod.ventidole.xyz
```

---

**TL;DR**: Your server is running on port 8080. Either:
1. Test with `curl -I https://api-prod.ventidole.xyz:8080`
2. Change docker-compose to use port 443
3. Set up port forwarding (443 → 8080)
