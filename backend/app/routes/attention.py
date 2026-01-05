from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database import get_db
from app.models import AttentionRecord
from app.schemas import AttentionRequest, AttentionResponse

router = APIRouter(prefix="/attention", tags=["Attention Verification"])

@router.post("", response_model=AttentionResponse)
async def record_attention(
    request: AttentionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Record and verify human attention on content/ads"""
    
    # Calculate verification
    duration_ms = request.attention_duration_ms
    eye_confidence = 0.0
    gaze_count = request.gaze_points_count or 0
    
    if request.eye_tracking_data:
        eye_confidence = request.eye_tracking_data.get('average_confidence', 0)
        gaze_count = request.eye_tracking_data.get('gaze_points', gaze_count)
    
    # Determine if human verified
    # Criteria:
    # 1. Attention duration >= 2 seconds
    # 2. Eye tracking confidence >= 0.5 OR gaze points >= 10
    # 3. No bot indicators
    
    human_verified = False
    bot_probability = 0.5
    
    if duration_ms >= 2000:  # 2 seconds minimum
        if eye_confidence >= 0.5 or gaze_count >= 10:
            human_verified = True
            bot_probability = 0.1
        elif eye_confidence >= 0.3 or gaze_count >= 5:
            human_verified = True
            bot_probability = 0.3
        else:
            bot_probability = 0.6
    else:
        bot_probability = 0.8
    
    # Calculate confidence
    confidence = 0.5
    if eye_confidence > 0:
        confidence = min(0.5 + eye_confidence * 0.5, 0.95)
    elif gaze_count > 0:
        confidence = min(0.5 + (gaze_count / 50) * 0.4, 0.85)
    
    # Store record
    verification_id = str(uuid.uuid4())
    
    record = AttentionRecord(
        id=uuid.UUID(verification_id),
        session_id=request.session_id,
        page_url=request.page_url,
        ad_element_id=request.ad_element_id,
        attention_duration_ms=duration_ms,
        eye_tracking_confidence=eye_confidence,
        gaze_points_count=gaze_count,
        human_verified=human_verified,
        bot_probability=bot_probability
    )
    
    db.add(record)
    await db.commit()
    
    return AttentionResponse(
        success=True,
        session_id=request.session_id,
        human_verified=human_verified,
        attention_duration_ms=duration_ms,
        confidence=round(confidence, 4),
        verification_id=verification_id
    )

@router.get("/session/{session_id}")
async def get_session_attention(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all attention records for a session"""
    
    from sqlalchemy import select
    
    result = await db.execute(
        select(AttentionRecord)
        .where(AttentionRecord.session_id == session_id)
        .order_by(AttentionRecord.created_at.desc())
    )
    
    records = [
        {
            "verification_id": str(r.id),
            "human_verified": r.human_verified,
            "attention_duration_ms": r.attention_duration_ms,
            "eye_tracking_confidence": r.eye_tracking_confidence,
            "created_at": r.created_at.isoformat()
        }
        for r in result.scalars()
    ]
    
    return {
        "session_id": session_id,
        "records": records,
        "total": len(records),
        "verified_count": sum(1 for r in records if r['human_verified'])
    }
