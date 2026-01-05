import re
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass
import httpx
from app.config import settings

@dataclass
class Claim:
    text: str
    start_pos: int
    end_pos: int
    confidence: float

@dataclass
class FactCheckResult:
    claim: str
    verdict: str  # "TRUE", "FALSE", "MISLEADING", "UNVERIFIABLE", "NEEDS_CONTEXT"
    explanation: str
    sources: List[str]
    confidence: float

class FactChecker:
    def __init__(self):
        self.anthropic_key = settings.ANTHROPIC_API_KEY if hasattr(settings, 'ANTHROPIC_API_KEY') else None

        # Claim indicators (words/phrases that often precede factual claims)
        self.claim_indicators = [
            r'\d+%',  # Percentages
            r'\$[\d,]+',  # Dollar amounts
            r'\d{4}',  # Years
            r'\b(study|research|report|survey) (shows?|finds?|reveals?|proves?)\b',
            r'\b(according to|based on|data shows?)\b',
            r'\b(scientists?|researchers?|experts?) (say|found|discovered)\b',
            r'\b(fact|truth|proven|confirmed)\b',
            r'\b\d+ (?:million|billion|thousand)\b',  # Large numbers
        ]

    def extract_claims(self, text: str) -> List[Claim]:
        """Extract factual claims from text"""
        claims = []
        sentences = re.split(r'[.!?]+', text)

        pos = 0
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                pos += len(sentence) + 1
                continue

            # Check if sentence contains claim indicators
            confidence = 0.0
            for pattern in self.claim_indicators:
                if re.search(pattern, sentence, re.IGNORECASE):
                    confidence += 0.3

            # Must have at least one indicator
            if confidence > 0:
                confidence = min(confidence, 1.0)
                claims.append(Claim(
                    text=sentence,
                    start_pos=pos,
                    end_pos=pos + len(sentence),
                    confidence=confidence
                ))

            pos += len(sentence) + 1

        # Sort by confidence, return top 5
        claims.sort(key=lambda x: x.confidence, reverse=True)
        return claims[:5]

    async def _anthropic_fact_check(self, claim: str) -> Optional[Dict]:
        """Use Claude to fact-check a claim"""
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
                        "max_tokens": 500,
                        "messages": [{
                            "role": "user",
                            "content": f"""Fact-check this claim: "{claim}"

Respond in this exact format:
VERDICT: [TRUE/FALSE/MISLEADING/UNVERIFIABLE/NEEDS_CONTEXT]
CONFIDENCE: [0.0-1.0]
EXPLANATION: [2-3 sentence explanation]
SOURCES: [Comma-separated list of general source types, e.g., "scientific studies, government data"]"""
                        }]
                    },
                    timeout=20.0
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data['content'][0]['text']

                    # Parse response
                    verdict_match = re.search(r'VERDICT:\s*(\w+)', content)
                    confidence_match = re.search(r'CONFIDENCE:\s*([\d.]+)', content)
                    explanation_match = re.search(r'EXPLANATION:\s*(.+?)(?=SOURCES:|$)', content, re.DOTALL)
                    sources_match = re.search(r'SOURCES:\s*(.+?)$', content, re.DOTALL)

                    return {
                        'verdict': verdict_match.group(1) if verdict_match else 'UNVERIFIABLE',
                        'confidence': float(confidence_match.group(1)) if confidence_match else 0.5,
                        'explanation': explanation_match.group(1).strip() if explanation_match else '',
                        'sources': [s.strip() for s in sources_match.group(1).split(',')] if sources_match else []
                    }

                return None

        except Exception as e:
            print(f"Anthropic API error: {e}")
            return None

    def _pattern_fact_check(self, claim: str) -> Dict:
        """Pattern-based fact checking (mock when no API)"""
        claim_lower = claim.lower()

        # Known false patterns
        if any(word in claim_lower for word in ['flat earth', 'vaccines cause autism', '5g causes covid']):
            return {
                'verdict': 'FALSE',
                'confidence': 0.95,
                'explanation': 'This claim contradicts established scientific consensus.',
                'sources': ['scientific consensus', 'peer-reviewed research']
            }

        # Suspicious patterns
        if any(word in claim_lower for word in ['they dont want you to know', 'secret cure', 'doctors hate']):
            return {
                'verdict': 'MISLEADING',
                'confidence': 0.85,
                'explanation': 'This claim uses language typical of misinformation.',
                'sources': ['pattern analysis']
            }

        # Statistical claims without source
        if re.search(r'\d+%', claim_lower) and not re.search(r'according to|study|research', claim_lower):
            return {
                'verdict': 'NEEDS_CONTEXT',
                'confidence': 0.7,
                'explanation': 'Statistical claim without cited source. Verification needed.',
                'sources': ['claim analysis']
            }

        # Default: unverifiable
        return {
            'verdict': 'UNVERIFIABLE',
            'confidence': 0.5,
            'explanation': 'Unable to verify this claim without additional context or sources.',
            'sources': ['automated analysis']
        }

    async def check_claim(self, claim: str) -> FactCheckResult:
        """Fact-check a single claim"""
        # Try API first
        api_result = await self._anthropic_fact_check(claim)

        if api_result:
            return FactCheckResult(
                claim=claim,
                verdict=api_result['verdict'],
                explanation=api_result['explanation'],
                sources=api_result['sources'],
                confidence=api_result['confidence']
            )

        # Fallback to pattern-based
        pattern_result = self._pattern_fact_check(claim)
        return FactCheckResult(
            claim=claim,
            verdict=pattern_result['verdict'],
            explanation=pattern_result['explanation'],
            sources=pattern_result['sources'],
            confidence=pattern_result['confidence']
        )

    async def check_text(self, text: str) -> List[FactCheckResult]:
        """Extract and fact-check all claims in text"""
        claims = self.extract_claims(text)

        if not claims:
            return []

        # Check all claims concurrently
        results = await asyncio.gather(*[
            self.check_claim(claim.text)
            for claim in claims
        ])

        return results
