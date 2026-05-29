# SpecForge Production Infrastructure

## Overview
This document describes the production infrastructure setup for SpecForge, including server configuration, reverse proxy setup, and deployment procedures.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DNS / Cloudflare                         │
│              (specforge.example.com)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                       Caddy Server                           │
│              (HTTPS reverse proxy + SSL)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Port 443: specforge.example.com → localhost:3000   │  │
│  │  Port 443: collab.specforge.example.com → :3001     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────┐            ┌──────────────────┐
│ Next.js App   │            │ Collab Server    │
│ (Port 3000)   │            │ (Port 3001)      │
│               │            │                  │
│ - Web UI      │            │ - Yjs/Websocket  │
│ - API Routes  │            │ - Realtime sync  │
└───────┬───────┘            └──────────────────┘
        │
        ▼
┌───────────────┐
│ PostgreSQL    │
│ (Port 5432)   │
│               │
│ - Documents   │
│ - Users       │
│ - Workspaces  │
└───────────────┘
```

## Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS or Debian 12

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS

## Software Stack

- **OS**: Ubuntu 22.04 LTS
- **Runtime**: Bun (JavaScript runtime)
- **Web Server**: Caddy (reverse proxy + SSL)
- **Database**: PostgreSQL 14+
- **Process Manager**: systemd
- **Reverse Proxy**: Caddy

## Quick Start

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create deployment directory
sudo mkdir -p /opt/specforge

# Clone this repository
cd /opt/specforge
sudo git clone https://github.com/chimera-defi/specforge.git .
```

### 2. Run Infrastructure Setup

```bash
cd /opt/specforge/infra
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

This will:
- Create system user
- Install dependencies (Bun, Caddy, PostgreSQL)
- Set up database
- Configure systemd services
- Set up Caddy reverse proxy
- Configure firewall

### 3. Configure Environment

```bash
cd /opt/specforge/web
cp infra/.env.production.template .env.production
nano .env.production
```

Edit the following required values:
- `DATABASE_URL` - PostgreSQL connection string
- `SPECFORGE_JWT_SECRET` - Secure random string (32+ chars)
- `SPECFORGE_SESSION_SECRET` - Secure random string (32+ chars)
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app secret

### 4. Deploy Application

```bash
cd /opt/specforge/infra
sudo chmod +x deploy-app.sh
sudo ./deploy-app.sh
```

### 5. Configure DNS

See [DNS.md](./DNS.md) for detailed DNS configuration.

### 6. Update Caddyfile

Edit `/etc/caddy/Caddyfile` and replace `specforge.example.com` with your actual domain:

```bash
sudo nano /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Service Management

### Web Application

```bash
# Start service
sudo systemctl start specforge-web

# Stop service
sudo systemctl stop specforge-web

# Restart service
sudo systemctl restart specforge-web

# Check status
sudo systemctl status specforge-web

# View logs
sudo journalctl -u specforge-web -f

# Enable at boot
sudo systemctl enable specforge-web
```

### Collaboration Server

```bash
# Start service
sudo systemctl start specforge-collab

# Stop service
sudo systemctl stop specforge-collab

# Restart service
sudo systemctl restart specforge-collab

# Check status
sudo systemctl status specforge-collab

# View logs
sudo journalctl -u specforge-collab -f

# Enable at boot
sudo systemctl enable specforge-collab
```

### Caddy

```bash
# Restart Caddy
sudo systemctl restart caddy

# Reload configuration
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

## Monitoring

### Health Checks

```bash
# Web app health
curl https://specforge.example.com/api/health

# Check if services are running
sudo systemctl is-active specforge-web
sudo systemctl is-active specforge-collab
sudo systemctl is-active caddy
```

### Log Monitoring

```bash
# All SpecForge logs
sudo journalctl -u specforge-web -u specforge-collab -f

# Caddy logs
sudo journalctl -u caddy -f

# System logs
sudo journalctl -f
```

### Resource Monitoring

```bash
# CPU and memory
htop

# Disk usage
df -h

# Process monitoring
ps aux | grep node
```

## Security

### Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Allow additional ports if needed
sudo ufw allow PORT/tcp
```

### SSL/TLS

Caddy automatically:
- Obtains Let's Encrypt certificates
- Renews certificates before expiration
- Enforces HTTPS
- Redirects HTTP to HTTPS

### Database Security

```bash
# Change default PostgreSQL password
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'new_secure_password';
\q

# Restrict PostgreSQL to localhost
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'
sudo systemctl restart postgresql
```

## Backup Strategy

### Database Backups

```bash
# Create backup script
cat > /opt/specforge/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/specforge/backups"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump specforge > $BACKUP_DIR/specforge_$DATE.sql
# Keep last 7 days
find $BACKUP_DIR -name "specforge_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/specforge/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/specforge/backup-db.sh") | crontab -
```

### Application Data Backups

The `.data` directories contain:
- Web app data: `/opt/specforge/web/.data`
- Collab server data: `/opt/specforge/collab-server/.data`

These can be backed up using rsync:

```bash
rsync -avz /opt/specforge/ /backup/specforge/
```

## Scaling Considerations

### Vertical Scaling
- Increase CPU cores and RAM
- Adjust PostgreSQL memory settings in `postgresql.conf`
- Increase Caddy buffer sizes

### Horizontal Scaling
- Use load balancer (Caddy can do this)
- Deploy multiple web app instances
- Use shared PostgreSQL database
- Use Redis for session storage (if needed)

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status specforge-web

# View detailed logs
sudo journalctl -u specforge-web -n 50 --no-pager

# Check port conflicts
sudo netstat -tulpn | grep :3000
```

### SSL Certificate Issues

```bash
# Check Caddy logs
sudo journalctl -u caddy -n 50 --no-pager

# Test certificate
openssl s_client -connect specforge.example.com:443 -servername specforge.example.com
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -l
```

## Maintenance

### Update Application

```bash
cd /opt/specforge/infra
sudo ./deploy-app.sh
```

### Update Dependencies

```bash
cd /opt/specforge/web
sudo -u specforge bun update
sudo systemctl restart specforge-web
```

### System Updates

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

## Cost Estimation

### Server Costs (Monthly)
- **Small (2 CPU, 4GB RAM)**: ~$20-40 (DigitalOcean, Linode, AWS t3.medium)
- **Medium (4 CPU, 8GB RAM)**: ~$40-80 (DigitalOcean, Linode, AWS t3.large)
- **Large (8 CPU, 16GB RAM)**: ~$80-160 (AWS t3.xlarge)

### Additional Costs
- **Domain**: ~$10-15/year
- **DNS**: Free (Cloudflare, AWS Route 53 ~$0.50/month)
- **SSL**: Free (Let's Encrypt via Caddy)
- **Database**: Included in server (self-hosted PostgreSQL)
- **Storage**: Included in server

**Total Monthly Cost**: ~$20-80 for typical usage

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u specforge-web -f`
2. Review this documentation
3. Check Caddy logs: `sudo journalctl -u caddy -f`
4. Verify DNS: `dig specforge.example.com`

## Next Steps

1. ✅ Set up server
2. ✅ Configure DNS
3. ✅ Deploy application
4. ✅ Configure monitoring
5. ✅ Set up backups
6. ✅ Configure SSL (automatic via Caddy)
7. ⏳ Set up CI/CD for automated deployments
8. ⏳ Configure monitoring/alerting (e.g., Sentry, UptimeRobot)
9. ⏳ Set up staging environment