# Check if Domain Points to Your VM

## 🔍 Quick Commands

### 1. Check DNS Resolution (Most Important)

```bash
# From your local machine
dig api-prod.ventidole.xyz +short

# Should return your VM's IP: 35.193.66.111
```

**Expected output:**
```
35.193.66.111
```

If it returns a different IP or nothing, your DNS is not configured correctly.

---

### 2. Check from Multiple DNS Servers

```bash
# Google DNS
dig @8.8.8.8 api-prod.ventidole.xyz +short

# Cloudflare DNS
dig @1.1.1.1 api-prod.ventidole.xyz +short

# Your local DNS
dig api-prod.ventidole.xyz +short
```

All should return the same IP: `35.193.66.111`

---

### 3. Check with nslookup (Alternative to dig)

```bash
nslookup api-prod.ventidole.xyz

# Expected output:
# Server:    1.1.1.1
# Address:   1.1.1.1#53
#
# Non-authoritative answer:
# Name:   api-prod.ventidole.xyz
# Address: 35.193.66.111
```

---

### 4. Check HTTP/HTTPS Connectivity

```bash
# Test HTTP (port 80)
curl -I http://api-prod.ventidole.xyz

# Test HTTPS (port 443)
curl -I https://api-prod.ventidole.xyz

# Test with custom port
curl -I https://api-prod.ventidole.xyz:8080
```

---

### 5. Check from Online Tools

Visit these websites to check from different locations:

- **DNS Checker**: https://dnschecker.org
  - Enter: `api-prod.ventidole.xyz`
  - Check if it resolves to `35.193.66.111` globally

- **What's My DNS**: https://www.whatsmydns.net
  - Enter: `api-prod.ventidole.xyz`
  - Check A record

- **DNS Propagation**: https://www.dnswatch.info
  - Check DNS propagation status

---

### 6. Check Your VM's External IP

On your GCP VM, check what IP it has:

```bash
# SSH to your VM
ssh trantanh227@35.193.66.111

# Check external IP from inside VM
curl ifconfig.me
# or
curl icanhazip.com

# Should return: 35.193.66.111
```

---

### 7. Check GCP VM Details

```bash
# List your VM instances
gcloud compute instances list

# Get specific instance details
gcloud compute instances describe YOUR_INSTANCE_NAME \
    --zone=YOUR_ZONE \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"

# Should return: 35.193.66.111
```

---

### 8. Ping Test (Basic Connectivity)

```bash
ping api-prod.ventidole.xyz

# Expected output:
# PING api-prod.ventidole.xyz (35.193.66.111): 56 data bytes
# 64 bytes from 35.193.66.111: icmp_seq=0 ttl=54 time=45.1 ms
```

**Note**: Some VMs block ICMP (ping), so this might not work even if DNS is correct.

---

### 9. Telnet Test (Check Port Accessibility)

```bash
# Check if port 80 is open
telnet api-prod.ventidole.xyz 80

# Check if port 443 is open
telnet api-prod.ventidole.xyz 443

# Check if port 8080 is open
telnet api-prod.ventidole.xyz 8080

# Press Ctrl+] then type "quit" to exit
```

**If connection succeeds:**
```
Trying 35.193.66.111...
Connected to api-prod.ventidole.xyz.
```

**If connection fails:**
```
Trying 35.193.66.111...
telnet: Unable to connect to remote host: Connection refused
```

---

### 10. Traceroute (Check Network Path)

```bash
traceroute api-prod.ventidole.xyz

# Shows the network path to your VM
# Last hop should be 35.193.66.111
```

---

## ✅ Complete Check Script

Create this script to check everything at once:

```bash
#!/bin/bash

DOMAIN="api-prod.ventidole.xyz"
EXPECTED_IP="35.193.66.111"

echo "=========================================="
echo "🔍 Domain DNS Check: ${DOMAIN}"
echo "=========================================="
echo ""

# 1. DNS Resolution
echo "1️⃣  DNS Resolution:"
ACTUAL_IP=$(dig +short ${DOMAIN} | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
if [ "$ACTUAL_IP" = "$EXPECTED_IP" ]; then
    echo "   ✅ Resolves to: ${ACTUAL_IP}"
else
    echo "   ❌ Resolves to: ${ACTUAL_IP} (Expected: ${EXPECTED_IP})"
fi
echo ""

# 2. Google DNS
echo "2️⃣  Google DNS (8.8.8.8):"
GOOGLE_IP=$(dig @8.8.8.8 +short ${DOMAIN} | head -1)
if [ "$GOOGLE_IP" = "$EXPECTED_IP" ]; then
    echo "   ✅ ${GOOGLE_IP}"
else
    echo "   ❌ ${GOOGLE_IP}"
fi
echo ""

# 3. Cloudflare DNS
echo "3️⃣  Cloudflare DNS (1.1.1.1):"
CF_IP=$(dig @1.1.1.1 +short ${DOMAIN} | head -1)
if [ "$CF_IP" = "$EXPECTED_IP" ]; then
    echo "   ✅ ${CF_IP}"
else
    echo "   ❌ ${CF_IP}"
fi
echo ""

# 4. HTTP Connectivity
echo "4️⃣  HTTP Connectivity (port 80):"
if curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN} --connect-timeout 5 | grep -q "200\|301\|302"; then
    echo "   ✅ HTTP is accessible"
else
    echo "   ❌ HTTP is not accessible"
fi
echo ""

# 5. HTTPS Connectivity
echo "5️⃣  HTTPS Connectivity (port 443):"
if curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN} --connect-timeout 5 -k | grep -q "200\|301\|302"; then
    echo "   ✅ HTTPS is accessible"
else
    echo "   ❌ HTTPS is not accessible"
fi
echo ""

# 6. Port 8080
echo "6️⃣  Port 8080 Connectivity:"
if curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}:8080 --connect-timeout 5 -k | grep -q "200\|301\|302"; then
    echo "   ✅ Port 8080 is accessible"
else
    echo "   ❌ Port 8080 is not accessible"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
if [ "$ACTUAL_IP" = "$EXPECTED_IP" ]; then
    echo "✅ DNS is correctly configured!"
    echo "   Domain: ${DOMAIN}"
    echo "   Points to: ${ACTUAL_IP}"
else
    echo "❌ DNS configuration issue!"
    echo "   Expected: ${EXPECTED_IP}"
    echo "   Got: ${ACTUAL_IP}"
fi
echo ""
```

**Save as `scripts/check-domain.sh` and run:**

```bash
chmod +x scripts/check-domain.sh
bash scripts/check-domain.sh
```

---

## 🎯 What You're Looking For

### ✅ Correct Configuration:

```bash
dig api-prod.ventidole.xyz +short
# Output: 35.193.66.111
```

### ❌ Incorrect Configuration:

```bash
dig api-prod.ventidole.xyz +short
# Output: (nothing) or different IP
```

---

## 🔧 If DNS is Wrong

If the domain doesn't point to your VM:

1. **Check your DNS provider** (where you manage ventidole.xyz)
2. **Look for A record**:
   - Name: `api` or `api-prod.ventidole.xyz`
   - Type: `A`
   - Value: Should be `35.193.66.111`
3. **Wait 5-15 minutes** for DNS propagation
4. **Clear DNS cache** on your machine:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

## 📋 Quick Reference

| Command | Purpose |
|---------|---------|
| `dig api-prod.ventidole.xyz +short` | Check DNS resolution |
| `curl -I http://api-prod.ventidole.xyz` | Test HTTP connectivity |
| `curl -I https://api-prod.ventidole.xyz` | Test HTTPS connectivity |
| `telnet api-prod.ventidole.xyz 80` | Test port 80 |
| `nslookup api-prod.ventidole.xyz` | Alternative DNS check |

---

**TL;DR**: Run `dig api-prod.ventidole.xyz +short` - if it returns `35.193.66.111`, your domain points to your VM! ✅
