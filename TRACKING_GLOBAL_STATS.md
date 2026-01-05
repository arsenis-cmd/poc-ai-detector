# Tracking Global Statistics Across All Users

## Overview

With 1 million users, you need to track scans **server-side**. Here's how it works:

### What's Already Working

✅ **Every scan is recorded in your database** - The backend stores each scan in the `content_scans` table
✅ **Global stats endpoint exists** - Query total scans across all users
✅ **De-duplication** - Same content scanned by multiple users is tracked efficiently via content hashing

### Two-Level Tracking

1. **Per-User (Client-Side)**: Each user sees their own lifetime scan count in the extension popup
2. **Global (Server-Side)**: You (the admin) can query total scans across ALL users

---

## Viewing Global Stats

### Method 1: Admin Stats Script (Recommended)

Run the Python admin script to see real-time statistics:

```bash
cd backend

# Show stats once
python admin_stats.py

# Auto-refresh every 10 seconds
python admin_stats.py --watch

# Export to JSON
python admin_stats.py --export stats.json
```

**Output Example:**
```
============================================================
  PoC AI DETECTOR - GLOBAL STATISTICS (ALL USERS)
============================================================

📊 OVERALL STATS
------------------------------------------------------------
  Total Scans (All Time):                    15.24M
  Unique Content Analyzed:                    8.91M
  AI Detected:                                4.57M (30%)
  Human Detected:                             9.12M
  Bots Detected:                              1.55M

⏱️  TIME BREAKDOWN
------------------------------------------------------------
  Last Hour:                                   12.5K
  Last 24 Hours:                              287.3K
  Last 7 Days:                                  1.8M
  Avg per Hour (24h):                        12,000
  Avg per Day (7d):                         257,143

🌐 PLATFORM BREAKDOWN
------------------------------------------------------------
  Twitter                                      8.45M
  Reddit                                       4.12M
  Web                                          2.67M

📅 TIMELINE
------------------------------------------------------------
  First Scan:                 2024-12-01 10:23:45
  Last Scan:                  2024-12-31 20:45:12
  Days Active:                               30
============================================================
```

### Method 2: Direct API Query

Query the admin endpoint directly:

```bash
# Using curl
curl http://localhost:8000/api/v1/stats/admin/global

# Using httpie
http GET http://localhost:8000/api/v1/stats/admin/global
```

**Response:**
```json
{
  "global_stats": {
    "total_scans": 15240000,
    "unique_content_analyzed": 8910000,
    "ai_detected": 4570000,
    "human_detected": 9120000,
    "bots_detected": 1550000,
    "ai_percentage": 30.0
  },
  "time_breakdown": {
    "last_hour": 12500,
    "last_24_hours": 287300,
    "last_7_days": 1800000,
    "average_per_hour_24h": 12000.0,
    "average_per_day_7d": 257143.0
  },
  "platform_breakdown": {
    "twitter": 8450000,
    "reddit": 4120000,
    "web": 2670000
  },
  "timeline": {
    "first_scan": "2024-12-01T10:23:45",
    "last_scan": "2024-12-31T20:45:12",
    "days_active": 30
  },
  "generated_at": "2024-12-31T20:45:15"
}
```

### Method 3: Database Query

Query the database directly:

```sql
-- Total scans across all users
SELECT COUNT(*) FROM content_scans;

-- Scans by classification
SELECT
  classification,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM content_scans), 2) as percentage
FROM content_scans
GROUP BY classification;

-- Scans by platform
SELECT
  source_platform,
  COUNT(*) as count
FROM content_scans
GROUP BY source_platform
ORDER BY count DESC;

-- Scans in last 24 hours
SELECT COUNT(*)
FROM content_scans
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Daily scan trend (last 7 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as scans
FROM content_scans
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

---

## Production Deployment

### Database Scaling

For 1M users, ensure your database can handle the load:

**PostgreSQL Configuration (recommended for production):**

```bash
# In postgresql.conf
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 16MB
maintenance_work_mem = 1GB

# Add indexes for fast queries
CREATE INDEX idx_content_scans_created_at ON content_scans(created_at DESC);
CREATE INDEX idx_content_scans_classification ON content_scans(classification);
CREATE INDEX idx_content_scans_platform ON content_scans(source_platform);
CREATE INDEX idx_content_hash ON content_scans(content_hash);
```

### Monitoring & Analytics

**Option 1: Built-in Dashboard**

Access the Next.js dashboard at `http://localhost:3000/dashboard` which shows:
- Real-time statistics
- Platform breakdowns
- Recent scans
- Charts and visualizations

**Option 2: Analytics Tools**

Integrate with analytics platforms:
- **Grafana** - Real-time dashboards and alerts
- **Metabase** - Self-service BI for your database
- **Datadog/New Relic** - Application performance monitoring

**Option 3: Custom Reporting**

Create scheduled reports:

```python
# backend/scripts/daily_report.py
import asyncio
import httpx
from datetime import datetime

async def generate_daily_report():
    async with httpx.AsyncClient() as client:
        stats = await client.get("http://localhost:8000/api/v1/stats/admin/global")
        data = stats.json()

        report = f"""
        Daily Report - {datetime.now().strftime('%Y-%m-%d')}

        Total Scans: {data['global_stats']['total_scans']:,}
        Last 24h: {data['time_breakdown']['last_24_hours']:,}
        AI Detection Rate: {data['global_stats']['ai_percentage']}%

        Platform Breakdown:
        {chr(10).join(f"  - {k}: {v:,}" for k, v in data['platform_breakdown'].items())}
        """

        # Send via email, Slack, etc.
        print(report)

asyncio.run(generate_daily_report())
```

---

## API Endpoints Summary

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `GET /api/v1/stats` | Current statistics | Public dashboard |
| `GET /api/v1/stats/realtime` | Last hour stats | Live monitoring |
| `GET /api/v1/stats/admin/global` | Complete global stats | Admin tracking (1M users) |

---

## Data Retention

By default, all scans are kept forever. For cost optimization:

### Option 1: Archive Old Data

```sql
-- Archive scans older than 90 days to a separate table
CREATE TABLE content_scans_archive AS
SELECT * FROM content_scans
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM content_scans
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Option 2: Aggregate Historical Data

```sql
-- Create daily summaries
CREATE TABLE daily_summary AS
SELECT
  DATE(created_at) as date,
  classification,
  source_platform,
  COUNT(*) as count
FROM content_scans
GROUP BY DATE(created_at), classification, source_platform;

-- Then delete raw data older than 30 days
DELETE FROM content_scans WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Cost Estimation

For 1M users with average usage:

**Database Storage:**
- 100 scans/user/month = 100M scans/month
- ~500 bytes per scan = 50GB/month
- PostgreSQL on AWS RDS: ~$200-500/month

**API Server:**
- 100M requests/month
- 2-4 backend instances
- AWS/GCP: ~$300-600/month

**Total estimated cost: $500-1,100/month** for 1M active users

---

## Security Note

⚠️ **Important**: The `/admin/global` endpoint exposes aggregate statistics. In production:

1. **Add authentication**:
   ```python
   from fastapi import Depends, HTTPException, Header

   async def verify_admin_token(authorization: str = Header(...)):
       if authorization != f"Bearer {ADMIN_API_KEY}":
           raise HTTPException(status_code=401, detail="Unauthorized")
       return True

   @router.get("/admin/global", dependencies=[Depends(verify_admin_token)])
   async def get_global_admin_stats(...):
       ...
   ```

2. **Use environment variables** for admin credentials

3. **Enable rate limiting** to prevent abuse

4. **Log access** to admin endpoints

---

## Quick Start

```bash
# 1. Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# 2. View stats (in another terminal)
python admin_stats.py --watch

# 3. Export stats
python admin_stats.py --export daily_stats_$(date +%Y%m%d).json
```

Now you can track scans from all 1 million users! 🎉
