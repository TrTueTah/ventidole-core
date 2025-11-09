#!/bin/bash

# Port Forwarding Setup: Route 443 → 8080
# This allows accessing https://api-prod.ventidole.xyz (port 443) 
# while nginx listens on port 8080

set -e

echo "🔀 Setting up Port Forwarding (443 → 8080)"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo: sudo bash setup-port-forward.sh"
    exit 1
fi

# Configuration
EXTERNAL_PORT=443
INTERNAL_PORT=8080

echo "Configuration:"
echo "  External Port: $EXTERNAL_PORT (HTTPS standard)"
echo "  Internal Port: $INTERNAL_PORT (Docker nginx)"
echo ""

# Step 1: Enable IP forwarding
echo "📡 Step 1: Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1 > /dev/null 2>&1

if grep -q "net.ipv4.ip_forward=1" /etc/sysctl.conf; then
    echo "✅ IP forwarding already persistent"
else
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
    echo "✅ IP forwarding enabled and made persistent"
fi

# Step 2: Check if rule already exists
echo ""
echo "🔍 Step 2: Checking existing iptables rules..."
if iptables -t nat -L PREROUTING -n | grep -q "dpt:$EXTERNAL_PORT.*redir ports $INTERNAL_PORT"; then
    echo "✅ Port forwarding rule already exists"
else
    echo "➕ Adding port forwarding rule..."
    iptables -t nat -A PREROUTING -p tcp --dport $EXTERNAL_PORT -j REDIRECT --to-port $INTERNAL_PORT
    echo "✅ Port forwarding rule added"
fi

# Step 3: Install iptables-persistent
echo ""
echo "💾 Step 3: Making iptables rules persistent..."
if dpkg -l | grep -q iptables-persistent; then
    echo "✅ iptables-persistent already installed"
else
    echo "Installing iptables-persistent..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent > /dev/null 2>&1
    echo "✅ iptables-persistent installed"
fi

# Step 4: Save rules
echo ""
echo "💾 Step 4: Saving iptables rules..."
netfilter-persistent save
echo "✅ Rules saved"

# Step 5: Display current rules
echo ""
echo "📋 Step 5: Current NAT rules:"
echo "----------------------------------------------"
iptables -t nat -L PREROUTING -n -v | grep -E "Chain|dpt:443"
echo "----------------------------------------------"

# Step 6: Test port
echo ""
echo "🧪 Step 6: Testing port configuration..."
if netstat -tulpn | grep -q ":$INTERNAL_PORT"; then
    echo "✅ Port $INTERNAL_PORT is listening"
else
    echo "⚠️  Port $INTERNAL_PORT is not listening yet"
    echo "   Start your Docker containers to use this port"
fi

# Summary
echo ""
echo "=========================================="
echo "🎉 Port Forwarding Setup Complete!"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  • External port 443 → Internal port 8080"
echo "  • IP forwarding enabled"
echo "  • iptables rules persistent across reboots"
echo ""
echo "What this means:"
echo "  • Users access: https://api-prod.ventidole.xyz (port 443)"
echo "  • Traffic forwarded to: port 8080"
echo "  • nginx container serves on: port 8080"
echo ""
echo "Next steps:"
echo "  1. Make sure GCP firewall allows port 443:"
echo "     gcloud compute firewall-rules create allow-https --allow tcp:443"
echo ""
echo "  2. Get SSL certificate:"
echo "     cd /home/trantanh227/ventidole-core"
echo "     sudo certbot certonly --standalone -d api-prod.ventidole.xyz"
echo ""
echo "  3. Start Docker containers:"
echo "     docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d"
echo ""
echo "  4. Test access:"
echo "     curl -I https://api-prod.ventidole.xyz"
echo "     Open browser: https://api-prod.ventidole.xyz/docs"
echo ""
echo "✅ Done!"
