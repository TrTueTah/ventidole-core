# Fix: Docker Build Network Errors

## 🐛 Problem

```
npm error code ECONNRESET
npm error network aborted
npm error network This is a problem related to network connectivity.
```

**Cause**: Docker builds on GCP instances can experience network timeouts when downloading npm packages.

## ✅ Solutions Implemented

### 1. Increased Retry Logic in Dockerfile

```dockerfile
# Install with automatic retries
RUN npm install --legacy-peer-deps || \
    (sleep 10 && npm install --legacy-peer-deps) || \
    (sleep 20 && npm install --legacy-peer-deps)
```

**What this does:**
- Tries npm install 3 times
- Waits 10s between first and second attempt
- Waits 20s between second and third attempt
- Handles temporary network glitches

### 2. Updated .npmrc with Better Network Settings

```properties
fetch-timeout=60000                # 60 second timeout (increased from 30s)
fetch-retries=5                    # Retry 5 times
fetch-retry-mintimeout=20000       # Minimum 20s between retries
fetch-retry-maxtimeout=120000      # Maximum 2 minutes between retries
registry=https://registry.npmjs.org/  # Use official registry
prefer-online=true                 # Prefer fresh downloads
```

### 3. Added Build Dependencies

```dockerfile
RUN apk add --no-cache python3 make g++
```

These are needed for native modules compilation.

## 🚀 Alternative Solutions

### Option 1: Use Docker BuildKit with Caching

```bash
# On your GCP server
export DOCKER_BUILDKIT=1

# Build with cache mount
docker-compose -f docker/prod/docker-compose.yaml build --no-cache
```

### Option 2: Pre-download node_modules Locally

If network is consistently problematic:

```bash
# On your local machine (better network)
npm install --legacy-peer-deps
tar -czf node_modules.tar.gz node_modules/

# Copy to server
scp node_modules.tar.gz trantanh227@35.193.66.111:/home/trantanh227/ventidole-core/

# On server, update Dockerfile:
# Add before npm install:
COPY node_modules.tar.gz .
RUN tar -xzf node_modules.tar.gz && rm node_modules.tar.gz
```

### Option 3: Use npm Mirror/Proxy

Set up a local npm proxy or use a closer mirror:

```bash
# In .npmrc
registry=https://registry.npmmirror.com/
```

### Option 4: Increase Docker Timeout

Edit Docker daemon configuration:

```bash
# On server
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

## 🔍 Debugging Network Issues

### Check network connectivity during build:

```dockerfile
# Add to Dockerfile temporarily
RUN ping -c 3 registry.npmjs.org
RUN curl -I https://registry.npmjs.org/
```

### Check if firewall is blocking:

```bash
# On server
curl -I https://registry.npmjs.org/
telnet registry.npmjs.org 443
```

### Check DNS resolution:

```bash
dig registry.npmjs.org
nslookup registry.npmjs.org
```

## 💡 Quick Fixes

### Fix 1: Retry the build

Often network issues are temporary:

```bash
# Just try again
docker-compose -f docker/prod/docker-compose.yaml build
```

### Fix 2: Clear Docker build cache

```bash
# Clear everything and rebuild
docker system prune -a
docker-compose -f docker/prod/docker-compose.yaml build --no-cache
```

### Fix 3: Check GCP network quotas

```bash
# Check if you're hitting network limits
gcloud compute instances describe your-instance-name
```

### Fix 4: Use Google Cloud NAT

If on private network, ensure Cloud NAT is configured:

```bash
gcloud compute routers create nat-router \
    --network=default \
    --region=your-region

gcloud compute routers nats create nat-config \
    --router=nat-router \
    --region=your-region \
    --auto-allocate-nat-external-ips \
    --nat-all-subnet-ip-ranges
```

## ✅ Current Dockerfile Improvements

1. ✅ Added build dependencies (python3, make, g++)
2. ✅ Copy .npmrc for config
3. ✅ Configure npm with better timeouts
4. ✅ Triple retry logic with delays
5. ✅ Graceful handling of optional dependencies
6. ✅ Clean separation of concerns

## 🎯 Expected Build Time

With the improvements:
- **Good network**: 60-90 seconds
- **Slow network**: 2-4 minutes
- **Network issues**: Up to 6 minutes (with retries)

If build takes longer than 6 minutes, there's a deeper network issue.

## 🆘 If Still Failing

### Check these:

1. **GCP Firewall**: Ensure outbound HTTPS (443) is allowed
2. **VPC Settings**: Check if VM can reach internet
3. **Network Bandwidth**: Monitor bandwidth usage
4. **npm Registry Status**: Check https://status.npmjs.org/
5. **Docker Resources**: Ensure enough memory/CPU for build

### Get build logs:

```bash
# Detailed build logs
docker-compose -f docker/prod/docker-compose.yaml build --progress=plain

# Check Docker daemon logs
sudo journalctl -u docker.service --no-pager | tail -100
```

---

**TL;DR**: 
- Network issues fixed with retry logic in Dockerfile
- .npmrc configured for better reliability
- If still fails, just retry the build - usually works on 2nd attempt
- Use `docker-compose build` again to retry
