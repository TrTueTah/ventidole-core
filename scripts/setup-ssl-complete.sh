#!/bin/bash

# Complete SSL Setup Script - Run this on your GCP server
# This script handles everything from HTTP setup to HTTPS with certificates

set -e

PROJECT_DIR="/home/trantanh227/ventidole-core"
DOMAIN="api.ventidole.xyz"
EMAIL="trantanh227@gmail.com"  # Change this to your email if needed

echo "🚀 Starting SSL Setup for ${DOMAIN}..."
echo ""

# Step 1: Pull latest changes
echo "📥 Step 1: Pulling latest changes..."
cd ${PROJECT_DIR}
git pull origin main
echo "✅ Done"
echo ""

# Step 2: Clean any existing certbot data (optional)
echo "🧹 Step 2: Cleaning old certbot data..."
read -p "Do you want to clean all existing certificates? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo rm -rf /etc/letsencrypt/*
    sudo rm -rf /var/lib/letsencrypt/*
    sudo rm -rf /var/log/letsencrypt/*
    sudo mkdir -p /etc/letsencrypt
    sudo mkdir -p /var/lib/letsencrypt
    sudo mkdir -p /var/log/letsencrypt
    echo "✅ Cleaned"
else
    echo "⏭️  Skipped"
fi
echo ""

# Step 3: Switch to HTTP-only config
echo "📝 Step 3: Setting up HTTP-only configuration..."
cp config.d/nginx/default.prod.conf config.d/nginx/default.prod.conf.backup 2>/dev/null || true
cp config.d/nginx/default.temp.conf config.d/nginx/default.prod.conf
echo "✅ Done"
echo ""

# Step 4: Stop any running containers
echo "⏹️  Step 4: Stopping containers..."
docker-compose -f docker/prod/docker-compose.yaml down 2>/dev/null || true
echo "✅ Done"
echo ""

# Step 5: Get SSL certificate
echo "🔐 Step 5: Getting SSL certificate..."
echo ""
echo "⚠️  IMPORTANT: Choose your preferred method"
echo ""
echo "Option 1: DNS-01 Challenge (Recommended if DNSSEC is broken)"
echo "  - You'll need to add a TXT record to your DNS"
echo "  - Takes 2-3 minutes"
echo "  - Works even with DNSSEC issues"
echo ""
echo "Option 2: HTTP-01 Challenge (Requires DNSSEC to be fixed)"
echo "  - Automatic verification via HTTP"
echo "  - Faster (30 seconds)"
echo "  - Requires port 80 accessible and DNSSEC working"
echo ""

read -p "Choose method (1 for DNS-01, 2 for HTTP-01): " CHOICE
echo ""

if [[ $CHOICE == "1" ]]; then
    echo "📋 Using DNS-01 Challenge..."
    echo ""
    echo "⚠️  After certbot shows you the TXT record:"
    echo "   1. Go to your DNS provider"
    echo "   2. Add TXT record:"
    echo "      - Type: TXT"
    echo "      - Name: _acme-challenge.api"
    echo "      - Value: (paste the value shown by certbot)"
    echo "      - TTL: 300"
    echo "   3. Wait 2 minutes for DNS propagation"
    echo "   4. Verify with: dig _acme-challenge.api.ventidole.xyz TXT +short"
    echo "   5. Press Enter in certbot when ready"
    echo ""
    read -p "Press Enter when you understand the above steps..."
    echo ""
    
    sudo certbot certonly --manual \
        --preferred-challenges dns \
        -d ${DOMAIN} \
        --agree-tos \
        --email ${EMAIL}
        
elif [[ $CHOICE == "2" ]]; then
    echo "🌐 Using HTTP-01 Challenge..."
    
    # First start HTTP server briefly
    echo "Starting temporary HTTP server..."
    cp config.d/nginx/default.temp.conf config.d/nginx/default.prod.conf
    
    # Create minimal docker-compose for HTTP only
    cat > /tmp/docker-compose-temp.yaml << 'EOF'
services:
  server:
    build:
      context: ../..
      dockerfile: docker/prod/Dockerfile
    container_name: ventidole-server-temp
    env_file:
      - ../../.env
  gateway:
    image: nginx:alpine
    container_name: ventidole-gateway-temp
    ports:
      - "80:80"
    volumes:
      - ../../config.d/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../../config.d/nginx/default.temp.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - server
EOF
    
    docker-compose -f /tmp/docker-compose-temp.yaml up -d
    sleep 5
    docker-compose -f /tmp/docker-compose-temp.yaml down
    
    sudo certbot certonly --standalone \
        -d ${DOMAIN} \
        --agree-tos \
        --email ${EMAIL}
else
    echo "❌ Invalid choice. Exiting."
    exit 1
fi

# Step 6: Verify certificates
echo ""
echo "🔍 Step 6: Verifying certificates..."
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "✅ Certificates found!"
    sudo ls -la /etc/letsencrypt/live/${DOMAIN}/
else
    echo "❌ Certificate generation failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
echo ""

# Step 7: Restore HTTPS config
echo "📝 Step 7: Restoring HTTPS configuration..."
cp config.d/nginx/default.prod.conf.backup config.d/nginx/default.prod.conf 2>/dev/null || \
    git checkout config.d/nginx/default.prod.conf
echo "✅ Done"
echo ""

# Step 8: Open firewall
echo "🔥 Step 8: Opening firewall rules..."
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0 2>/dev/null && echo "✅ Port 443 opened" || echo "⚠️  Port 443 rule already exists"
gcloud compute firewall-rules create allow-http --allow tcp:80 --source-ranges 0.0.0.0/0 2>/dev/null && echo "✅ Port 80 opened" || echo "⚠️  Port 80 rule already exists"
echo ""

# Step 9: Start with HTTPS
echo "🚀 Step 9: Starting containers with HTTPS..."
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
echo "✅ Done"
echo ""

# Step 10: Wait and test
echo "⏳ Waiting 10 seconds for containers to start..."
sleep 10
echo ""

echo "🧪 Step 10: Testing HTTPS..."
echo ""
if curl -I -k https://${DOMAIN} 2>/dev/null | head -n 1 | grep -q "200\|301\|302"; then
    echo "✅ HTTPS is working!"
    echo ""
    echo "🎉 SUCCESS! Your application is now running with HTTPS"
    echo ""
    echo "📋 Access your application:"
    echo "   • API: https://${DOMAIN}"
    echo "   • Swagger: https://${DOMAIN}/docs"
    echo ""
    echo "📊 Check status:"
    echo "   • docker ps"
    echo "   • docker logs ventidole-gateway"
    echo "   • curl -I https://${DOMAIN}"
    echo ""
else
    echo "⚠️  HTTPS test failed. Checking logs..."
    echo ""
    echo "📋 Gateway logs:"
    docker logs ventidole-gateway --tail 50
    echo ""
    echo "💡 Try accessing: https://${DOMAIN}"
fi

# Show certificate info
echo ""
echo "📜 Certificate Information:"
sudo certbot certificates | grep -A 10 ${DOMAIN}
echo ""

echo "✅ Setup complete!"
