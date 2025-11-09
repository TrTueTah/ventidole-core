#!/bin/bash

DOMAIN="api-prod.ventidole.xyz"
EXPECTED_IP="34.136.155.195"

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
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN} --connect-timeout 5)
if echo "$HTTP_CODE" | grep -q "200\|301\|302"; then
    echo "   ✅ HTTP is accessible (Status: ${HTTP_CODE})"
else
    echo "   ❌ HTTP is not accessible (Status: ${HTTP_CODE})"
fi
echo ""

# 5. HTTPS Connectivity
echo "5️⃣  HTTPS Connectivity (port 443):"
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN} --connect-timeout 5 -k)
if echo "$HTTPS_CODE" | grep -q "200\|301\|302"; then
    echo "   ✅ HTTPS is accessible (Status: ${HTTPS_CODE})"
else
    echo "   ❌ HTTPS is not accessible (Status: ${HTTPS_CODE})"
fi
echo ""

# 6. Port 8080
echo "6️⃣  Port 8080 Connectivity:"
PORT_8080_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}:8080 --connect-timeout 5 -k)
if echo "$PORT_8080_CODE" | grep -q "200\|301\|302"; then
    echo "   ✅ Port 8080 is accessible (Status: ${PORT_8080_CODE})"
else
    echo "   ❌ Port 8080 is not accessible (Status: ${PORT_8080_CODE})"
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
    echo ""
    if echo "$HTTP_CODE" | grep -q "200\|301\|302" || echo "$HTTPS_CODE" | grep -q "200\|301\|302"; then
        echo "✅ Server is responding!"
    else
        echo "⚠️  DNS is correct but server is not responding"
        echo "   Check if your application is running"
    fi
else
    echo "❌ DNS configuration issue!"
    echo "   Expected: ${EXPECTED_IP}"
    echo "   Got: ${ACTUAL_IP}"
    echo ""
    echo "💡 Fix:"
    echo "   1. Go to your DNS provider"
    echo "   2. Update A record for 'api' to point to ${EXPECTED_IP}"
    echo "   3. Wait 5-15 minutes for propagation"
fi
echo ""
