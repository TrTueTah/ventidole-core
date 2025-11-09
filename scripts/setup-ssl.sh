#!/bin/bash

# SSL Certificate Setup Script for api.ventidole.xyz
# This script automates the SSL certificate acquisition process

set -e  # Exit on error

echo "🔐 SSL Certificate Setup for api.ventidole.xyz"
echo "================================================"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo: sudo bash setup-ssl.sh"
    exit 1
fi

# Configuration
DOMAIN="api.ventidole.xyz"
HTTP_PORT="80"
APP_DIR="/home/trantanh227/ventidole-core"
EMAIL=""

# Prompt for email if not set
if [ -z "$EMAIL" ]; then
    echo "📧 Please enter your email for Let's Encrypt notifications:"
    read -r EMAIL
    
    if [ -z "$EMAIL" ]; then
        echo "❌ Email is required!"
        exit 1
    fi
fi

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  HTTP Port: $HTTP_PORT"
echo "  Email: $EMAIL"
echo "  App Directory: $APP_DIR"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user"
    exit 1
fi

# Step 1: Check if certbot is installed
echo ""
echo "📦 Step 1: Checking certbot installation..."
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install certbot -y
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# Step 2: Verify DNS
echo ""
echo "🌐 Step 2: Verifying DNS configuration..."
DNS_IP=$(dig +short "$DOMAIN" | tail -n1)
if [ -z "$DNS_IP" ]; then
    echo "❌ DNS not configured! Please point $DOMAIN to your server IP"
    exit 1
fi
echo "✅ DNS configured: $DOMAIN → $DNS_IP"

# Step 3: Stop Docker containers
echo ""
echo "🛑 Step 3: Stopping Docker containers..."
cd "$APP_DIR" || exit 1
if docker-compose -f docker/prod/docker-compose.yaml ps | grep -q "Up"; then
    docker-compose -f docker/prod/docker-compose.yaml down
    echo "✅ Containers stopped"
else
    echo "✅ No containers running"
fi

# Step 4: Get SSL certificate
echo ""
echo "🔐 Step 4: Obtaining SSL certificate from Let's Encrypt..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "⚠️  Certificate already exists for $DOMAIN"
    read -p "Renew it? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        certbot renew --force-renewal --http-01-port "$HTTP_PORT"
    fi
else
    certbot certonly --standalone \
        -d "$DOMAIN" \
        --http-01-port "$HTTP_PORT" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
fi

# Step 5: Verify certificate
echo ""
echo "✅ Step 5: Verifying certificate files..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && \
   [ -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ]; then
    echo "✅ Certificate files created successfully"
    ls -lh "/etc/letsencrypt/live/$DOMAIN/"
else
    echo "❌ Certificate files not found!"
    exit 1
fi

# Step 6: Set proper permissions
echo ""
echo "🔒 Step 6: Setting certificate permissions..."
chmod -R 755 /etc/letsencrypt/live/
chmod -R 755 /etc/letsencrypt/archive/
echo "✅ Permissions set"

# Step 7: Pull latest code (if in git repo)
echo ""
echo "📥 Step 7: Pulling latest code..."
cd "$APP_DIR" || exit 1
if [ -d .git ]; then
    sudo -u trantanh227 git pull origin main
    echo "✅ Code updated"
else
    echo "⚠️  Not a git repository, skipping..."
fi

# Step 8: Start Docker containers
echo ""
echo "🚀 Step 8: Starting Docker containers with HTTPS..."
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d
sleep 5

# Step 9: Check container status
echo ""
echo "📊 Step 9: Checking container status..."
docker-compose -f docker/prod/docker-compose.yaml ps

# Step 10: Test HTTPS
echo ""
echo "🧪 Step 10: Testing HTTPS connection..."
sleep 5
if curl -sSf -I https://"$DOMAIN" > /dev/null 2>&1; then
    echo "✅ HTTPS is working!"
else
    echo "⚠️  HTTPS test failed. Check logs:"
    echo "    docker-compose -f $APP_DIR/docker/prod/docker-compose.yaml logs gateway"
fi

# Step 11: Setup auto-renewal
echo ""
echo "🔄 Step 11: Setting up auto-renewal..."
CRON_CMD="0 0 * * * certbot renew --quiet --http-01-port $HTTP_PORT --post-hook 'docker-compose -f $APP_DIR/docker/prod/docker-compose.yaml restart gateway'"

if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    echo "✅ Auto-renewal already configured"
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo "✅ Auto-renewal cron job added"
fi

# Summary
echo ""
echo "================================================"
echo "🎉 SSL Certificate Setup Complete!"
echo "================================================"
echo ""
echo "Your API is now accessible at:"
echo "  • HTTPS: https://$DOMAIN"
echo "  • Swagger: https://$DOMAIN/docs"
echo ""
echo "Certificate Details:"
certbot certificates | grep -A 5 "$DOMAIN"
echo ""
echo "Next Steps:"
echo "  1. Test in browser: https://$DOMAIN:8443/docs"
echo "  2. Update your API clients to use HTTPS"
echo "  3. Certificates auto-renew every 90 days"
echo ""
echo "Logs location:"
echo "  • nginx: docker-compose -f $APP_DIR/docker/prod/docker-compose.yaml logs gateway"
echo "  • app: docker-compose -f $APP_DIR/docker/prod/docker-compose.yaml logs server"
echo "  • certbot: /var/log/letsencrypt/letsencrypt.log"
echo ""
echo "✅ Done!"
