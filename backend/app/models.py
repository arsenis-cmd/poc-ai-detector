from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.database import Base

class ContentType(enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    TWEET = "tweet"
    IMPRESSION = "impression"

class Classification(enum.Enum):
    HUMAN = "human"
    AI = "ai"
    MIXED = "mixed"
    UNCERTAIN = "uncertain"
    BOT = "bot"

class ContentScan(Base):
    """Every piece of content we scan"""
    __tablename__ = "content_scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_hash = Column(String(64), index=True, nullable=False)
    content_type = Column(SQLEnum(ContentType), nullable=False)
    content_preview = Column(Text, nullable=True)  # First 200 chars
    
    classification = Column(SQLEnum(Classification), nullable=False)
    ai_probability = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    
    source_url = Column(Text, nullable=True)
    source_platform = Column(String(50), nullable=True)  # twitter, reddit, web, etc.
    
    # For Twitter specifically
    twitter_username = Column(String(100), nullable=True)
    twitter_tweet_id = Column(String(50), nullable=True)
    
    scores = Column(Text, nullable=True)  # JSON string of detailed scores
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class AttentionRecord(Base):
    """Verified human attention on ads"""
    __tablename__ = "attention_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(64), nullable=False)
    
    page_url = Column(Text, nullable=True)
    ad_element_id = Column(String(100), nullable=True)
    
    # Attention metrics
    attention_duration_ms = Column(Integer, nullable=False)
    eye_tracking_confidence = Column(Float, nullable=True)
    gaze_points_count = Column(Integer, nullable=True)
    
    # Verification
    human_verified = Column(Boolean, default=False)
    bot_probability = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class DailyStats(Base):
    """Aggregated daily statistics"""
    __tablename__ = "daily_stats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(DateTime, nullable=False, unique=True)
    
    total_scans = Column(Integer, default=0)
    ai_count = Column(Integer, default=0)
    human_count = Column(Integer, default=0)
    mixed_count = Column(Integer, default=0)
    bot_count = Column(Integer, default=0)
    
    # By platform
    twitter_scans = Column(Integer, default=0)
    twitter_ai_percentage = Column(Float, default=0)
    reddit_scans = Column(Integer, default=0)
    reddit_ai_percentage = Column(Float, default=0)
    web_scans = Column(Integer, default=0)
    web_ai_percentage = Column(Float, default=0)
    
    # Attention
    attention_verifications = Column(Integer, default=0)
    human_attention_verified = Column(Integer, default=0)
