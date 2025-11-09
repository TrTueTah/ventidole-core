#!/bin/bash

# DNS TXT Record Verification Helper
# Use this to verify your TXT record before pressing Enter in certbot

DOMAIN="api-prod.ventidole.xyz"
CHALLENGE_DOMAIN="_acme-challenge.api-prod.ventidole.xyz"

echo "=========================================="
echo "🔍 DNS TXT Record Verification"
echo "=========================================="
echo ""

echo "📋 Checking TXT record for: ${CHALLENGE_DOMAIN}"
echo ""

# Check from multiple DNS servers
echo "1️⃣  Checking from Google DNS (8.8.8.8)..."
GOOGLE_RESULT=$(dig @8.8.8.8 ${CHALLENGE_DOMAIN} TXT +short)
if [ -z "$GOOGLE_RESULT" ]; then
    echo "   ❌ No TXT record found"
else
    echo "   ✅ Found: ${GOOGLE_RESULT}"
fi
echo ""

echo "2️⃣  Checking from Cloudflare DNS (1.1.1.1)..."
CLOUDFLARE_RESULT=$(dig @1.1.1.1 ${CHALLENGE_DOMAIN} TXT +short)
if [ -z "$CLOUDFLARE_RESULT" ]; then
    echo "   ❌ No TXT record found"
else
    echo "   ✅ Found: ${CLOUDFLARE_RESULT}"
fi
echo ""

echo "3️⃣  Checking from your local DNS..."
LOCAL_RESULT=$(dig ${CHALLENGE_DOMAIN} TXT +short)
if [ -z "$LOCAL_RESULT" ]; then
    echo "   ❌ No TXT record found"
else
    echo "   ✅ Found: ${LOCAL_RESULT}"
fi
echo ""

# Check authoritative nameservers
echo "4️⃣  Checking authoritative nameservers..."
NAMESERVERS=$(dig ventidole.xyz NS +short | head -3)
echo "   Nameservers for ventidole.xyz:"
echo "$NAMESERVERS" | sed 's/^/      - /'
echo ""

for NS in $NAMESERVERS; do
    echo "   Checking from ${NS}..."
    NS_RESULT=$(dig @${NS} ${CHALLENGE_DOMAIN} TXT +short 2>/dev/null)
    if [ -z "$NS_RESULT" ]; then
        echo "      ❌ No TXT record found"
    else
        echo "      ✅ Found: ${NS_RESULT}"
    fi
done
echo ""

# Compare results
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo ""

if [ "$GOOGLE_RESULT" = "$CLOUDFLARE_RESULT" ] && [ "$GOOGLE_RESULT" = "$LOCAL_RESULT" ] && [ -n "$GOOGLE_RESULT" ]; then
    echo "✅ All DNS servers return the SAME value!"
    echo ""
    echo "Value: ${GOOGLE_RESULT}"
    echo ""
    echo "🎉 You're good to press Enter in certbot!"
else
    echo "⚠️  DNS servers return DIFFERENT values or no value"
    echo ""
    echo "This means:"
    echo "  • DNS hasn't fully propagated yet (wait 2-5 more minutes)"
    echo "  • OR the TXT record wasn't added correctly"
    echo "  • OR you need to delete old TXT records first"
    echo ""
    echo "🔄 Recommendations:"
    echo "  1. Check your DNS provider - make sure TXT record is saved"
    echo "  2. Delete any old _acme-challenge TXT records"
    echo "  3. Add the new TXT record value from certbot"
    echo "  4. Wait 3-5 minutes"
    echo "  5. Run this script again to verify"
fi
echo ""

# Show full DNS query details
echo "=========================================="
echo "🔬 Detailed DNS Query (for debugging)"
echo "=========================================="
dig ${CHALLENGE_DOMAIN} TXT
echo ""
