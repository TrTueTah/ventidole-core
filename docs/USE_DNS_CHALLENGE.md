# IMMEDIATE FIX: Use DNS-01 Challenge to Bypass DNSSEC Issues

## 🚨 Current Problem

```
DNSSEC: DNSKEY Missing: validation failure
No DNSKEY record [misc failure]
```

Let's Encrypt cannot validate your domain due to broken DNSSEC (transition in progress).

## ✅ Solution: Use DNS-01 Challenge

DNS-01 challenge bypasses HTTP and DNSSEC A/AAAA record lookups by using TXT records instead.

### Step 1: Run Certbot with DNS Challenge

```bash
# On your GCP server
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com
```

### Step 2: Add TXT Record

Certbot will output something like:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.api.ventidole.xyz.

with the following value:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Before continuing, verify the TXT record has been deployed.
```

### Step 3: Add TXT Record to Your DNS

Go to your DNS provider (where you manage ventidole.xyz DNS):

**Add this record:**
```
Type: TXT
Name: _acme-challenge.api
Value: (the value certbot showed you)
TTL: 300 (or 1 minute)
```

**Examples by provider:**

#### Cloudflare:
1. DNS tab → Add Record
2. Type: `TXT`
3. Name: `_acme-challenge.api`
4. Content: `(paste value from certbot)`
5. TTL: Auto
6. Save

#### Google Cloud DNS:
```bash
gcloud dns record-sets create _acme-challenge.api.ventidole.xyz. \
    --type=TXT \
    --ttl=300 \
    --rrdatas="(paste value from certbot)" \
    --zone=your-zone-name
```

#### Namecheap/GoDaddy:
1. Advanced DNS
2. Add New Record
3. Type: `TXT Record`
4. Host: `_acme-challenge.api`
5. Value: `(paste value)`
6. TTL: 1 min or Automatic

### Step 4: Verify TXT Record

Before pressing Enter in certbot, verify:

```bash
# From your local machine or server
dig _acme-challenge.api.ventidole.xyz TXT +short

# You should see the value you added
# Example output: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**If you don't see it yet, wait 2-3 minutes** (DNS propagation).

### Step 5: Complete Certbot

Once you see the TXT record:

```
Press Enter to Continue
```

Certbot will validate and issue your certificate! ✅

### Step 6: Clean Up

After getting the certificate, you can delete the TXT record from your DNS.

## 🔄 Alternative: Use Automated DNS Plugin

If your DNS provider is supported, use automated DNS validation:

### For Cloudflare:

```bash
# Install plugin
sudo apt update
sudo apt install -y python3-certbot-dns-cloudflare

# Create credentials file
sudo mkdir -p ~/.secrets/certbot
sudo nano ~/.secrets/certbot/cloudflare.ini
```

Add to file:
```ini
# Cloudflare API token
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
```

Get token from: https://dash.cloudflare.com/profile/api-tokens
- Create Token → Edit zone DNS template
- Zone Resources: Include → Specific zone → ventidole.xyz
- Copy token

```bash
# Secure the file
sudo chmod 600 ~/.secrets/certbot/cloudflare.ini

# Get certificate
sudo certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini \
    -d api.ventidole.xyz \
    --email your-email@example.com \
    --agree-tos
```

### For Google Cloud DNS:

```bash
# Install plugin
sudo apt install -y python3-certbot-dns-google

# Authenticate
gcloud auth application-default login

# Get certificate
sudo certbot certonly \
    --dns-google \
    --dns-google-credentials /path/to/credentials.json \
    -d api.ventidole.xyz \
    --email your-email@example.com \
    --agree-tos
```

### For Route53:

```bash
# Install plugin
sudo apt install -y python3-certbot-dns-route53

# Get certificate (uses AWS credentials)
sudo certbot certonly \
    --dns-route53 \
    -d api.ventidole.xyz \
    --email your-email@example.com \
    --agree-tos
```

## 📋 Full Step-by-Step (Manual DNS-01)

```bash
# 1. SSH to server
ssh trantanh227@35.193.66.111

# 2. Stop containers
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down

# 3. Run certbot with DNS challenge
sudo certbot certonly --manual \
    --preferred-challenges dns \
    -d api.ventidole.xyz \
    --agree-tos \
    --email your-email@example.com

# 4. Follow prompts:
#    - It will show you a TXT record value
#    - Add this to your DNS as _acme-challenge.api.ventidole.xyz
#    - Wait 2 minutes
#    - Verify with: dig _acme-challenge.api.ventidole.xyz TXT +short
#    - Press Enter in certbot

# 5. Certificate should be issued!
# Location: /etc/letsencrypt/live/api.ventidole.xyz/

# 6. Start containers
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# 7. Test
curl -I https://api.ventidole.xyz
```

## 🎯 Why DNS-01 Works When HTTP-01 Fails

**HTTP-01 challenge:**
- Requires A/AAAA record DNS lookup ❌ (broken by DNSSEC)
- Let's Encrypt needs to resolve your domain to connect

**DNS-01 challenge:**
- Uses TXT record DNS lookup ✅ (not affected by A/AAAA DNSSEC issues)
- Let's Encrypt only needs to read a TXT record
- Bypasses all HTTP/CAA/A record problems

## ⏰ When Can You Use HTTP-01 Again?

Once DNSSEC is fully removed (15-30 minutes), you can use HTTP-01:

```bash
# Check if fixed
dig api.ventidole.xyz +short
# Should consistently return: 35.193.66.111

# Then use HTTP-01 for renewals
sudo certbot renew --preferred-challenges http
```

## 🚀 Quick Command (Copy-Paste Ready)

```bash
sudo certbot certonly --manual --preferred-challenges dns -d api.ventidole.xyz --agree-tos --email your-email@example.com
```

Then add the TXT record it shows you, wait 2 minutes, press Enter. Done! 🎉

---

**TL;DR**: Use DNS-01 challenge - it works regardless of DNSSEC issues. Just add a TXT record and get your certificate immediately!
