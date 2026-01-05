from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import json
import uuid

from app.database import get_db
from app.models import ContentScan, ContentType, Classification
from app.schemas import (
    DetectRequest, DetectResponse, DetectionScores,
    BatchDetectRequest, BatchDetectResponse,
    TweetDetectRequest, TweetDetectResponse, TweetResult
)
from app.detection import text_detector, image_detector

router = APIRouter(prefix="/detect", tags=["Detection"])

@router.post("", response_model=DetectResponse)
async def detect_content(
    request: DetectRequest,
    db: AsyncSession = Depends(get_db)
):
    """Detect if content is AI-generated"""
    
    # Route to appropriate detector
    if request.content_type == "text" or request.content_type == "tweet":
        result = await text_detector.detect(
            request.content,
            request.source_platform
        )
        content_type = ContentType.TEXT if request.content_type == "text" else ContentType.TWEET
        
    elif request.content_type == "image":
        result = await image_detector.detect(request.content)
        content_type = ContentType.IMAGE
    else:
        raise HTTPException(400, f"Unsupported content type: {request.content_type}")
    
    # Map classification
    class_map = {
        "HUMAN": Classification.HUMAN,
        "LIKELY_HUMAN": Classification.HUMAN,
        "MIXED": Classification.MIXED,
        "LIKELY_AI": Classification.AI,
        "AI": Classification.AI,
        "UNCERTAIN": Classification.UNCERTAIN
    }
    
    # Create database record
    verification_id = str(uuid.uuid4())
    
    scan = ContentScan(
        id=uuid.UUID(verification_id),
        content_hash=result.content_hash,
        content_type=content_type,
        content_preview=request.content[:200] if request.content_type != "image" else None,
        classification=class_map.get(result.classification, Classification.UNCERTAIN),
        ai_probability=result.ai_probability,
        confidence=result.confidence,
        source_url=request.source_url,
        source_platform=request.source_platform or "web",
        scores=json.dumps(result.scores)
    )
    
    db.add(scan)
    await db.commit()
    
    return DetectResponse(
        success=True,
        verification_id=verification_id,
        classification=result.classification,
        ai_probability=result.ai_probability,
        human_probability=round(1 - result.ai_probability, 4),
        confidence=result.confidence,
        scores=DetectionScores(**result.scores),
        content_preview=request.content[:100] if request.content_type != "image" else None
    )

@router.post("/batch", response_model=BatchDetectResponse)
async def detect_batch(
    request: BatchDetectRequest,
    db: AsyncSession = Depends(get_db)
):
    """Detect multiple pieces of content"""
    
    results = []
    ai_count = 0
    human_count = 0
    
    for item in request.items:
        # Reuse single detect logic
        single_request = DetectRequest(
            content=item.content,
            content_type=item.content_type,
            source_url=item.source_url,
            source_platform=item.source_platform
        )
        
        try:
            result = await detect_content(single_request, db)
            results.append(result)
            
            if result.ai_probability >= 0.5:
                ai_count += 1
            else:
                human_count += 1
                
        except Exception as e:
            # Add failed result
            results.append(DetectResponse(
                success=False,
                verification_id="",
                classification="ERROR",
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0,
                scores=DetectionScores()
            ))
    
    total = len(results)
    
    return BatchDetectResponse(
        success=True,
        results=results,
        summary={
            "total": total,
            "ai_count": ai_count,
            "human_count": human_count,
            "ai_percentage": round(ai_count / total * 100, 1) if total > 0 else 0
        }
    )

@router.post("/tweets", response_model=TweetDetectResponse)
async def detect_tweets(
    request: TweetDetectRequest,
    db: AsyncSession = Depends(get_db)
):
    """Detect AI/bot content in tweets"""
    
    results = []
    ai_count = 0
    bot_count = 0
    
    for tweet in request.tweets:
        text = tweet.get('text', '')
        username = tweet.get('username', '')
        tweet_id = tweet.get('tweet_id', '')
        
        if not text or len(text) < 5:
            continue
        
        # Detect
        result = await text_detector.detect(text, 'twitter')
        is_bot = text_detector.is_likely_bot(result, tweet)
        
        # Store in database
        verification_id = str(uuid.uuid4())
        
        class_map = {
            "HUMAN": Classification.HUMAN,
            "LIKELY_HUMAN": Classification.HUMAN,
            "MIXED": Classification.MIXED,
            "LIKELY_AI": Classification.AI,
            "AI": Classification.AI,
            "UNCERTAIN": Classification.UNCERTAIN
        }
        
        scan = ContentScan(
            id=uuid.UUID(verification_id),
            content_hash=result.content_hash,
            content_type=ContentType.TWEET,
            content_preview=text[:200],
            classification=Classification.BOT if is_bot else class_map.get(result.classification, Classification.UNCERTAIN),
            ai_probability=result.ai_probability,
            confidence=result.confidence,
            source_url=request.source_url,
            source_platform='twitter',
            twitter_username=username,
            twitter_tweet_id=tweet_id,
            scores=json.dumps(result.scores)
        )
        
        db.add(scan)
        
        # Track counts
        if result.ai_probability >= 0.5:
            ai_count += 1
        if is_bot:
            bot_count += 1
        
        results.append(TweetResult(
            tweet_id=tweet_id,
            username=username,
            text_preview=text[:100],
            classification="BOT" if is_bot else result.classification,
            ai_probability=result.ai_probability,
            confidence=result.confidence,
            is_bot_likely=is_bot
        ))
    
    await db.commit()
    
    total = len(results)
    
    return TweetDetectResponse(
        success=True,
        results=results,
        summary={
            "total": total,
            "ai_count": ai_count,
            "bot_count": bot_count,
            "ai_percentage": round(ai_count / total * 100, 1) if total > 0 else 0,
            "bot_percentage": round(bot_count / total * 100, 1) if total > 0 else 0
        }
    )

@router.get("/lookup/{content_hash}")
async def lookup_by_hash(
    content_hash: str,
    db: AsyncSession = Depends(get_db)
):
    """Look up previous scan by content hash"""
    
    result = await db.execute(
        select(ContentScan).where(ContentScan.content_hash == content_hash)
    )
    scan = result.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(404, "Content not found")
    
    return {
        "verification_id": str(scan.id),
        "classification": scan.classification.value,
        "ai_probability": scan.ai_probability,
        "confidence": scan.confidence,
        "source_platform": scan.source_platform,
        "created_at": scan.created_at.isoformat()
    }
