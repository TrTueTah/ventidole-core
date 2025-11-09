# Fix: Incorrect TXT Record Error

## 🐛 Problem

```
Detail: Incorrect TXT record "zWtz2U71sBzC99JJigPDKN17ghwSbV62eVbgd2PhcLg" found
```

**This means**: Let's Encrypt found a TXT record, but it's not the value they expected.

## 🔍 Common Causes

1. **Old TXT record not deleted** - You have an old `_acme-challenge` record from a previous attempt
2. **Wrong value entered** - The value doesn't match what certbot showed
3. **DNS not propagated** - The new value hasn't spread to all DNS servers yet
4. **Multiple TXT records** - You added a new record without deleting the old one

## ✅ Solution: Clean Slate Approach

### Step 1: Delete ALL _acme-challenge TXT records

Go to your DNS provider and **delete all TXT records** for:
- `_acme-challenge.api-prod.ventidole.xyz`
- `_acme-challenge.api`

**Important**: Make sure they're completely removed, not just edited!

### Step 2: Wait for DNS to clear

```bash
# On your server or local machine
dig _acme-challenge.api-prod.ventidole.xyz TXT +short

# Should return NOTHING (empty result)
# If you still see old values, wait 2-3 more minutes
```

### Step 3: Run certbot again (fresh attempt)

```bash
# On your GCP server
cd /home/trantanh227/ventidole-core

# Clean certbot state
sudo rm -rf /var/lib/letsencrypt/*
sudo rm -rf /var/log/letsencrypt/*

# Try again with manual challenge
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api-prod.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com
```

### Step 4: When certbot shows the NEW TXT value

Certbot will show something like:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.api-prod.ventidole.xyz.

with the following value:
ABC123XYZ456... (NEW VALUE - different from before!)

Press Enter to Continue
```

**Copy this NEW value carefully!**

### Step 5: Add the NEW TXT record

Go to your DNS provider:

| Field | Value |
|-------|-------|
| **Type** | `TXT` |
| **Name** | `_acme-challenge.api` |
| **Value** | `ABC123XYZ456...` (paste the NEW value from certbot) |
| **TTL** | `300` or `1 min` |

**Save/Add the record**

### Step 6: Verify with the verification script

```bash
# On server
cd /home/trantanh227/ventidole-core
git pull origin main
chmod +x scripts/verify-dns-txt.sh
bash scripts/verify-dns-txt.sh
```

**What to look for:**
- ✅ All DNS servers return the SAME value
- ✅ The value matches what certbot showed you
- ❌ If different or empty → wait more or check DNS provider

### Step 7: Press Enter in certbot

Once the verification script shows "✅ All DNS servers return the SAME value", go back to certbot and press Enter.

Certificate should be issued! ✅

---

## 🚀 Quick Commands

### On your GCP server:

```bash
# 1. Pull verification script
cd /home/trantanh227/ventidole-core
git pull origin main
chmod +x scripts/verify-dns-txt.sh

# 2. Check current TXT record (should be empty after deletion)
bash scripts/verify-dns-txt.sh

# 3. Clean certbot and retry
sudo rm -rf /var/lib/letsencrypt/*
sudo rm -rf /var/log/letsencrypt/*

# 4. Start fresh
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api-prod.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com

# 5. Add NEW TXT record to DNS provider

# 6. Verify before pressing Enter
bash scripts/verify-dns-txt.sh

# 7. Press Enter in certbot when verification passes
```

---

## 🔍 Debug: Check Your DNS Provider

### Make sure you're adding the record correctly:

**Cloudflare:**
```
Type: TXT
Name: _acme-challenge.api
Content: (paste value from certbot)
TTL: Auto
```

**Google Cloud DNS:**
```bash
# Delete old records first
gcloud dns record-sets delete _acme-challenge.api-prod.ventidole.xyz. \
    --type=TXT \
    --zone=your-zone-name

# Add new record
gcloud dns record-sets create _acme-challenge.api-prod.ventidole.xyz. \
    --type=TXT \
    --ttl=300 \
    --rrdatas="(paste value from certbot)" \
    --zone=your-zone-name
```

**Namecheap/GoDaddy:**
```
Record Type: TXT Record
Host: _acme-challenge.api
Value: (paste value from certbot)
TTL: 1 min or Automatic
```

---

## ⚠️ Common Mistakes

### Mistake 1: Not deleting old TXT records
**Fix**: Delete ALL `_acme-challenge.api` TXT records before adding new one

### Mistake 2: Adding record to wrong domain
**Fix**: Add to `_acme-challenge.api-prod.ventidole.xyz` NOT `ventidole.xyz`

### Mistake 3: Pressing Enter too quickly
**Fix**: Wait until verification script confirms record is propagated

### Mistake 4: Copying value with extra quotes or spaces
**Fix**: Copy ONLY the value, no quotes: `ABC123XYZ456` not `"ABC123XYZ456"`

### Mistake 5: Multiple TXT records exist
**Fix**: Only ONE `_acme-challenge.api` TXT record should exist at a time

---

## 🧪 Verification Checklist

Before pressing Enter in certbot:

- [ ] Old TXT records deleted from DNS
- [ ] New TXT record added with correct value
- [ ] Waited 3-5 minutes for propagation
- [ ] Ran `bash scripts/verify-dns-txt.sh` - shows ✅
- [ ] All DNS servers return the SAME value
- [ ] Value matches what certbot showed

If all ✅, press Enter in certbot!

---

## 🆘 Still Failing?

### Try using your DNS provider's API (automated)

If manual is too error-prone, use certbot's DNS plugins:

#### For Cloudflare:
```bash
sudo apt install -y python3-certbot-dns-cloudflare

# Create API token file
sudo mkdir -p ~/.secrets/certbot
echo "dns_cloudflare_api_token = YOUR_TOKEN" | sudo tee ~/.secrets/certbot/cloudflare.ini
sudo chmod 600 ~/.secrets/certbot/cloudflare.ini

# Get certificate automatically
sudo certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini \
    -d api-prod.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com
```

This handles TXT records automatically! ✅

---

**TL;DR:**
1. Delete ALL old `_acme-challenge.api` TXT records
2. Wait 3 minutes for DNS to clear
3. Run certbot again (gets NEW value)
4. Add NEW TXT record to DNS
5. Run `bash scripts/verify-dns-txt.sh` to confirm
6. Press Enter in certbot when verified
7. Certificate issued! 🎉
