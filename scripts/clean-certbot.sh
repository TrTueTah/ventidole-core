#!/bin/bash

# Script to completely remove Certbot and all certificates
# Run this on your GCP server to start fresh

set -e

echo "🧹 Cleaning Certbot - Starting fresh..."

# Stop any running containers
echo "⏹️  Stopping Docker containers..."
cd /home/trantanh227/ventidole-core
docker-compose -f docker/prod/docker-compose.yaml down 2>/dev/null || true

# Remove all Certbot certificates and configuration
echo "🗑️  Removing all Let's Encrypt certificates and configuration..."
sudo rm -rf /etc/letsencrypt/*
sudo rm -rf /var/lib/letsencrypt/*
sudo rm -rf /var/log/letsencrypt/*

# Recreate directories with proper permissions
echo "📁 Recreating clean directories..."
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/lib/letsencrypt
sudo mkdir -p /var/log/letsencrypt

# Optional: Reinstall certbot (if you want the latest version)
echo "🔄 Updating Certbot..."
sudo apt update
sudo apt install -y certbot

# Verify clean state
echo ""
echo "✅ Certbot cleaned successfully!"
echo ""
echo "📊 Current state:"
echo "  - Certificates: $(sudo ls /etc/letsencrypt/live 2>/dev/null | wc -l) domains"
echo "  - Certbot version: $(certbot --version 2>/dev/null || echo 'Not installed')"
echo ""
echo "🚀 Ready for fresh certificate generation!"
echo ""
echo "📝 Next steps:"
echo "  1. Ensure DNSSEC is fully disabled (check: dig api-prod.ventidole.xyz +short)"
echo "  2. Try HTTP-01 challenge:"
echo "     sudo certbot certonly --standalone -d api-prod.ventidole.xyz --agree-tos --email your-email@example.com"
echo ""
echo "  OR if DNSSEC still broken:"
echo "  3. Use DNS-01 challenge:"
echo "     sudo certbot certonly --manual --preferred-challenges dns -d api-prod.ventidole.xyz --agree-tos --email your-email@example.com"
echo ""
