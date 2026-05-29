# DNS Configuration for SpecForge

## Overview
This document explains how to configure DNS for your SpecForge deployment.

## Prerequisites
- A domain name (e.g., `specforge.example.com`)
- Access to your domain's DNS management panel
- A server with a public IP address

## DNS Records

### Required Records

#### A Record (Main Domain)
```
Type: A
Name: @ (or specforge)
Value: YOUR_SERVER_IP
TTL: 300 (or default)
```

This points your main domain to the server.

#### A Record for Collaboration Server (Optional)
```
Type: A
Name: collab
Value: YOUR_SERVER_IP
TTL: 300 (or default)
```

This creates `collab.specforge.example.com` pointing to the same server.

#### CNAME for www (Optional)
```
Type: CNAME
Name: www
Value: specforge.example.com
TTL: 300 (or default)
```

This redirects `www.specforge.example.com` to `specforge.example.com`.

## Example Configuration

For a domain `specforge.example.com` with server IP `203.0.113.42`:

```
Type  Name    Value                TTL
A     @       203.0.113.42         300
A     collab  203.0.113.42         300
CNAME www     specforge.example.com 300
```

## DNS Providers

### Popular DNS Providers
- **Cloudflare**: Free DNS with CDN
- **AWS Route 53**: AWS-integrated DNS
- **Google Cloud DNS**: Google Cloud-integrated
- **Namecheap**: Affordable domain registrar with DNS
- **GoDaddy**: Popular domain registrar

### Cloudflare Setup (Recommended)
1. Sign up for Cloudflare (free tier)
2. Add your domain to Cloudflare
3. Update your domain's nameservers to Cloudflare's nameservers
4. Add the DNS records listed above in Cloudflare DNS
5. Enable "Proxied" (orange cloud) for CDN and DDoS protection
6. Wait for DNS propagation (usually 5-60 minutes)

### AWS Route 53 Setup
1. Create a hosted zone for your domain
2. Add the A record pointing to your server IP
3. Note the Route 53 nameservers
4. Update your domain registrar to use Route 53 nameservers

## DNS Propagation

After updating DNS records:
- Propagation typically takes 5-60 minutes
- Use `dig specforge.example.com` to check propagation
- Use `https://www.whatsmydns.net/` to check global propagation

## SSL/TLS Certificates

Caddy automatically handles SSL/TLS certificates using Let's Encrypt:
- No manual certificate management required
- Automatic renewal before expiration
- Supports both HTTP-01 and DNS-01 challenges
- Works with Cloudflare proxy (orange cloud) in "Full" SSL mode

## Troubleshooting

### DNS Not Propagating
```bash
# Check DNS resolution
dig specforge.example.com

# Check from different locations
nslookup specforge.example.com 8.8.8.8
```

### SSL Certificate Issues
```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Test certificate
openssl s_client -connect specforge.example.com:443
```

### Cloudflare SSL Mode
If using Cloudflare, set SSL/TLS to "Full" (not "Flexible") to avoid SSL errors.

## Security Considerations

1. **DNSSEC**: Enable DNSSEC if your provider supports it
2. **CAA Records**: Add CAA records to specify which CAs can issue certificates
3. ** SPF/DKIM/DMARC**: Configure email authentication if sending emails
4. **Subdomain Takeover**: Ensure all DNS records point to valid resources

## Monitoring

Monitor DNS health:
- Uptime monitoring for DNS resolution
- SSL certificate expiration monitoring
- Caddy logs for certificate renewal issues

## Next Steps

After DNS configuration:
1. Update `Caddyfile` with your actual domain
2. Deploy the application using `deploy-app.sh`
3. Verify SSL certificate issuance
4. Test the application at your domain