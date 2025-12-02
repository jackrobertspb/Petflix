# HTTPS Deployment Guide

## Overview

Petflix requires HTTPS in production for security. This guide covers HTTPS setup for different deployment platforms.

---

## Automatic HTTPS (Recommended)

Most modern hosting platforms **automatically handle HTTPS** with zero configuration:

### ✅ Vercel
- **HTTPS**: Automatic ✅
- **Redirect**: Automatic ✅
- **SSL Certificate**: Automatic (Let's Encrypt) ✅
- **Custom Domain**: Free SSL included ✅
- **Configuration needed**: None!

**Deploy**:
```bash
npm install -g vercel
cd backend
vercel
```

---

### ✅ Netlify
- **HTTPS**: Automatic ✅
- **Redirect**: Automatic ✅
- **SSL Certificate**: Automatic (Let's Encrypt) ✅
- **Custom Domain**: Free SSL included ✅
- **Configuration needed**: None!

**Deploy**:
```bash
npm install -g netlify-cli
cd backend
netlify deploy --prod
```

---

### ✅ Heroku
- **HTTPS**: Automatic ✅
- **Redirect**: Automatic ✅
- **SSL Certificate**: Automatic ✅
- **Custom Domain**: Requires paid plan for auto SSL
- **Configuration needed**: None for *.herokuapp.com domains

**Deploy**:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

---

### ✅ Railway
- **HTTPS**: Automatic ✅
- **Redirect**: Automatic ✅
- **SSL Certificate**: Automatic ✅
- **Custom Domain**: Free SSL included ✅
- **Configuration needed**: None!

**Deploy**: Connect GitHub repo via Railway dashboard

---

### ✅ Render
- **HTTPS**: Automatic ✅
- **Redirect**: Automatic ✅
- **SSL Certificate**: Automatic (Let's Encrypt) ✅
- **Custom Domain**: Free SSL included ✅
- **Configuration needed**: None!

**Deploy**: Connect GitHub repo via Render dashboard

---

## Manual HTTPS (Self-Hosted)

If self-hosting on a VPS or server, you need to configure HTTPS manually.

### Option 1: Nginx Reverse Proxy (Recommended)

**Step 1: Install Nginx**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

**Step 2: Install Certbot (Let's Encrypt)**
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**Step 3: Configure Nginx**

Create `/etc/nginx/sites-available/petflix`:
```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (Certbot will add these)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS (already set by backend, but can add here too)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 4: Enable site**
```bash
sudo ln -s /etc/nginx/sites-available/petflix /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

**Step 5: Get SSL certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will:
- Get SSL certificate from Let's Encrypt
- Update Nginx config automatically
- Set up auto-renewal

**Step 6: Test auto-renewal**
```bash
sudo certbot renew --dry-run
```

---

### Option 2: Caddy (Automatic HTTPS)

Caddy automatically handles HTTPS with zero configuration!

**Step 1: Install Caddy**
```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**Step 2: Configure Caddyfile**

Create `/etc/caddy/Caddyfile`:
```caddy
yourdomain.com {
    reverse_proxy localhost:5002
    
    # Caddy automatically handles:
    # - HTTPS certificate (Let's Encrypt)
    # - HTTP -> HTTPS redirect
    # - Certificate renewal
}
```

**Step 3: Start Caddy**
```bash
sudo systemctl enable caddy
sudo systemctl start caddy
```

That's it! Caddy handles everything automatically.

---

### Option 3: Node.js Built-in HTTPS (Not Recommended)

You can use Node.js built-in HTTPS module, but this requires manual certificate management.

**Only use this for testing!** Use Nginx or Caddy for production.

```typescript
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem'),
};

https.createServer(httpsOptions, app).listen(443, () => {
  console.log('HTTPS server running on port 443');
});
```

---

## Testing HTTPS

### 1. Manual Test
```bash
# Should redirect to HTTPS
curl -I http://yourdomain.com

# Should return 200 with HTTPS
curl -I https://yourdomain.com
```

### 2. Browser Test
1. Visit `http://yourdomain.com`
2. Should automatically redirect to `https://yourdomain.com`
3. Check for 🔒 padlock icon in address bar
4. Click padlock → Certificate should be valid

### 3. SSL Labs Test
[SSL Labs Server Test](https://www.ssllabs.com/ssltest/) provides comprehensive SSL/TLS analysis:
- Certificate validation
- Protocol support
- Cipher strength
- Configuration issues

**Goal**: A+ rating

### 4. Security Headers Test
[securityheaders.com](https://securityheaders.com) checks security headers:
- HSTS
- CSP
- X-Frame-Options
- etc.

**Goal**: A+ rating

---

## Troubleshooting

### Problem: Certificate errors

**Symptoms**: Browser shows "Your connection is not private"

**Solutions**:
1. Verify certificate is valid: `sudo certbot certificates`
2. Check certificate expiry date
3. Ensure domain DNS points to correct server
4. Wait for DNS propagation (up to 48 hours)

### Problem: HTTP not redirecting to HTTPS

**Check 1: Nginx/Caddy running?**
```bash
sudo systemctl status nginx
# or
sudo systemctl status caddy
```

**Check 2: Firewall allowing port 443?**
```bash
sudo ufw allow 443/tcp
sudo ufw reload
```

**Check 3: Backend HTTPS redirect enabled?**
- Verify `NODE_ENV=production` in `.env`
- Check backend logs for redirect messages

### Problem: Certificate renewal failing

**Certbot renewal issue**:
```bash
sudo certbot renew --dry-run  # Test renewal
sudo tail -f /var/log/letsencrypt/letsencrypt.log  # Check logs
```

Common causes:
- Port 80 blocked (needed for HTTP-01 challenge)
- DNS not pointing to server
- Too many renewal attempts (rate limited)

---

## Deployment Checklist

### Pre-Deployment
- [ ] Domain DNS configured (A record pointing to server IP)
- [ ] Backend configured with `NODE_ENV=production`
- [ ] Security headers enabled (Helmet)
- [ ] HTTPS redirect enabled in code

### Post-Deployment
- [ ] HTTPS working (https://yourdomain.com)
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate valid
- [ ] HSTS header present
- [ ] Test with SSL Labs (A+ rating)
- [ ] Test with securityheaders.com (A+ rating)
- [ ] Auto-renewal set up (cron job or service)

---

## Certificate Management

### Let's Encrypt Certificates
- **Validity**: 90 days
- **Renewal**: Automatic (Certbot runs daily)
- **Cost**: Free ✅

### Manual Renewal (if auto-renewal fails)
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Check Certificate Expiry
```bash
sudo certbot certificates
```

### Revoke Certificate (if compromised)
```bash
sudo certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem
```

---

## Custom Domain Setup

### Step 1: Purchase Domain
Buy from: Namecheap, GoDaddy, Cloudflare, Google Domains, etc.

### Step 2: Configure DNS

Add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your server IP | 3600 |
| A | www | Your server IP | 3600 |

Or if using a hosting platform's domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | yourapp.vercel.app | 3600 |
| CNAME | www | yourapp.vercel.app | 3600 |

### Step 3: Wait for DNS Propagation
- Usually takes 15 minutes to 1 hour
- Can take up to 48 hours
- Check with: `dig yourdomain.com` or [dnschecker.org](https://dnschecker.org)

### Step 4: Get SSL Certificate
Once DNS propagates:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Additional Security

### Enable OCSP Stapling (Nginx)
Improves SSL handshake performance:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### Enable HTTP/2 (Nginx)
Faster page loads:

```nginx
listen 443 ssl http2;  # Add 'http2'
```

### Disable TLS 1.0 and 1.1
Only use modern protocols:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
```

---

## Summary

✅ **HTTPS is now configured!**

**What happens now**:
1. All HTTP requests → HTTPS redirect (301)
2. HTTPS enforced via HSTS header
3. SSL/TLS encryption active
4. Certificate auto-renews every 90 days

**Platform Recommendations**:
- **Easiest**: Vercel, Netlify, Railway (zero config)
- **Flexible**: Render, Heroku (good balance)
- **Self-hosted**: Nginx + Certbot or Caddy

**Next Steps**:
1. Test HTTPS redirect
2. Run SSL Labs test
3. Verify HSTS header
4. Monitor certificate expiry
5. Set up monitoring alerts

