# Access HTTPS via Port 8080 (No Port in URL)

## 🎯 Goal

Access your API as: `https://api.ventidole.xyz/docs` (clean URL)  
But have the server listen on port 8080.

## 🏗️ Architecture

```
User Browser                    GCP Server
     │                               │
     │  https://api.ventidole.xyz   │
     │  (port 443 - standard)        │
     └──────────────────────────────►│ Port 8080
                                     │   ↓
                                     │ nginx (container port 443)
                                     │   ↓
                                     │ NestJS app (port 8080)
```

## ⚙️ Two Approaches

### Option 1: GCP Load Balancer / Port Forwarding (Recommended)

Use GCP's load balancer or port forwarding to route 443 → 8080.

#### Setup GCP Load Balancer:

1. **Create a Load Balancer**:
   - Go to: Network Services → Load Balancing
   - Click "Create Load Balancer"
   - Choose "TCP Load Balancer"
   - Frontend: Port 443
   - Backend: Your VM on port 8080

2. **Update DNS**:
   - Point `api.ventidole.xyz` to the Load Balancer IP

3. **Keep docker-compose as configured**:
   ```yaml
   ports:
     - "8080:443"  # nginx listens on 443 inside, exposed on 8080
   ```

### Option 2: Use iptables Port Forwarding (Simpler)

Forward port 443 to 8080 on the server itself.

#### On Your GCP Server:

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Forward port 443 to 8080
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8080

# Save iptables rules
sudo apt install iptables-persistent -y
sudo netfilter-persistent save

# Open port 443 in GCP firewall
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0
```

#### docker-compose configuration:
```yaml
ports:
  - "8080:443"  # Exposed on 8080, iptables forwards 443 → 8080
```

### Option 3: Run nginx on Standard Ports (Simplest)

Just use standard ports 80 and 443 directly.

#### docker-compose configuration:
```yaml
ports:
  - "80:80"
  - "443:443"
```

This is the **simplest** if you don't need port 8080 specifically.

## 📋 Current Configuration

Your setup is configured for **Option 2** (port forwarding):

```yaml
gateway:
  ports:
    - "8080:443"  # nginx HTTPS on internal 443, exposed on 8080
    - "8081:80"   # nginx HTTP on internal 80, exposed on 8081
```

## 🚀 Deployment Steps (Option 2)

### 1. Setup Port Forwarding

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Forward 443 → 8080
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8080

# Make it permanent
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

### 2. Open Port 443 in GCP Firewall

```bash
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0
```

Or via Console:
1. Go to VPC Network → Firewall
2. Create rule for TCP port 443

### 3. Get SSL Certificate

```bash
cd /home/trantanh227/ventidole-core

# Stop containers
docker-compose -f docker/prod/docker-compose.yaml down

# Get certificate (uses port 80 by default)
sudo certbot certonly --standalone \
    -d api.ventidole.xyz \
    --email your-email@ventidole.xyz \
    --agree-tos
```

### 4. Start Services

```bash
# Pull latest config
git pull origin main

# Start with HTTPS
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
```

### 5. Test

```bash
# Test from server
curl -I https://api.ventidole.xyz

# Test from browser
https://api.ventidole.xyz/docs
```

## ✅ How It Works

1. User accesses: `https://api.ventidole.xyz` (port 443, standard HTTPS)
2. GCP firewall allows port 443
3. iptables redirects port 443 → 8080
4. Docker routes 8080 → container port 443
5. nginx (inside container) serves HTTPS on port 443
6. nginx proxies to NestJS app on port 8080

**Result**: Clean URL with no port number! ✨

## 🔍 Verify Port Forwarding

```bash
# Check iptables rules
sudo iptables -t nat -L -n -v | grep 443

# Test port 443 is open
telnet api.ventidole.xyz 443

# Check what's listening on port 8080
sudo netstat -tulpn | grep 8080
```

## 🎯 Final URLs

- **HTTPS**: `https://api.ventidole.xyz` ✅
- **Swagger**: `https://api.ventidole.xyz/docs` ✅
- **API**: `https://api.ventidole.xyz/v1/...` ✅

No port number needed! 🎉

## 📝 Summary

| Approach | Complexity | Best For |
|----------|-----------|----------|
| **Option 1: Load Balancer** | High | Production, scalability |
| **Option 2: iptables** | Medium | Single server, cost-effective |
| **Option 3: Standard ports** | Low | Simple setup |

**Recommendation**: Use **Option 2 (iptables)** for your current setup - it's simple and works well for a single server.

---

Your configuration is ready for Option 2. Just run the iptables commands above! 🚀
