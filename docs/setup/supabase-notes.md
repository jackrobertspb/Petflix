# Supabase-Specific Implementation Notes

This document highlights important Supabase-specific considerations for implementing the high-priority features.

## 🗄️ Database Operations

### All Database Queries Use Supabase Client
- **Never use raw SQL** in application code
- Use `supabase.from('table_name')` for all queries
- Migrations are run in **Supabase Dashboard → SQL Editor**, not via command line

**Example:**
```typescript
// ✅ Correct - Using Supabase client
const { data, error } = await supabase
  .from('videos')
  .select('*')
  .eq('user_id', userId);

// ❌ Wrong - Don't use raw SQL in code
// const result = await db.query('SELECT * FROM videos WHERE user_id = $1', [userId]);
```

### Running SQL Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste migration file contents
3. Click "Run" to execute
4. Verify tables/columns were created

**Migration Files Location:** `backend/src/db/*.sql`

---

## 📧 Email Service

### Supabase Auth vs Transactional Emails

**Supabase Auth Emails (Built-in):**
- ✅ Signup confirmation
- ✅ Password reset
- ✅ Email change verification
- Configured in Supabase Dashboard → Authentication → Email Templates

**Transactional Emails (Need External Service):**
- ❌ Welcome emails (custom)
- ❌ Custom notifications
- ❌ Marketing emails

### Recommended Email Providers for Supabase

1. **Resend** (Recommended)
   - Modern API
   - 3,000 emails/month free
   - Excellent TypeScript SDK
   - Best for Supabase projects

2. **SendGrid**
   - 100 emails/day free
   - Already partially implemented
   - Good documentation

3. **Postmark**
   - High deliverability
   - 100 emails/month free
   - Can integrate via SMTP

**Note:** AWS SES is not recommended for Supabase projects - use Resend or SendGrid instead.

---

## 📦 Storage

### If File Uploads Are Needed
- Use **Supabase Storage** (not AWS S3)
- Configured in Supabase Dashboard → Storage
- Access via `supabase.storage.from('bucket-name')`

**Example:**
```typescript
// Upload file to Supabase Storage
const { data, error } = await supabase.storage
  .from('profile-pictures')
  .upload(`${userId}/avatar.jpg`, file);
```

---

## 🔍 Full-Text Search

### PostgreSQL Full-Text Search
Supabase uses PostgreSQL, so you can use full-text search features:

```sql
-- Create full-text search index (run in Supabase SQL Editor)
CREATE INDEX IF NOT EXISTS idx_videos_search_vector 
ON videos USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Use in Supabase query
const { data } = await supabase
  .from('videos')
  .select('*')
  .textSearch('title', query); // Supabase supports textSearch
```

---

## 🔔 Push Notifications

### Already Using Supabase
- Push subscriptions stored in `push_subscriptions` table
- Uses Supabase client for all operations
- No changes needed - already Supabase-compatible

---

## 📊 Background Jobs

### Supabase Edge Functions vs Node.js
For background jobs (like notification processing):

**Option 1: Node.js setInterval** (Current approach)
- Simple for MVP
- Runs in Express server
- Good for development

**Option 2: Supabase Edge Functions + Cron** (Production)
- Serverless functions
- Scheduled via Supabase Cron
- Better for production scale

**Current Implementation:** Uses `setInterval` in `server.ts` - fine for MVP, can upgrade later.

---

## 🔐 Authentication

### JWT vs Supabase Auth
**Current Setup:**
- Custom JWT authentication (not Supabase Auth)
- JWT tokens stored in localStorage
- Supabase used only for database

**If Migrating to Supabase Auth:**
- Would use `supabase.auth` methods
- Built-in email verification
- Session management handled by Supabase
- **Note:** Current implementation is fine - no need to change unless desired

---

## 📈 Monitoring & Logging

### Supabase Dashboard
- View database tables/data
- Monitor API usage
- Check logs (limited)
- View storage usage

### For Advanced Monitoring
- Use Supabase Logs (in dashboard)
- Or integrate external logging (Winston, Pino) - logs to console/file, not Supabase

---

## 🚀 Deployment Considerations

### Supabase Hosting
- Supabase hosts database and API
- Frontend/backend deploy separately (Vercel, Netlify, Railway, etc.)
- Environment variables needed:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (backend only)
  - `SUPABASE_ANON_KEY` (frontend, if using Supabase Auth)

### Environment Variables
All Supabase credentials come from:
- Supabase Dashboard → Settings → API
- **Never commit** `SUPABASE_SERVICE_ROLE_KEY` to git

---

## ✅ Summary Checklist

When implementing features, ensure:

- [ ] All database queries use `supabase.from()` client
- [ ] SQL migrations run in Supabase Dashboard → SQL Editor
- [ ] Email service uses Resend or SendGrid (not AWS SES)
- [ ] File uploads use Supabase Storage (if needed)
- [ ] No AWS services referenced (unless absolutely necessary)
- [ ] Environment variables documented in `env.template`
- [ ] All Supabase credentials from Dashboard → Settings → API

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/tables)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

