# PoC Dashboard

Next.js dashboard for the Proof of Consideration MVP - AI content detection and attention verification.

## Features

- **Home Page**: Landing page with overview of PoC
- **Dashboard**: Real-time statistics on AI vs human content detection
  - Total scans counter
  - AI/Human content percentages
  - Platform-specific breakdowns (Twitter, Reddit, Web)
  - Pie charts and bar charts
  - Recent scans list
- **Demo Page**: Interactive attention verification demo
  - Simulated eye tracking
  - Real-time gaze point tracking
  - Verification submission to backend

## Setup

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/dashboard

# Install dependencies
npm install

# Run development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Pages

### Home (`/`)
- Landing page with product overview
- Statistics preview
- Links to dashboard and demo

### Dashboard (`/dashboard`)
- Live statistics from backend API
- Charts showing AI vs human content breakdown
- Platform-specific metrics
- Recent scans list
- Auto-refreshes every 10 seconds

### Demo (`/demo`)
- Interactive attention verification demo
- Simulated eye tracking (5 seconds)
- Submits verification to backend API
- Shows verification result and ID

## API Integration

The dashboard connects to the backend API at `http://localhost:8000/api/v1`.

API client is located at `/src/lib/api.ts` and provides:
- `getStats()` - Fetch dashboard statistics
- `detectText()` - Detect AI content in text
- `submitAttentionVerification()` - Submit attention verification data

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons

## Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard page
│   │   ├── demo/
│   │   │   └── page.tsx          # Attention demo page
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   └── lib/
│       └── api.ts                # API client
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Notes

- Dashboard expects backend API at `http://localhost:8000`
- API proxy is configured in `next.config.js` to handle CORS
- Charts require data from backend `/api/v1/stats` endpoint
- Attention demo submits to `/api/v1/attention` endpoint
