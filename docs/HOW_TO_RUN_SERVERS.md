# 🚀 How to Run Petflix Servers

## 📁 Your Project Structure

You have **TWO separate projects** in `C:\Users\jack\petflix\`:

```
C:\Users\jack\petflix\
├── Petflix-1\           ← BACKEND (Express API)
├── Petflix-Frontend\    ← FRONTEND (React App)
└── Petflix\             ← OLD PROJECT (ignore this)
```

---

## 🔧 Starting the Backend (Port 5001)

### Terminal 1 - Backend:
```bash
cd C:\Users\jack\petflix\Petflix-1
npm run dev
```

**You should see:**
```
Server running on port 5001
```

**Test it:** Open browser to `http://localhost:5001/health`

---

## 🎨 Starting the Frontend (Port 5173)

### Terminal 2 - Frontend:
```bash
cd C:\Users\jack\petflix\Petflix-Frontend
npm run dev
```

**You should see:**
```
VITE v... ready in ...ms
➜ Local:   http://localhost:5173/
```

**Test it:** Open browser to `http://localhost:5173`

---

## ⚠️ Common Mistake

### ❌ WRONG:
```bash
# Being in Petflix-1 and trying to run frontend
cd C:\Users\jack\petflix\Petflix-1
npm run dev    # This runs BACKEND, not frontend!
```

### ✅ CORRECT:
```bash
# Two separate terminals:

# Terminal 1 - Backend
cd C:\Users\jack\petflix\Petflix-1
npm run dev

# Terminal 2 - Frontend
cd C:\Users\jack\petflix\Petflix-Frontend
npm run dev
```

---

## 🔍 How to Tell Which Server is Running

### Backend Output:
```
> backend@1.0.0 dev
> tsx watch src/server.ts

Server running on port 5001
```

### Frontend Output:
```
> petflix-frontend@0.0.0 dev
> vite

VITE v7.2.2  ready in 523 ms

➜  Local:   http://localhost:5173/
```

---

## 🚦 Quick Status Check

Run these commands to see what's running:

```bash
# Check if backend is running
curl http://localhost:5001/health

# Check if frontend is running
curl http://localhost:5173
```

Or just open in browser:
- **Backend:** http://localhost:5001/health
- **Frontend:** http://localhost:5173

---

## 🛑 If Port is Already in Use

### Kill all Node processes (Windows):
```bash
taskkill /F /IM node.exe
```

### Then restart both servers in the correct directories.

---

## 📝 Summary

| Project | Directory | Command | Port | URL |
|---------|-----------|---------|------|-----|
| Backend | `Petflix-1` | `npm run dev` | 5001 | http://localhost:5001 |
| Frontend | `Petflix-Frontend` | `npm run dev` | 5173 | http://localhost:5173 |

---

## ✅ You're Ready When:

1. Terminal 1 shows: `Server running on port 5001`
2. Terminal 2 shows: `Local: http://localhost:5173/`
3. Browser at `http://localhost:5173` shows Petflix landing page

🎉 **That's it!** Both servers need to run simultaneously.

