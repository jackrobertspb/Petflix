# Account Locking - Testing Guide

## 🔧 Setup Steps

### 1. Run SQL Migration (If Not Done Already)

Go to your **Supabase SQL Editor** and run:

```sql
-- Add account locking columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
```

### 2. Verify Migration

Run this test query:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('failed_login_attempts', 'locked_until')
ORDER BY column_name;
```

**Expected result:** 2 rows showing both columns exist.

---

## 🧪 Testing Account Locking

### Test Steps:

1. **Go to Login page** (`http://localhost:3000/login`)

2. **Enter a valid email** (e.g., an account you created)

3. **Enter WRONG password** and click "Sign In"

4. **Repeat 5 times** with the wrong password

### Expected Behavior:

- **Attempt 1:** ❌ "Invalid email or password. **4 attempt(s) remaining** before account lock."
- **Attempt 2:** ❌ "Invalid email or password. **3 attempt(s) remaining** before account lock."
- **Attempt 3:** ❌ "Invalid email or password. **2 attempt(s) remaining** before account lock."
- **Attempt 4:** ❌ "Invalid email or password. **1 attempt(s) remaining** before account lock."
- **Attempt 5:** 🔒 "**Account locked.** Too many failed login attempts. Your account has been locked for 30 minutes."

### After Lock:

- **Attempt 6+:** 🔒 "Too many failed login attempts. Account locked for **X** more minute(s)."
- The countdown should decrease each time you try

---

## 🐛 Troubleshooting

### If you can still login infinitely:

1. **Check backend is running:**
   ```bash
   netstat -ano | findstr :5002
   ```
   Should show a process listening on port 5002.

2. **Check backend logs:**
   Look at the terminal where backend is running. On each failed login, you should see logs showing:
   - "Failed login attempt" 
   - Current attempt count
   - Lock status

3. **Verify database columns:**
   In Supabase SQL Editor:
   ```sql
   SELECT failed_login_attempts, locked_until 
   FROM users 
   WHERE email = 'your-test-email@example.com';
   ```
   After failed attempts, `failed_login_attempts` should be > 0.

4. **Check browser console:**
   Open DevTools (F12) → Console tab
   Look for any error messages or failed API calls

---

## 🔓 Manually Unlock Account

If you lock yourself out during testing:

```sql
UPDATE users 
SET failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'your-email@example.com';
```

---

## ✅ What Should Work Now:

1. ✅ Email field **stays filled** even on wrong password
2. ✅ Shows attempt countdown (5 → 4 → 3 → 2 → 1)
3. ✅ Account locks after 5 failed attempts
4. ✅ Lock lasts 30 minutes
5. ✅ Auto-unlocks after 30 minutes

---

## 📝 Notes:

- Rate limiting is ALSO active (10 login attempts per 15 minutes per IP)
- If you hit rate limit first, you'll see: "Too many authentication attempts, please try again after 15 minutes."
- Account locking is **per-user**, rate limiting is **per-IP**

