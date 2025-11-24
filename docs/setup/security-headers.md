# Security Headers Documentation

## Overview

Petflix backend uses Helmet middleware to automatically add security headers to all HTTP responses. This protects against common web vulnerabilities.

---

## Implemented Security Headers

### 1. HSTS (HTTP Strict Transport Security)

**Header**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

**Purpose**: Forces browsers to only connect via HTTPS, preventing man-in-the-middle attacks.

**Configuration**:
- `maxAge`: 31536000 seconds (1 year)
- `includeSubDomains`: Applies to all subdomains
- `preload`: Eligible for browser HSTS preload list

**What it prevents**:
- HTTP downgrade attacks
- Cookie hijacking
- SSL stripping attacks

---

### 2. X-Content-Type-Options

**Header**: `X-Content-Type-Options: nosniff`

**Purpose**: Prevents browsers from MIME-sniffing responses away from declared content-type.

**What it prevents**:
- MIME confusion attacks
- Malicious file execution
- Content type sniffing vulnerabilities

---

### 3. X-Frame-Options

**Header**: `X-Frame-Options: DENY`

**Purpose**: Prevents the site from being embedded in iframes.

**Configuration**: Set to `DENY` (complete blocking)

**What it prevents**:
- Clickjacking attacks
- UI redressing attacks
- Frame-based exploits

---

### 4. X-XSS-Protection

**Header**: `X-XSS-Protection: 1; mode=block`

**Purpose**: Enables browser's built-in XSS (Cross-Site Scripting) filter.

**Configuration**: Set to block mode

**What it prevents**:
- Reflected XSS attacks
- Some types of injection attacks

**Note**: Modern browsers use CSP instead, but this adds defense-in-depth.

---

### 5. Referrer-Policy

**Header**: `Referrer-Policy: strict-origin-when-cross-origin`

**Purpose**: Controls how much referrer information is sent with requests.

**Configuration**: 
- Same-origin: Send full URL
- Cross-origin: Send only origin (no path)
- Downgrade (HTTPS → HTTP): Send nothing

**What it protects**:
- User privacy
- Prevents leaking sensitive URLs
- Reduces information disclosure

---

### 6. Content-Security-Policy (CSP)

**Header**: Complex policy defining allowed content sources

**Purpose**: Prevents XSS, injection attacks, and unauthorized resource loading.

**Current Configuration**:
```javascript
{
  defaultSrc: ["'self'"],           // Only load resources from same origin
  styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (for development)
  scriptSrc: ["'self'"],            // Only scripts from same origin
  imgSrc: ["'self'", "data:", "https:"], // Images from self, data URIs, any HTTPS
  connectSrc: ["'self'"],           // API calls only to same origin
  fontSrc: ["'self'"],              // Fonts from same origin
  objectSrc: ["'none'"],            // No plugins (Flash, etc.)
  mediaSrc: ["'self'"],             // Media from same origin
  frameSrc: ["'none'"],             // No iframes
}
```

**What it prevents**:
- Cross-site scripting (XSS)
- Data injection attacks
- Malicious resource loading
- Code injection

**Note**: This is a relaxed policy for development. Tighten for production based on your needs.

---

## HTTPS Enforcement

### Development
In development (localhost), HTTPS is not enforced as it's not practical. The HSTS header is still sent but won't affect HTTP connections.

### Production
When deployed to production:

#### Option 1: Hosting Provider (Recommended)
Most modern hosting providers automatically enforce HTTPS:
- **Vercel**: Automatic HTTPS redirect ✅
- **Netlify**: Automatic HTTPS redirect ✅
- **Heroku**: Automatic HTTPS redirect ✅
- **Railway**: Automatic HTTPS redirect ✅
- **Render**: Automatic HTTPS redirect ✅

**No additional configuration needed!**

#### Option 2: Self-Hosted
If self-hosting, add HTTPS redirect middleware:

```typescript
// Add before other middleware in server.ts
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

Or use a reverse proxy (Nginx, Caddy) to handle HTTPS termination.

---

## Testing Security Headers

### Method 1: Browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a request to your API
4. Click on the request
5. Look at Response Headers

You should see:
```
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
content-security-policy: [long policy string]
```

### Method 2: curl
```bash
curl -I http://localhost:5002/health
```

Look for the security headers in the output.

### Method 3: Online Tools
**After deploying to production**, use these free tools:
- [securityheaders.com](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [hstspreload.org](https://hstspreload.org) - Check HSTS eligibility

---

## Security Checklist

Before production deployment:

- [x] HSTS header configured (1 year max-age)
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] X-XSS-Protection enabled
- [x] Referrer-Policy configured
- [x] Content-Security-Policy defined
- [ ] HTTPS enforced (verify with hosting provider)
- [ ] Test with securityheaders.com (should get A+ rating)
- [ ] Consider HSTS preload submission (optional)

---

## Customizing Security Headers

### Relaxing CSP for Development
If you need to load resources from external sources during development:

```typescript
// In server.ts
const cspDirectives = process.env.NODE_ENV === 'production' 
  ? {
      // Strict production policy
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // ...
    }
  : {
      // Relaxed development policy
      defaultSrc: ["'self'", "*"],
      styleSrc: ["'self'", "'unsafe-inline'", "*"],
      scriptSrc: ["'self'", "'unsafe-eval'", "*"],
      // ...
    };

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  // ... other options
}));
```

### Allowing YouTube Embeds (Frontend)
If your frontend needs to embed YouTube videos, update CSP:

```typescript
contentSecurityPolicy: {
  directives: {
    frameSrc: ["'self'", "https://www.youtube.com"],
    // ...
  },
}
```

### Allowing External APIs
To make requests to external APIs:

```typescript
contentSecurityPolicy: {
  directives: {
    connectSrc: ["'self'", "https://api.external-service.com"],
    // ...
  },
}
```

---

## HSTS Preload (Optional)

### What is HSTS Preload?
A list maintained by browsers of sites that should ONLY be accessed via HTTPS. Sites on this list are protected even on first visit.

### How to Submit
1. Ensure HTTPS works correctly
2. Verify HSTS header includes `preload` directive (✅ already configured)
3. Test with [hstspreload.org](https://hstspreload.org)
4. Submit your domain for inclusion
5. Wait for acceptance (can take weeks to months)

### Requirements
- ✅ Valid HTTPS certificate
- ✅ HTTPS redirect from HTTP
- ✅ HSTS header on all requests
- ✅ `max-age` >= 31536000 (1 year)
- ✅ `includeSubDomains` directive
- ✅ `preload` directive

**Note**: Once on the preload list, it's hard to remove. Only submit if you're committed to HTTPS forever.

---

## Troubleshooting

### Problem: CORS errors after adding Helmet

**Cause**: CSP or other headers blocking cross-origin requests

**Solution**:
1. Ensure CORS middleware is configured correctly
2. Add frontend domain to CSP `connectSrc`
3. Verify `Access-Control-Allow-Origin` header is set

### Problem: Styles not loading (CSP violation)

**Cause**: CSP blocking inline styles or external stylesheets

**Solution**:
- For inline styles: Add `'unsafe-inline'` to `styleSrc` (development only)
- For external: Add domain to `styleSrc`
- Better: Use nonces or hashes (advanced)

### Problem: HSTS forcing HTTPS in development

**Cause**: Browser cached HSTS policy from previous testing

**Solution**:
1. Go to `chrome://net-internals/#hsts` (Chrome)
2. Enter domain (e.g., `localhost`)
3. Click "Delete domain security policies"
4. Restart browser

---

## Best Practices

1. **Always use HTTPS in production** - Non-negotiable
2. **Test security headers** before deploying (securityheaders.com)
3. **Start with relaxed CSP** and tighten over time
4. **Monitor CSP violations** (use report-uri in production)
5. **Keep Helmet updated** for latest security patches
6. **Review headers regularly** (quarterly security audit)

---

## Additional Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

## Summary

✅ **Security headers are now active!**

Your Petflix backend includes comprehensive security headers that protect against:
- MITM attacks (HSTS)
- XSS attacks (CSP, X-XSS-Protection)
- Clickjacking (X-Frame-Options)
- MIME sniffing (X-Content-Type-Options)
- Information leakage (Referrer-Policy)

**Next steps**:
1. Deploy to production with HTTPS
2. Test with securityheaders.com
3. Consider HSTS preload (optional)
4. Review and tighten CSP based on actual usage

