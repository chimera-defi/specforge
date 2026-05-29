#!/bin/bash
# SpecForge Application Deployment Script
# This script deploys the application code to production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_USER="specforge"
APP_DIR="/opt/specforge"
REPO_URL="https://github.com/chimera-defi/specforge.git"
BRANCH="main"

echo "🚀 SpecForge Application Deployment"
echo "===================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Stopping services${NC}"
systemctl stop specforge-web || true
systemctl stop specforge-collab || true

echo -e "${GREEN}Step 2: Backing up current deployment${NC}"
if [ -d "$APP_DIR/web/.git" ]; then
    cd "$APP_DIR/web"
    git stash || true
fi

if [ -d "$APP_DIR/collab-server/.git" ]; then
    cd "$APP_DIR/collab-server"
    git stash || true
fi

echo -e "${GREEN}Step 3: Pulling latest code${NC}"
if [ ! -d "$APP_DIR/web/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR/web"
    cd "$APP_DIR/web"
else
    cd "$APP_DIR/web"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
fi

echo -e "${GREEN}Step 4: Installing dependencies${NC}"
cd "$APP_DIR/web"
su - "$APP_USER" -c "cd $APP_DIR/web && bun install"

echo -e "${GREEN}Step 5: Building application${NC}"
su - "$APP_USER" -c "cd $APP_DIR/web && bun run build:web"

echo -e "${GREEN}Step 6: Setting up environment${NC}"
if [ ! -f "$APP_DIR/web/.env.production" ]; then
    echo -e "${YELLOW}.env.production not found. Copying template...${NC}"
    cp "$APP_DIR/web/infra/.env.production.template" "$APP_DIR/web/.env.production"
    echo -e "${RED}⚠️  Please edit .env.production with your actual values!${NC}"
fi

echo -e "${GREEN}Step 7: Running database migrations${NC}"
su - "$APP_USER" -c "cd $APP_DIR/web && bun run db:migrate" || echo "No migrations to run"

echo -e "${GREEN}Step 8: Starting services${NC}"
systemctl start specforge-web
systemctl start specforge-collab

echo -e "${GREEN}Step 9: Waiting for services to start${NC}"
sleep 10

echo -e "${GREEN}Step 10: Checking service status${NC}"
systemctl status specforge-web --no-pager
systemctl status specforge-collab --no-pager

echo -e "${YELLOW}===================================="
echo -e "${YELLOW}Deployment complete!${NC}"
echo -e "${YELLOW}===================================="
echo ""
echo -e "${GREEN}✓ Web app: http://localhost:3000${NC}"
echo -e "${GREEN}✓ Collab server: ws://localhost:3001${NC}"
echo -e "${GREEN}✓ Services managed by systemd${NC}"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "  sudo journalctl -u specforge-web -f"
echo "  sudo journalctl -u specforge-collab -f"