# Quick Start Guide

## Get the Dashboard Running in 3 Steps

### Step 1: Install Dependencies

```bash
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/dashboard
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts (for charts)
- Lucide React (for icons)

### Step 2: Make Sure Backend is Running

The dashboard needs the backend API at `http://localhost:8000`.

If it's not running, start it:

```bash
# In another terminal, navigate to backend directory
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/backend

# Start with docker-compose (recommended)
docker-compose up

# OR start locally with Python
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Step 3: Start the Dashboard

```bash
npm run dev
```

The dashboard will start at: **http://localhost:3000**

## Visit the Pages

Once running, check out:

1. **Home**: http://localhost:3000
   - Landing page with overview

2. **Dashboard**: http://localhost:3000/dashboard
   - Live statistics
   - Charts and graphs
   - Recent scans

3. **Demo**: http://localhost:3000/demo
   - Interactive attention verification demo
   - Try the 5-second tracking simulation

## Troubleshooting

### "Failed to load stats" error
- Make sure backend API is running at http://localhost:8000
- Test: `curl http://localhost:8000/api/v1/stats`

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Dependencies won't install
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

Once the dashboard is running:

1. Install the Chrome extension (in `/extension` folder)
2. Browse Twitter or any website
3. See the stats appear in the dashboard
4. Try the attention verification demo

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **Recharts**: Charts and graphs
- **Lucide React**: Beautiful icons
