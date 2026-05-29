#!/bin/bash
# SpecForge Production Deployment Script
# This script sets up the production environment on Ubuntu/Debian

set -e

echo "🚀 SpecForge Production Deployment Script"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_USER="specforge"
APP_DIR="/opt/specforge"
DOMAIN="specforge.example.com"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Creating system user${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
    echo "User $APP_USER created"
else
    echo "User $APP_USER already exists"
fi

echo -e "${GREEN}Step 2: Creating directories${NC}"
mkdir -p "$APP_DIR/web"
mkdir -p "$APP_DIR/collab-server"
mkdir -p "$APP_DIR/web/.data"
mkdir -p "$APP_DIR/collab-server/.data"
mkdir -p /var/log/specforge

echo -e "${GREEN}Step 3: Installing dependencies${NC}"
apt update
apt install -y curl git nginx certbot python3-certbot-nginx

echo -e "${GREEN}Step 4: Installing Bun${NC}"
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
echo 'export BUN_INSTALL="$HOME/.bun"' >> /root/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> /root/.bashrc

echo -e "${GREEN}Step 5: Installing Caddy${NC}"
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

echo -e "${GREEN}Step 6: Installing PostgreSQL${NC}"
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

echo -e "${GREEN}Step 7: Setting up PostgreSQL database${NC}"
su - postgres -c "createdb specforge" || echo "Database already exists"
su - postgres -c "psql -c \"CREATE USER specforge WITH PASSWORD 'CHANGE_THIS_PASSWORD';\"" || echo "User already exists"
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE specforge TO specforge;\""

echo -e "${GREEN}Step 8: Setting permissions${NC}"
chown -R $APP_USER:$APP_USER "$APP_DIR"
chown -R $APP_USER:$APP_USER /var/log/specforge

echo -e "${GREEN}Step 9: Installing systemd services${NC}"
cp specforge-web.service /etc/systemd/system/
cp specforge-collab.service /etc/systemd/system/
systemctl daemon-reload

echo -e "${GREEN}Step 10: Installing Caddy configuration${NC}"
cp Caddyfile /etc/caddy/Caddyfile
sed -i "s/specforge.example.com/$DOMAIN/g" /etc/caddy/Caddyfile
systemctl enable caddy
systemctl start caddy

echo -e "${GREEN}Step 11: Configuring firewall${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${YELLOW}=========================================="
echo -e "${YELLOW}Deployment setup complete!${NC}"
echo -e "${YELLOW}=========================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy your application code to $APP_DIR/web"
echo "2. Deploy collab server code to $APP_DIR/collab-server"
echo "3. Copy .env.production.template to .env.production and fill in values"
echo "4. Run: sudo systemctl start specforge-web"
echo "5. Run: sudo systemctl start specforge-collab"
echo "6. Update DNS to point $DOMAIN to this server"
echo "7. Caddy will automatically obtain SSL certificate"
echo ""
echo -e "${GREEN}✓ Infrastructure is ready!${NC}"