#!/bin/bash

# Simple SSL Setup Script - DNS-01 Challenge Only
# Run this on your GCP server as: sudo bash scripts/setup-ssl-simple.sh

set -e

PROJECT_DIR="/home/trantanh227/ventidole-core"
DOMAIN="api.ventidole.xyz"
EMAIL="trantanh227@gmail.com"

echo "=========================================="
echo "🚀 Simple SSL Setup for ${DOMAIN}"
echo "=========================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Navigate to project
cd ${PROJECT_DIR}
echo "📂 Working directory: ${PROJECT_DIR}"
echo ""

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main
echo "✅ Done"
echo ""

# Stop containers
echo "⏹️  Stopping containers..."
docker compose -f docker/prod/docker-compose.yaml down 2>/dev/null || true
echo "✅ Done"
echo ""

# Get SSL certificate via DNS-01
echo "=========================================="
echo "🔐 Getting SSL Certificate (DNS-01)"
echo "=========================================="
echo ""
echo "⚠️  INSTRUCTIONS:"
echo ""
echo "1. Certbot will show you a TXT record value"
echo "2. Go to your DNS provider and add:"
echo "   • Type: TXT"
echo "   • Name: _acme-challenge.api"
echo "   • Value: (paste the value certbot shows)"
echo "   • TTL: 300"
echo ""
echo "3. Verify with: dig _acme-challenge.api.ventidole.xyz TXT +short"
echo ""
echo "4. Wait 2-3 minutes for DNS propagation"
echo ""
echo "5. Press Enter when certbot prompts you"
echo ""
echo "=========================================="
echo ""
read -p "Press Enter when you understand the above steps..."
echo ""

certbot certonly --manual \
    --preferred-challenges dns \
    -d ${DOMAIN} \
    --agree-tos \
    --email ${EMAIL}

# Verify certificates
echo ""
echo "=========================================="
echo "🔍 Verifying certificates..."
echo "=========================================="
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "✅ Certificates found!"
    echo ""
    ls -la /etc/letsencrypt/live/${DOMAIN}/
    echo ""
else
    echo "❌ Certificate generation failed!"
    echo ""
    echo "📋 Check logs:"
    echo "  tail -f /var/log/letsencrypt/letsencrypt.log"
    echo ""
    exit 1
fi

# Open firewall
echo "=========================================="
echo "🔥 Opening firewall rules..."
echo "=========================================="
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0 2>/dev/null && echo "✅ Port 443 opened" || echo "⚠️  Port 443 rule already exists"
gcloud compute firewall-rules create allow-http --allow tcp:80 --source-ranges 0.0.0.0/0 2>/dev/null && echo "✅ Port 80 opened" || echo "⚠️  Port 80 rule already exists"
echo ""

# Start containers with HTTPS
echo "=========================================="
echo "🚀 Starting containers with HTTPS..."
echo "=========================================="
cd ${PROJECT_DIR}
docker compose --env-file .env -f docker/prod/docker-compose.yaml up -d
echo "✅ Done"
echo ""

# Wait for containers to start
echo "⏳ Waiting 15 seconds for containers to initialize..."
sleep 15
echo ""

# Show container status
echo "=========================================="
echo "📊 Container Status"
echo "=========================================="
docker ps --filter "name=ventidole" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Test HTTPS
echo "=========================================="
echo "🧪 Testing HTTPS..."
echo "=========================================="
if curl -I -s -k https://${DOMAIN} | head -n 1 | grep -q "HTTP"; then
    echo "✅ HTTPS is responding!"
    echo ""
    curl -I -s https://${DOMAIN} | head -n 5
else
    echo "⚠️  HTTPS test inconclusive. Checking logs..."
    echo ""
    echo "📋 Gateway logs (last 20 lines):"
    docker logs ventidole-gateway --tail 20
fi
echo ""

# Success message
echo "=========================================="
echo "🎉 SSL Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Access your application:"
echo "   • API: https://${DOMAIN}"
echo "   • Swagger: https://${DOMAIN}/docs"
echo ""
echo "🔍 Useful commands:"
echo "   • Check containers: docker ps"
echo "   • View logs: docker logs ventidole-gateway"
echo "   • Test HTTPS: curl -I https://${DOMAIN}"
echo "   • Certificate info: certbot certificates"
echo ""
echo "✅ Setup complete!"
