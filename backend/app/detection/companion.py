import base64
import random
from typing import Optional, Dict
from dataclasses import dataclass
import httpx
from app.config import settings

@dataclass
class CompanionComment:
    message: str
    tone: str  # "curious", "skeptical", "impressed", "concerned", "funny"
    confidence: float

class ScreenCompanion:
    """AI companion that watches your screen and makes comments like a friend"""

    def __init__(self):
        self.anthropic_key = settings.ANTHROPIC_API_KEY if hasattr(settings, 'ANTHROPIC_API_KEY') else None

        # Mock comment templates by content type
        self.mock_comments = {
            'news': [
                ("Hmm, this headline seems a bit sensationalized... 🤔", "skeptical", 0.7),
                ("Wait, let me fact-check that real quick...", "curious", 0.8),
                ("This source looks legit though", "impressed", 0.6),
                ("I've seen this story on 3 other sites today", "curious", 0.7),
            ],
            'social': [
                ("Another AI-generated hot take? Classic Twitter 😅", "funny", 0.8),
                ("This person tweets 200 times a day... suspicious", "skeptical", 0.9),
                ("Okay that's actually a good point", "impressed", 0.7),
                ("The ratio on this tweet is WILD", "funny", 0.8),
            ],
            'article': [
                ("Ooh interesting! Haven't heard about this before", "curious", 0.7),
                ("Wait, where are the sources for this claim?", "skeptical", 0.8),
                ("This writing style feels... off. Let me check if it's AI", "curious", 0.9),
                ("Actually really well-researched article!", "impressed", 0.8),
            ],
            'shopping': [
                ("Those reviews look fake to me 🚩", "skeptical", 0.9),
                ("You can probably find this cheaper elsewhere", "concerned", 0.7),
                ("Okay that's actually a good deal", "impressed", 0.7),
                ("100% off? Yeah that's definitely a scam 😂", "funny", 0.95),
            ],
            'video': [
                ("The thumbnail is way more dramatic than the actual content", "skeptical", 0.8),
                ("This channel posts 5 videos a day... lots of AI content", "curious", 0.8),
                ("Finally some original content!", "impressed", 0.7),
                ("I bet the comments are more interesting than the video", "funny", 0.6),
            ],
            'default': [
                ("Hmm, interesting...", "curious", 0.5),
                ("What do you think about this?", "curious", 0.5),
                ("This reminds me of something I saw yesterday", "curious", 0.6),
                ("Just making sure this looks legit", "skeptical", 0.7),
            ]
        }

    async def _vision_analyze(self, screenshot_base64: str, context: str = "") -> Optional[Dict]:
        """Use Claude Vision to analyze screenshot and generate comment"""
        if not self.anthropic_key:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 300,
                        "messages": [{
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "image/png",
                                        "data": screenshot_base64
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": f"""You're an AI companion watching the screen with your friend.
Make a brief, casual comment about what you see (1-2 sentences max).
Be observant, sometimes skeptical, sometimes curious, like a smart friend would be.
Context: {context if context else "browsing the web"}

Respond in this format:
COMMENT: [your comment]
TONE: [curious/skeptical/impressed/concerned/funny]
CONFIDENCE: [0.0-1.0]"""
                                }
                            ]
                        }]
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data['content'][0]['text']

                    import re
                    comment_match = re.search(r'COMMENT:\s*(.+?)(?=TONE:|$)', content, re.DOTALL)
                    tone_match = re.search(r'TONE:\s*(\w+)', content)
                    confidence_match = re.search(r'CONFIDENCE:\s*([\d.]+)', content)

                    return {
                        'message': comment_match.group(1).strip() if comment_match else "Interesting...",
                        'tone': tone_match.group(1) if tone_match else 'curious',
                        'confidence': float(confidence_match.group(1)) if confidence_match else 0.7
                    }

                return None

        except Exception as e:
            print(f"Vision API error: {e}")
            return None

    def _mock_comment(self, url: str = "", page_title: str = "") -> Dict:
        """Generate mock comment based on URL/title"""
        # Detect content type from URL
        url_lower = url.lower()
        title_lower = page_title.lower()

        if 'twitter.com' in url_lower or 'x.com' in url_lower:
            content_type = 'social'
        elif 'youtube.com' in url_lower or 'vimeo' in url_lower:
            content_type = 'video'
        elif 'amazon' in url_lower or 'shop' in url_lower or 'buy' in url_lower:
            content_type = 'shopping'
        elif any(word in url_lower for word in ['news', 'cnn', 'bbc', 'reuters']):
            content_type = 'news'
        elif any(word in title_lower for word in ['article', 'blog', 'story', 'guide']):
            content_type = 'article'
        else:
            content_type = 'default'

        # Pick random comment for this content type
        comments = self.mock_comments.get(content_type, self.mock_comments['default'])
        message, tone, confidence = random.choice(comments)

        return {
            'message': message,
            'tone': tone,
            'confidence': confidence
        }

    async def comment_on_screen(
        self,
        screenshot_base64: Optional[str] = None,
        url: str = "",
        page_title: str = "",
        page_text: str = ""
    ) -> CompanionComment:
        """Generate a companion comment about what's on screen"""

        # Try vision API if screenshot provided
        if screenshot_base64 and self.anthropic_key:
            context = f"URL: {url}, Title: {page_title}"
            vision_result = await self._vision_analyze(screenshot_base64, context)

            if vision_result:
                return CompanionComment(
                    message=vision_result['message'],
                    tone=vision_result['tone'],
                    confidence=vision_result['confidence']
                )

        # Fallback to mock comments
        mock_result = self._mock_comment(url, page_title)
        return CompanionComment(
            message=mock_result['message'],
            tone=mock_result['tone'],
            confidence=mock_result['confidence']
        )

    async def react_to_content(
        self,
        content_type: str,
        ai_probability: float,
        factcheck_results: list = None
    ) -> CompanionComment:
        """React to detected AI content or fact-check results"""

        # React to AI content
        if ai_probability > 0.8:
            messages = [
                "This is definitely AI-written. See how formal it is? 🤖",
                "Yep, another AI article. They're everywhere now...",
                "100% AI. I can spot these from a mile away 😅",
            ]
            return CompanionComment(
                message=random.choice(messages),
                tone="skeptical",
                confidence=0.9
            )
        elif ai_probability > 0.5:
            messages = [
                "Hmm, parts of this feel AI-generated...",
                "Mixed vibes here - some AI, some human",
                "Either AI or someone who writes very... formally 🤔",
            ]
            return CompanionComment(
                message=random.choice(messages),
                tone="curious",
                confidence=0.7
            )

        # React to fact-check results
        if factcheck_results:
            false_claims = [r for r in factcheck_results if r['verdict'] == 'FALSE']
            if false_claims:
                return CompanionComment(
                    message=f"Hold up! Found {len(false_claims)} false claim(s) in here 🚩",
                    tone="concerned",
                    confidence=0.9
                )

            misleading = [r for r in factcheck_results if r['verdict'] == 'MISLEADING']
            if misleading:
                return CompanionComment(
                    message="Some of these claims are misleading... be careful",
                    tone="skeptical",
                    confidence=0.8
                )

        # Default positive reaction
        return CompanionComment(
            message="Looks good to me! 👍",
            tone="impressed",
            confidence=0.6
        )
