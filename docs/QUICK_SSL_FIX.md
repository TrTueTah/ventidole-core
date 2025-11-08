# Quick Fix: ERR_SSL_PROTOCOL_ERROR

Your browser is trying to access your HTTP server over HTTPS. Here's the immediate fix:

## 🔧 Code Changes (Already Applied)

Updated `src/main.ts` to disable HTTPS-forcing headers:
- ✅ `hsts: false` - No more HTTP→HTTPS auto-upgrade
- ✅ `originAgentCluster: false` - Fixes origin cluster warning

## 🚀 Deploy

```bash
git add src/main.ts
git commit -m "fix: disable HSTS for HTTP server"
git push origin main
```

## 🧹 After Deployment: Clear Browser HSTS Cache

**Your browser remembers to use HTTPS from before. Clear it:**

### Chrome/Edge
1. Go to: `chrome://net-internals/#hsts`
2. Under "Delete domain security policies"
3. Enter: `35.193.66.111`
4. Click **Delete**
5. Restart browser

### Firefox
1. Settings → Privacy → Clear Data
2. Check "Cookies" and "Cache"
3. Clear Now
4. Restart browser

### Safari
1. Develop → Empty Caches
2. Restart browser

## ✅ Test

```bash
# After clearing cache, access:
http://35.193.66.111:8080/docs
```

**OR try in Incognito/Private mode** (extensions and cache disabled)

## 🎯 If Still Not Working

1. **Disable browser extensions** (MetaMask forces HTTPS)
2. **Use SSH tunnel**:
   ```bash
   ssh -L 8080:localhost:8080 trantanh227@35.193.66.111
   # Then access: http://localhost:8080/docs
   ```

---

For detailed troubleshooting, see `docs/SSL_ERROR_FIX.md`
