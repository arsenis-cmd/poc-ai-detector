from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import secrets

router = APIRouter(prefix="/api/v1/impressions", tags=["impressions"])

class ImpressionVerification(BaseModel):
    ad_id: str
    platform: str
    ad_type: str
    attention_time: float
    url: str
    timestamp: str
    verification_method: str

class ImpressionResponse(BaseModel):
    verified: bool
    impression_id: str
    reward_tokens: int
    redirect_url: Optional[str] = None
    message: str

# In-memory storage (replace with database in production)
verified_impressions = {}

@router.post("/verify", response_model=ImpressionResponse)
async def verify_impression(impression: ImpressionVerification):
    """
    Verify that a user actually viewed an ad
    - Requires minimum attention time (3 seconds)
    - Records impression with unique ID
    - Awards tokens to user
    - Optional: Returns redirect URL
    """
    try:
        # Validate attention time
        if impression.attention_time < 3.0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient attention time: {impression.attention_time}s (minimum 3s required)"
            )

        # Generate unique impression ID
        impression_id = secrets.token_urlsafe(16)

        # Calculate reward based on attention time
        # Base: 10 tokens for 3s, +2 tokens per additional second
        base_reward = 10
        bonus_reward = int((impression.attention_time - 3) * 2)
        total_reward = base_reward + bonus_reward

        # Store impression
        verified_impressions[impression_id] = {
            'ad_id': impression.ad_id,
            'platform': impression.platform,
            'ad_type': impression.ad_type,
            'attention_time': impression.attention_time,
            'url': impression.url,
            'timestamp': impression.timestamp,
            'verification_method': impression.verification_method,
            'reward_tokens': total_reward,
            'verified_at': datetime.utcnow().isoformat()
        }

        # Optional: Get redirect URL for this ad
        # In production, this would come from advertiser database
        redirect_url = None
        if impression.platform == 'twitter' and impression.ad_type == 'promoted_tweet':
            # Extract URL from ad if available
            # For now, return None
            pass

        return ImpressionResponse(
            verified=True,
            impression_id=impression_id,
            reward_tokens=total_reward,
            redirect_url=redirect_url,
            message=f"Verified! You earned {total_reward} PoC tokens for {impression.attention_time:.1f}s of attention."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.get("/stats")
async def get_impression_stats():
    """
    Get statistics about verified impressions
    """
    if not verified_impressions:
        return {
            'total_impressions': 0,
            'total_tokens_awarded': 0,
            'avg_attention_time': 0,
            'by_platform': {}
        }

    total_impressions = len(verified_impressions)
    total_tokens = sum(imp['reward_tokens'] for imp in verified_impressions.values())
    avg_attention = sum(imp['attention_time'] for imp in verified_impressions.values()) / total_impressions

    # Group by platform
    by_platform = {}
    for imp in verified_impressions.values():
        platform = imp['platform']
        if platform not in by_platform:
            by_platform[platform] = {
                'count': 0,
                'total_tokens': 0,
                'avg_attention': 0
            }
        by_platform[platform]['count'] += 1
        by_platform[platform]['total_tokens'] += imp['reward_tokens']

    # Calculate averages
    for platform, data in by_platform.items():
        platform_imps = [imp for imp in verified_impressions.values() if imp['platform'] == platform]
        data['avg_attention'] = sum(imp['attention_time'] for imp in platform_imps) / len(platform_imps)

    return {
        'total_impressions': total_impressions,
        'total_tokens_awarded': total_tokens,
        'avg_attention_time': round(avg_attention, 2),
        'by_platform': by_platform
    }


@router.get("/{impression_id}")
async def get_impression(impression_id: str):
    """
    Get details of a specific impression
    """
    if impression_id not in verified_impressions:
        raise HTTPException(status_code=404, detail="Impression not found")

    return verified_impressions[impression_id]


@router.get("/user/{user_id}/earnings")
async def get_user_earnings(user_id: str):
    """
    Get total earnings for a user
    (In production, filter by actual user ID)
    """
    # For now, return total across all impressions
    # In production, you'd filter by user_id
    total_tokens = sum(imp['reward_tokens'] for imp in verified_impressions.values())

    return {
        'user_id': user_id,
        'total_tokens': total_tokens,
        'total_impressions': len(verified_impressions),
        'avg_reward': total_tokens / len(verified_impressions) if verified_impressions else 0
    }
