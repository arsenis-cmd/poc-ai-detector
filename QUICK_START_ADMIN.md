# Quick Start: Tracking Your 1M Users

## TL;DR - See Total Scans Across All Users

### Option 1: Python Script (Easiest)

```bash
cd backend
python admin_stats.py
```

Output shows total scans from ALL users:
```
Total Scans (All Time):     15.24M
Last 24 Hours:              287.3K
AI Detected:                4.57M (30%)
```

### Option 2: API Call

```bash
curl http://localhost:8000/api/v1/stats/admin/global
```

Returns JSON with complete statistics.

### Option 3: Database Query

```sql
SELECT COUNT(*) FROM content_scans;
```

---

## How It Works

### Per-User Stats (Local)
- Each user's extension tracks **their own** scans locally
- Stored in browser's chrome.storage
- Visible in extension popup under "Lifetime Total"

### Global Stats (Server)
- **Every scan** from every user is sent to your backend API
- Stored in PostgreSQL database
- Query anytime to see **total across all 1M users**

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/admin_stats.py` | View global stats in terminal |
| `backend/app/routes/stats.py` | API endpoint (line 145) |
| `TRACKING_GLOBAL_STATS.md` | Complete documentation |

---

## Production Setup

1. **Deploy backend** (Railway, Heroku, AWS, etc.)
2. **Use PostgreSQL** (not SQLite) for production
3. **Add indexes** for fast queries:
   ```sql
   CREATE INDEX idx_content_scans_created_at ON content_scans(created_at DESC);
   ```
4. **Set up monitoring** (Grafana, Datadog, etc.)

---

## Example: Real-Time Monitoring

```bash
# Watch stats update every 10 seconds
python admin_stats.py --watch

# Export daily report
python admin_stats.py --export stats_$(date +%Y%m%d).json
```

---

## Cost Estimate (1M users)

- 100M scans/month
- Database: $200-500/month
- API servers: $300-600/month
- **Total: ~$500-1,100/month**

---

That's it! Your backend already tracks everything. Just query it. 🚀
