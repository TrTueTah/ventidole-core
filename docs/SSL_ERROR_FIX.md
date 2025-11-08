# ERR_SSL_PROTOCOL_ERROR Fix for HTTP Server

## 🐛 Problem

When accessing `http://35.193.66.111:8080/docs`, the browser attempts to load resources over HTTPS:

```
GET https://35.193.66.111:8080/docs/swagger-ui.css net::ERR_SSL_PROTOCOL_ERROR
GET https://35.193.66.111:8080/docs/swagger-ui-bundle.js net::ERR_SSL_PROTOCOL_ERROR
```

**Root Causes:**
1. Browser automatically upgrading HTTP → HTTPS
2. HSTS (HTTP Strict Transport Security) previously set
3. Browser extensions (MetaMask, etc.) forcing HTTPS
4. Origin-Agent-Cluster header issues

## ✅ Solution Applied

### 1. Updated Helmet Configuration (`src/main.ts`)

```typescript
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
    crossOriginOpenerPolicy: false,   // Disable COOP
    crossOriginEmbedderPolicy: false, // Disable COEP
    hsts: false,                      // Disable HSTS (prevents HTTP→HTTPS upgrade)
    originAgentCluster: false,        // Disable Origin-Agent-Cluster header
  }),
);
```

### 2. Key Changes

| Setting | Value | Purpose |
|---------|-------|---------|
| `hsts` | `false` | Prevents browser from auto-upgrading HTTP to HTTPS |
| `originAgentCluster` | `false` | Fixes "origin-keyed agent cluster" warning |
| `crossOriginOpenerPolicy` | `false` | Removes COOP header for HTTP |
| `crossOriginEmbedderPolicy` | `false` | Removes COEP header for HTTP |

## 🧪 Testing After Deployment

### Step 1: Clear Browser Cache & HSTS Settings

**Chrome/Edge:**
```
1. Open chrome://net-internals/#hsts
2. Delete domain security policies:
   - Enter: 35.193.66.111
   - Click "Delete"
3. Clear browsing data (Ctrl+Shift+Delete)
   - Cached images and files
   - Cookies and site data
4. Restart browser
```

**Firefox:**
```
1. Open about:preferences#privacy
2. Clear Data → Cookies and Site Data
3. Clear Data → Cached Web Content
4. Restart browser
```

**Safari:**
```
1. Develop → Empty Caches
2. Safari → Clear History
3. Restart browser
```

### Step 2: Access via HTTP (Force HTTP)

```bash
# Explicit HTTP access
http://35.193.66.111:8080/docs
```

### Step 3: Disable Browser Extensions Temporarily

Some extensions force HTTPS:
- MetaMask
- HTTPS Everywhere
- Privacy Badger
- uBlock Origin (HTTPS filtering)

**Test in Incognito/Private mode** (extensions disabled by default)

### Step 4: Verify with curl

```bash
# Check response headers
curl -I http://35.193.66.111:8080/docs

# Should NOT see these headers:
# ✗ Strict-Transport-Security
# ✗ Cross-Origin-Opener-Policy
# ✗ Cross-Origin-Embedder-Policy
# ✗ Origin-Agent-Cluster
```

## 🔧 Alternative Solutions

### Option 1: Use a Domain with HTTP (Recommended for Testing)

If you have a domain, you can explicitly use HTTP:
```
http://yourdomain.com:8080/docs
```

Browsers are less aggressive about upgrading domains to HTTPS than IPs.

### Option 2: Access via localhost Tunnel (For Development)

```bash
# On your local machine, create SSH tunnel
ssh -L 8080:localhost:8080 trantanh227@35.193.66.111

# Then access
http://localhost:8080/docs
```

Browsers trust localhost and won't upgrade to HTTPS.

### Option 3: Setup HTTPS (Production Solution)

For production, you should use HTTPS. Your `docker-compose.yaml` already has nginx configured:

```yaml
gateway:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt/live:/etc/letsencrypt/live:ro
```

**Setup SSL with Let's Encrypt:**

```bash
# SSH into your GCP server
ssh trantanh227@35.193.66.111

# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# If you have a domain (e.g., api.yourdomain.com)
sudo certbot certonly --standalone -d api.yourdomain.com

# Uncomment nginx gateway in docker-compose.yaml
cd /home/trantanh227/ventidole-core
nano docker/prod/docker-compose.yaml
# Uncomment the gateway service lines

# Restart with SSL
docker-compose -f docker/prod/docker-compose.yaml down
docker-compose -f docker/prod/docker-compose.yaml up -d
```

Then update Helmet to enable HTTPS headers:

```typescript
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
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Enable other headers for HTTPS
  }),
);
```

## 🚀 Deployment

```bash
git add src/main.ts
git commit -m "fix: disable HSTS and origin-agent-cluster for HTTP server"
git push origin main
```

Wait for GitHub Actions deployment to complete.

## 📋 Verification Checklist

After deployment:

- [ ] Clear browser HSTS cache
- [ ] Clear browser cookies/cache
- [ ] Restart browser
- [ ] Try in incognito mode
- [ ] Disable browser extensions
- [ ] Access: `http://35.193.66.111:8080/docs`
- [ ] Swagger UI loads completely
- [ ] No SSL/HTTPS errors in console
- [ ] CSS and JS files load correctly

## 🔍 If Still Having Issues

### Check if HSTS is cached

```bash
# Chrome HSTS check
chrome://net-internals/#hsts

# Query domain: 35.193.66.111
# If "Found:", delete it
```

### Check server headers

```bash
curl -v http://35.193.66.111:8080/docs 2>&1 | grep -i "strict-transport"
# Should return nothing
```

### Check if nginx is interfering

```bash
# SSH to server
ssh trantanh227@35.193.66.111

# Check if nginx is running
docker ps | grep nginx

# If nginx gateway is running and redirecting HTTP→HTTPS
# Stop it temporarily
docker-compose -f docker/prod/docker-compose.yaml stop gateway
```

### Browser Developer Tools

1. Open DevTools (F12)
2. Network tab
3. Reload page
4. Check each failed request:
   - Click on failed request
   - Check "Headers" tab
   - Look for redirect (301/302) or upgrade-insecure-requests

## 🎯 Expected Result

After these fixes:

✅ Access `http://35.193.66.111:8080/docs` directly
✅ Swagger UI loads with all CSS/JS
✅ No ERR_SSL_PROTOCOL_ERROR
✅ No HSTS/COOP/COEP warnings
✅ API documentation fully functional

## 📚 Resources

- [HTTP Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [Chrome HSTS Clearing](https://www.thesslstore.com/blog/clear-hsts-settings-chrome-firefox/)
- [Helmet.js Options](https://helmetjs.github.io/)
- [Origin-Agent-Cluster](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin-Agent-Cluster)

---

**Note**: For production deployments, always use HTTPS. These HTTP settings are only appropriate for development and testing environments without SSL certificates.
