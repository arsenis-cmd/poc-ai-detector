#!/usr/bin/env python3
"""
Admin Stats Viewer - Track total scans across all users

Usage:
  python admin_stats.py                    # Show all stats
  python admin_stats.py --watch            # Auto-refresh every 10 seconds
  python admin_stats.py --export stats.json # Export to JSON file
"""

import httpx
import json
import argparse
import time
import sys
from datetime import datetime

API_URL = "http://localhost:8000/api/v1/stats/admin/global"


def format_number(num):
    """Format large numbers with K, M, B suffixes"""
    if num >= 1_000_000_000:
        return f"{num / 1_000_000_000:.2f}B"
    elif num >= 1_000_000:
        return f"{num / 1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.2f}K"
    else:
        return str(num)


def display_stats(data):
    """Display stats in a formatted table"""

    print("\n" + "="*60)
    print("  PoC AI DETECTOR - GLOBAL STATISTICS (ALL USERS)")
    print("="*60)

    global_stats = data.get("global_stats", {})
    time_breakdown = data.get("time_breakdown", {})
    platform_breakdown = data.get("platform_breakdown", {})
    timeline = data.get("timeline", {})

    print("\n📊 OVERALL STATS")
    print("-" * 60)
    print(f"  Total Scans (All Time):     {format_number(global_stats.get('total_scans', 0)):>15}")
    print(f"  Unique Content Analyzed:    {format_number(global_stats.get('unique_content_analyzed', 0)):>15}")
    print(f"  AI Detected:                {format_number(global_stats.get('ai_detected', 0)):>15} ({global_stats.get('ai_percentage', 0)}%)")
    print(f"  Human Detected:             {format_number(global_stats.get('human_detected', 0)):>15}")
    print(f"  Bots Detected:              {format_number(global_stats.get('bots_detected', 0)):>15}")

    print("\n⏱️  TIME BREAKDOWN")
    print("-" * 60)
    print(f"  Last Hour:                  {format_number(time_breakdown.get('last_hour', 0)):>15}")
    print(f"  Last 24 Hours:              {format_number(time_breakdown.get('last_24_hours', 0)):>15}")
    print(f"  Last 7 Days:                {format_number(time_breakdown.get('last_7_days', 0)):>15}")
    print(f"  Avg per Hour (24h):         {time_breakdown.get('average_per_hour_24h', 0):>15.1f}")
    print(f"  Avg per Day (7d):           {time_breakdown.get('average_per_day_7d', 0):>15.1f}")

    if platform_breakdown:
        print("\n🌐 PLATFORM BREAKDOWN")
        print("-" * 60)
        for platform, count in sorted(platform_breakdown.items(), key=lambda x: x[1], reverse=True):
            print(f"  {platform.capitalize():<20}        {format_number(count):>15}")

    print("\n📅 TIMELINE")
    print("-" * 60)
    print(f"  First Scan:                 {timeline.get('first_scan', 'N/A')[:19]}")
    print(f"  Last Scan:                  {timeline.get('last_scan', 'N/A')[:19]}")
    print(f"  Days Active:                {timeline.get('days_active', 0):>15}")

    print("\n" + "="*60)
    print(f"  Generated at: {data.get('generated_at', '')[:19]}")
    print("="*60 + "\n")


def fetch_stats():
    """Fetch stats from API"""
    try:
        response = httpx.get(API_URL, timeout=10.0)
        response.raise_for_status()
        return response.json()
    except httpx.ConnectError:
        print(f"❌ Error: Cannot connect to API at {API_URL}")
        print("   Make sure the backend server is running:")
        print("   cd backend && uvicorn app.main:app --reload --port 8000")
        sys.exit(1)
    except httpx.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        sys.exit(1)


def export_stats(filename):
    """Export stats to JSON file"""
    data = fetch_stats()
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"✅ Stats exported to {filename}")


def watch_stats(interval=10):
    """Watch stats with auto-refresh"""
    print(f"🔄 Auto-refreshing every {interval} seconds (Ctrl+C to stop)...")

    try:
        while True:
            # Clear screen (works on Unix/Linux/Mac)
            print("\033[2J\033[H", end="")

            data = fetch_stats()
            display_stats(data)

            print(f"🔄 Refreshing in {interval} seconds... (Ctrl+C to stop)")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n✋ Stopped watching stats\n")


def main():
    parser = argparse.ArgumentParser(
        description="View global stats across all PoC AI Detector users",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python admin_stats.py                     # Show stats once
  python admin_stats.py --watch             # Auto-refresh every 10 seconds
  python admin_stats.py --watch --interval 5  # Refresh every 5 seconds
  python admin_stats.py --export stats.json # Save to JSON file
        """
    )

    parser.add_argument('--watch', action='store_true',
                       help='Auto-refresh stats every N seconds')
    parser.add_argument('--interval', type=int, default=10,
                       help='Refresh interval in seconds (default: 10)')
    parser.add_argument('--export', type=str, metavar='FILE',
                       help='Export stats to JSON file')
    parser.add_argument('--api-url', type=str, default=API_URL,
                       help=f'API endpoint URL (default: {API_URL})')

    args = parser.parse_args()

    # Update API URL if provided
    global API_URL
    if args.api_url:
        API_URL = args.api_url

    if args.export:
        export_stats(args.export)
    elif args.watch:
        watch_stats(args.interval)
    else:
        data = fetch_stats()
        display_stats(data)


if __name__ == "__main__":
    main()
