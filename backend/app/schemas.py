from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class ContentTypeEnum(str, Enum):
    text = "text"
    image = "image"
    tweet = "tweet"

# Request Models
class DetectRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Text content or base64 image")
    content_type: ContentTypeEnum = ContentTypeEnum.text
    source_url: Optional[str] = None
    source_platform: Optional[str] = None
    
class BatchDetectRequest(BaseModel):
    items: List[DetectRequest] = Field(..., max_length=50)

class TweetDetectRequest(BaseModel):
    tweets: List[Dict[str, Any]] = Field(..., description="List of tweet objects with text and metadata")
    source_url: Optional[str] = None

class AttentionRequest(BaseModel):
    session_id: str
    page_url: Optional[str] = None
    ad_element_id: Optional[str] = None
    attention_duration_ms: int
    eye_tracking_data: Optional[Dict[str, Any]] = None
    gaze_points_count: Optional[int] = None

# Response Models
class DetectionScores(BaseModel):
    gptzero: Optional[float] = None
    perplexity: Optional[float] = None
    patterns: Optional[float] = None
    
class DetectResponse(BaseModel):
    success: bool
    verification_id: str
    classification: str
    ai_probability: float
    human_probability: float
    confidence: float
    scores: DetectionScores
    content_preview: Optional[str] = None

class BatchDetectResponse(BaseModel):
    success: bool
    results: List[DetectResponse]
    summary: Dict[str, Any]

class TweetResult(BaseModel):
    tweet_id: Optional[str]
    username: Optional[str]
    text_preview: str
    classification: str
    ai_probability: float
    confidence: float
    is_bot_likely: bool

class TweetDetectResponse(BaseModel):
    success: bool
    results: List[TweetResult]
    summary: Dict[str, Any]

class AttentionResponse(BaseModel):
    success: bool
    session_id: str
    human_verified: bool
    attention_duration_ms: int
    confidence: float
    verification_id: str

class StatsResponse(BaseModel):
    total_scans: int
    ai_percentage: float
    human_percentage: float
    mixed_percentage: float
    bot_percentage: float
    
    twitter_stats: Dict[str, Any]
    reddit_stats: Dict[str, Any]
    web_stats: Dict[str, Any]
    
    recent_scans: List[Dict[str, Any]]
    attention_stats: Dict[str, Any]
    
    last_updated: datetime
