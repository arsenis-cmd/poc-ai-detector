from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from app.database import get_db
from app.models import ContentScan, AttentionRecord, Classification, ContentType
from app.schemas import StatsResponse

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated statistics"""
    
    # Total counts
    total_result = await db.execute(select(func.count(ContentScan.id)))
    total_scans = total_result.scalar() or 0
    
    # Classification counts
    ai_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.AI)
    )
    ai_count = ai_result.scalar() or 0
    
    human_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.HUMAN)
    )
    human_count = human_result.scalar() or 0
    
    mixed_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.MIXED)
    )
    mixed_count = mixed_result.scalar() or 0
    
    bot_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.BOT)
    )
    bot_count = bot_result.scalar() or 0
    
    # Platform-specific stats
    async def get_platform_stats(platform: str):
        total = await db.execute(
            select(func.count(ContentScan.id)).where(ContentScan.source_platform == platform)
        )
        total_count = total.scalar() or 0
        
        ai = await db.execute(
            select(func.count(ContentScan.id)).where(
                and_(
                    ContentScan.source_platform == platform,
                    ContentScan.classification.in_([Classification.AI, Classification.BOT])
                )
            )
        )
        ai_count = ai.scalar() or 0
        
        return {
            "total": total_count,
            "ai_count": ai_count,
            "ai_percentage": round(ai_count / total_count * 100, 1) if total_count > 0 else 0
        }
    
    twitter_stats = await get_platform_stats('twitter')
    reddit_stats = await get_platform_stats('reddit')
    web_stats = await get_platform_stats('web')
    
    # Recent scans (last 10)
    recent_result = await db.execute(
        select(ContentScan)
        .order_by(ContentScan.created_at.desc())
        .limit(10)
    )
    recent_scans = [
        {
            "id": str(scan.id),
            "classification": scan.classification.value,
            "ai_probability": scan.ai_probability,
            "platform": scan.source_platform,
            "preview": scan.content_preview[:50] if scan.content_preview else None,
            "created_at": scan.created_at.isoformat()
        }
        for scan in recent_result.scalars()
    ]
    
    # Attention stats
    attention_total = await db.execute(select(func.count(AttentionRecord.id)))
    attention_count = attention_total.scalar() or 0
    
    attention_verified = await db.execute(
        select(func.count(AttentionRecord.id)).where(AttentionRecord.human_verified == True)
    )
    verified_count = attention_verified.scalar() or 0
    
    # Calculate percentages
    total_for_pct = total_scans or 1  # Avoid division by zero
    
    return StatsResponse(
        total_scans=total_scans,
        ai_percentage=round(ai_count / total_for_pct * 100, 1),
        human_percentage=round(human_count / total_for_pct * 100, 1),
        mixed_percentage=round(mixed_count / total_for_pct * 100, 1),
        bot_percentage=round(bot_count / total_for_pct * 100, 1),
        twitter_stats=twitter_stats,
        reddit_stats=reddit_stats,
        web_stats=web_stats,
        recent_scans=recent_scans,
        attention_stats={
            "total_verifications": attention_count,
            "human_verified": verified_count,
            "verification_rate": round(verified_count / attention_count * 100, 1) if attention_count > 0 else 0
        },
        last_updated=datetime.utcnow()
    )

@router.get("/realtime")
async def get_realtime_stats(db: AsyncSession = Depends(get_db)):
    """Get stats for last hour (for live dashboard)"""

    one_hour_ago = datetime.utcnow() - timedelta(hours=1)

    # Scans in last hour
    result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.created_at >= one_hour_ago)
    )
    recent_count = result.scalar() or 0

    # AI in last hour
    ai_result = await db.execute(
        select(func.count(ContentScan.id)).where(
            and_(
                ContentScan.created_at >= one_hour_ago,
                ContentScan.classification.in_([Classification.AI, Classification.BOT])
            )
        )
    )
    ai_count = ai_result.scalar() or 0

    return {
        "scans_last_hour": recent_count,
        "ai_percentage_last_hour": round(ai_count / recent_count * 100, 1) if recent_count > 0 else 0,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/admin/global")
async def get_global_admin_stats(db: AsyncSession = Depends(get_db)):
    """
    Admin endpoint: Get comprehensive statistics across ALL users
    Use this to track total scans from all 1M+ users
    """

    # Total scans ever (across all users)
    total_result = await db.execute(select(func.count(ContentScan.id)))
    total_scans = total_result.scalar() or 0

    # Get unique content hashes (de-duplicated content)
    unique_result = await db.execute(select(func.count(func.distinct(ContentScan.content_hash))))
    unique_content = unique_result.scalar() or 0

    # Breakdown by classification
    ai_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.AI)
    )
    ai_count = ai_result.scalar() or 0

    human_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.HUMAN)
    )
    human_count = human_result.scalar() or 0

    bot_result = await db.execute(
        select(func.count(ContentScan.id)).where(ContentScan.classification == Classification.BOT)
    )
    bot_count = bot_result.scalar() or 0

    # Scans by time period
    async def get_time_period_count(hours_ago: int):
        cutoff = datetime.utcnow() - timedelta(hours=hours_ago)
        result = await db.execute(
            select(func.count(ContentScan.id)).where(ContentScan.created_at >= cutoff)
        )
        return result.scalar() or 0

    scans_last_hour = await get_time_period_count(1)
    scans_last_24h = await get_time_period_count(24)
    scans_last_week = await get_time_period_count(168)  # 7 days

    # Platform breakdown
    platform_result = await db.execute(
        select(
            ContentScan.source_platform,
            func.count(ContentScan.id).label('count')
        ).group_by(ContentScan.source_platform)
    )
    platform_breakdown = {row[0]: row[1] for row in platform_result}

    # Get first and last scan timestamps
    first_scan_result = await db.execute(
        select(ContentScan.created_at).order_by(ContentScan.created_at.asc()).limit(1)
    )
    first_scan = first_scan_result.scalar()

    last_scan_result = await db.execute(
        select(ContentScan.created_at).order_by(ContentScan.created_at.desc()).limit(1)
    )
    last_scan = last_scan_result.scalar()

    return {
        "global_stats": {
            "total_scans": total_scans,
            "unique_content_analyzed": unique_content,
            "ai_detected": ai_count,
            "human_detected": human_count,
            "bots_detected": bot_count,
            "ai_percentage": round(ai_count / total_scans * 100, 2) if total_scans > 0 else 0
        },
        "time_breakdown": {
            "last_hour": scans_last_hour,
            "last_24_hours": scans_last_24h,
            "last_7_days": scans_last_week,
            "average_per_hour_24h": round(scans_last_24h / 24, 1) if scans_last_24h > 0 else 0,
            "average_per_day_7d": round(scans_last_week / 7, 1) if scans_last_week > 0 else 0
        },
        "platform_breakdown": platform_breakdown,
        "timeline": {
            "first_scan": first_scan.isoformat() if first_scan else None,
            "last_scan": last_scan.isoformat() if last_scan else None,
            "days_active": (datetime.utcnow() - first_scan).days if first_scan else 0
        },
        "generated_at": datetime.utcnow().isoformat()
    }
