from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.detection.companion import ScreenCompanion

router = APIRouter(prefix="/api/v1/companion", tags=["companion"])
companion = ScreenCompanion()

class CompanionRequest(BaseModel):
    screenshot: Optional[str] = None  # Base64 encoded screenshot
    url: str = ""
    page_title: str = ""
    page_text: str = ""

class CompanionReactionRequest(BaseModel):
    content_type: str
    ai_probability: float
    factcheck_results: Optional[List[dict]] = None

class CompanionResponse(BaseModel):
    message: str
    tone: str
    confidence: float
    emoji: str

@router.post("/comment", response_model=CompanionResponse)
async def get_companion_comment(request: CompanionRequest):
    """
    Get an AI companion comment about what's on screen
    Like having a friend watch with you
    """
    try:
        result = await companion.comment_on_screen(
            screenshot_base64=request.screenshot,
            url=request.url,
            page_title=request.page_title,
            page_text=request.page_text
        )

        # Map tone to emoji
        tone_emoji = {
            'curious': '🤔',
            'skeptical': '🤨',
            'impressed': '👍',
            'concerned': '⚠️',
            'funny': '😄'
        }

        return CompanionResponse(
            message=result.message,
            tone=result.tone,
            confidence=result.confidence,
            emoji=tone_emoji.get(result.tone, '💬')
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Companion comment failed: {str(e)}")


@router.post("/react", response_model=CompanionResponse)
async def get_companion_reaction(request: CompanionReactionRequest):
    """
    Get companion's reaction to detected content
    (AI content, fact-check results, etc.)
    """
    try:
        result = await companion.react_to_content(
            content_type=request.content_type,
            ai_probability=request.ai_probability,
            factcheck_results=request.factcheck_results
        )

        tone_emoji = {
            'curious': '🤔',
            'skeptical': '🤨',
            'impressed': '👍',
            'concerned': '⚠️',
            'funny': '😄'
        }

        return CompanionResponse(
            message=result.message,
            tone=result.tone,
            confidence=result.confidence,
            emoji=tone_emoji.get(result.tone, '💬')
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Companion reaction failed: {str(e)}")
