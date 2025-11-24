# Database Reset for Testing

**⚠️ This document has been updated with a new comprehensive reset script.**

---

## 🔄 Complete Database Reset

### Quick Instructions:

1. **Open Supabase SQL Editor**
2. **Run:** `backend/src/db/reset-database-for-testing.sql`
3. **Verify:** Database is completely empty
4. **Ready:** Start fresh testing!

---

## 📚 Full Documentation

For complete instructions, safety warnings, and details, see:

**[database-reset.md](./database-reset.md)**

---

## What's New

The new `reset-database-for-testing.sql` script includes:

✅ **All Tables** - Includes newer tables like notifications, error logs, etc.  
✅ **Better Order** - Proper deletion order respecting all foreign keys  
✅ **Verification** - Shows before/after counts and success confirmation  
✅ **Safety** - Transaction-wrapped with rollback capability  
✅ **Documentation** - Clear output and instructions  

---

## Quick Reference

### Delete Everything:
```bash
# Location
backend/src/db/reset-database-for-testing.sql

# Run in Supabase SQL Editor
```

### Delete One User:
```sql
DELETE FROM users WHERE email = 'testuser@test.com';
```

### Check Current State:
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM videos) as videos,
  (SELECT COUNT(*) FROM comments) as comments;
```

---

**For detailed guide:** [database-reset.md](./database-reset.md)
