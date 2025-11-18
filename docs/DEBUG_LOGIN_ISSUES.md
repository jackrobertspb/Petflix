# 🐛 Debug Login Issues

## The Problem

1. ❌ First attempt: "invalid email or password"
2. ❌ Subsequent attempts: "authentication failed"
3. ❌ Account locking not working at all

## Root Cause: SQL Migration Not Run

The account locking feature requires **two new database columns** that don't exist yet:
- `failed_login_attempts` (INTEGER)
- `locked_until` (TIMESTAMP)

Without these columns, the backend code is **failing** when it tries to read/write these fields.

---

## 🚨 CRITICAL: Run This SQL Migration NOW

### Step 1: Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/zxsyidsgvingbexobmqg/sql**

Or:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

### Step 2: Check if Migration is Needed

Paste this and click **RUN**:

```sql
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('failed_login_attempts', 'locked_until')
ORDER BY column_name;
```

**Result shows 0 rows?** → You MUST run Step 3  
**Result shows 2 rows?** → Migration already done, skip to Step 4

### Step 3: Run the Migration

Paste this and click **RUN**:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
```

**Expected output:** "Success. No rows returned" or similar success message.

### Step 4: Verify

Run Step 2 query again. You should now see **2 rows**:
```
failed_login_attempts | integer
locked_until | timestamp without time zone
```

---

## 🔧 After Running Migration

1. **Restart Backend:**
   - The backend should already be running
   - But if you want to restart: Stop it (Ctrl+C in terminal) and run `npm run dev` again

2. **Hard Refresh Frontend:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Test Again:**
   - Go to Login page
   - Try wrong password 5 times
   - You should now see proper countdown messages

---

## 🧪 Expected Behavior (After Migration)

### Attempt 1:
```
⚠️ Invalid email or password. 4 attempt(s) remaining before account lock.
```

### Attempt 2:
```
⚠️ Invalid email or password. 3 attempt(s) remaining before account lock.
```

### Attempt 3:
```
⚠️ Invalid email or password. 2 attempt(s) remaining before account lock.
```

### Attempt 4:
```
⚠️ Invalid email or password. 1 attempt(s) remaining before account lock.
```

### Attempt 5:
```
⚠️ Too many failed login attempts. Your account has been locked for 30 minutes. Please reset your password or try again later.
```

### Attempt 6+ (while locked):
```
⚠️ Too many failed login attempts. Account locked for 29 more minute(s). Please try again later or reset your password.
```

---

## 🐛 Still Not Working?

### Check Backend Console

Look at the terminal where your backend is running. You should see:
- When you try to login: "🔐 Attempting login..."
- On failed attempt: Details about attempt count
- On lock: "Account locked" message

### Check Browser Console

Press F12 → Console tab. Look for:
- Red error messages
- HTTP status codes (401, 403, 429)
- Full error responses

### Check Database Directly

Run this in Supabase SQL Editor:

```sql
SELECT 
    email, 
    failed_login_attempts, 
    locked_until 
FROM users 
WHERE email = 'YOUR-EMAIL@example.com';
```

After failed attempts, you should see:
- `failed_login_attempts` increasing (1, 2, 3, 4, 5)
- `locked_until` set to a future timestamp after 5th attempt

---

## 📝 Summary

**The account locking feature CANNOT work without the database columns.**

1. ✅ Run the SQL migration (Step 2-3 above)
2. ✅ Restart backend (if needed)
3. ✅ Hard refresh frontend
4. ✅ Test with wrong password 5 times
5. ✅ Should see countdown → lock message

**Run that SQL migration first, then test again!** 🚀

