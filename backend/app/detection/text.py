import re
import hashlib
import asyncio
from typing import Dict, Tuple
from dataclasses import dataclass
import httpx
import numpy as np
from app.config import settings

@dataclass
class TextDetectionResult:
    classification: str
    ai_probability: float
    confidence: float
    scores: Dict[str, float]
    content_hash: str

class TextDetector:
    def __init__(self):
        self.api_key = settings.GPTZERO_API_KEY
        
        # AI writing patterns with weights
        self.ai_patterns = {
            # High confidence AI indicators
            'as_an_ai': (r'\b(as an ai|as an artificial intelligence)\b', 0.9),
            'i_cannot': (r"\bi (?:cannot|can't|am unable to) (?:provide|assist|help with)\b", 0.7),
            'i_dont_have': (r"\bi (?:don't|do not) have (?:access|the ability)\b", 0.6),
            
            # Medium confidence indicators
            'delve': (r'\bdelve(?:s|d)?\b', 0.4),
            'utilize': (r'\butilize(?:s|d)?\b', 0.3),
            'facilitate': (r'\bfacilitate(?:s|d)?\b', 0.3),
            'leverage': (r'\bleverage(?:s|d)?\b', 0.25),
            'robust': (r'\brobust\b', 0.2),
            'comprehensive': (r'\bcomprehensive\b', 0.2),
            'furthermore': (r'\bfurthermore\b', 0.2),
            'moreover': (r'\bmoreover\b', 0.2),
            'additionally': (r'\badditionally\b', 0.15),
            'certainly': (r'\bcertainly\b', 0.15),
            'absolutely': (r'\babsolutely\b', 0.1),
            
            # Structural patterns
            'in_conclusion': (r'\bin conclusion\b', 0.2),
            'it_is_important': (r"\bit(?:'s| is) (?:important|worth noting|crucial)\b", 0.25),
            'lets_explore': (r"\blet(?:'s| us) (?:explore|dive|delve)\b", 0.3),
            
            # List starters (AI loves lists)
            'numbered_list': (r'^\s*\d+[\.\)]\s', 0.1),
            'bullet_list': (r'^\s*[\-\*•]\s', 0.1),
        }
        
        # Human indicators (reduce AI score)
        self.human_patterns = {
            'typos': (r'\b(teh|recieve|occured|seperate|definately)\b', -0.3),
            'slang': (r'\b(gonna|wanna|gotta|kinda|sorta|ya|yep|nope|lol|lmao|omg)\b', -0.25),
            'contractions': (r"\b(i'm|you're|we're|they're|isn't|aren't|won't|can't|couldn't|wouldn't)\b", -0.1),
            'fillers': (r'\b(um|uh|hmm|well|like|you know|i mean)\b', -0.2),
            'personal': (r'\b(i think|i feel|i believe|in my opinion|personally)\b', -0.15),
            'exclamations': (r'[!]{2,}', -0.1),
            'ellipsis': (r'\.{3,}', -0.1),
            'informal_caps': (r'\b[A-Z]{2,}\b', -0.05),
        }
    
    async def detect(self, text: str, source_platform: str = None) -> TextDetectionResult:
        """Main detection method"""
        
        # Generate content hash
        content_hash = hashlib.sha256(text.encode()).hexdigest()
        
        # Quick validation
        word_count = len(text.split())
        if word_count < 5:
            return TextDetectionResult(
                classification="UNCERTAIN",
                ai_probability=0.5,
                confidence=0.2,
                scores={},
                content_hash=content_hash
            )
        
        # Run detection methods in parallel
        # Try Hugging Face first (free), falls back to GPTZero if needed
        api_task = self._huggingface_detect(text)
        pattern_task = asyncio.to_thread(self._pattern_analysis, text)

        api_result, pattern_result = await asyncio.gather(
            api_task, pattern_task
        )
        
        # Combine scores
        final_result = self._combine_scores(
            api_result,
            pattern_result,
            word_count,
            source_platform
        )
        final_result.content_hash = content_hash
        
        return final_result
    
    async def _huggingface_detect(self, text: str) -> Dict:
        """Call Hugging Face Inference API (FREE!)"""

        # Try multiple models in order of preference
        models_to_try = [
            "roberta-large-openai-detector",  # Larger OpenAI detector
            "andreas122001/roberta-large-finetuned-ai-detection",  # Community model
            "distilbert-base-uncased",  # Generic model as last resort
        ]

        for model in models_to_try:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"https://api-inference.huggingface.co/models/{model}",
                        headers={
                            "Content-Type": "application/json"
                        },
                        json={"inputs": text[:512]},  # Limit to 512 chars for speed
                        timeout=15.0
                    )

                    if response.status_code == 200:
                        data = response.json()

                        # Handle different response formats
                        if isinstance(data, list) and len(data) > 0:
                            # Classification model response
                            if isinstance(data[0], list):
                                # Format: [[{"label": "LABEL_0", "score": 0.99}]]
                                for item in data[0]:
                                    if item.get('label') in ['Fake', 'LABEL_1', 'AI', 'Generated']:
                                        return {
                                            'ai_probability': item.get('score', 0.5),
                                            'available': True,
                                            'source': f'huggingface:{model}'
                                        }
                                    elif item.get('label') in ['Real', 'LABEL_0', 'Human', 'Original']:
                                        return {
                                            'ai_probability': 1 - item.get('score', 0.5),
                                            'available': True,
                                            'source': f'huggingface:{model}'
                                        }

                        # If response looks like it's still loading
                        if isinstance(data, dict) and 'error' in data:
                            if 'loading' in data['error'].lower():
                                continue  # Try next model

                    # Model failed, try next one
                    continue

            except Exception as e:
                print(f"Hugging Face model {model} error: {e}")
                continue

        # All models failed, use pattern matching only
        print("All Hugging Face models failed, using pattern matching only")
        return {'ai_probability': None, 'available': False}

    async def _gptzero_detect(self, text: str) -> Dict:
        """Call GPTZero API (PAID - Fallback only)"""
        if not self.api_key:
            return {'ai_probability': None, 'available': False}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.gptzero.me/v2/predict/text",
                    headers={
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={"document": text},
                    timeout=15.0
                )

                if response.status_code == 200:
                    data = response.json()
                    doc = data.get('documents', [{}])[0]
                    return {
                        'ai_probability': doc.get('completely_generated_prob', 0.5),
                        'mixed_probability': doc.get('average_generated_prob', 0.5),
                        'available': True,
                        'source': 'gptzero'
                    }
                else:
                    return {'ai_probability': None, 'available': False}

        except Exception as e:
            print(f"GPTZero API error: {e}")
            return {'ai_probability': None, 'available': False}
    
    def _pattern_analysis(self, text: str) -> Dict:
        """Analyze text for AI/human patterns"""
        text_lower = text.lower()
        word_count = len(text.split())
        
        ai_score = 0
        matches = []
        
        # Check AI patterns
        for name, (pattern, weight) in self.ai_patterns.items():
            found = re.findall(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
            if found:
                count = len(found)
                score = min(count * weight, weight * 3)  # Cap at 3x
                ai_score += score
                matches.append({'pattern': name, 'count': count, 'score': score})
        
        # Check human patterns (reduce score)
        for name, (pattern, weight) in self.human_patterns.items():
            found = re.findall(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
            if found:
                count = len(found)
                score = count * weight  # Negative weight
                ai_score += score
                matches.append({'pattern': name, 'count': count, 'score': score})
        
        # Normalize by word count
        normalized_score = ai_score / (word_count / 50)  # Per 50 words
        
        # Calculate sentence variance (burstiness)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        if len(sentences) >= 3:
            lengths = [len(s.split()) for s in sentences]
            variance = np.std(lengths) / (np.mean(lengths) + 1)
            # Low variance = more AI-like
            variance_score = 1 - min(variance / 0.8, 1)
        else:
            variance_score = 0.5
        
        return {
            'pattern_score': min(max(normalized_score, 0), 1),
            'variance_score': variance_score,
            'matches': matches
        }
    
    def _combine_scores(
        self,
        api_result: Dict,
        patterns: Dict,
        word_count: int,
        platform: str = None
    ) -> TextDetectionResult:
        """Combine all signals into final classification"""

        scores = {}

        # Weight distribution
        if api_result.get('available') and api_result.get('ai_probability') is not None:
            # API available (Hugging Face or GPTZero): 65% API, 25% patterns, 10% variance
            api_score = api_result['ai_probability']
            pattern_score = patterns['pattern_score']
            variance_score = patterns['variance_score']

            combined = (
                0.65 * api_score +
                0.25 * pattern_score +
                0.10 * variance_score
            )

            scores['api'] = api_score
            scores['api_source'] = api_result.get('source', 'unknown')
            scores['patterns'] = pattern_score
            scores['variance'] = variance_score

            # Higher confidence when API is available
            base_confidence = 0.85
        else:
            # Fallback: 70% patterns, 30% variance
            pattern_score = patterns['pattern_score']
            variance_score = patterns['variance_score']
            
            combined = (
                0.70 * pattern_score +
                0.30 * variance_score
            )
            
            scores['patterns'] = pattern_score
            scores['variance'] = variance_score
            
            # Lower confidence without GPTZero
            base_confidence = 0.60
        
        # Adjust confidence based on text length
        length_factor = min(word_count / 100, 1)  # Full confidence at 100+ words
        confidence = base_confidence * (0.5 + 0.5 * length_factor)
        
        # Platform adjustments
        if platform == 'twitter':
            # Twitter has more bots, slightly increase AI probability
            combined = combined * 1.1
            combined = min(combined, 0.99)
        
        # Classification thresholds
        if combined >= 0.85:
            classification = "AI"
        elif combined >= 0.65:
            classification = "LIKELY_AI"
        elif combined >= 0.45:
            classification = "MIXED"
        elif combined >= 0.25:
            classification = "LIKELY_HUMAN"
        else:
            classification = "HUMAN"
        
        return TextDetectionResult(
            classification=classification,
            ai_probability=round(combined, 4),
            confidence=round(confidence, 4),
            scores={k: round(v, 4) for k, v in scores.items()},
            content_hash=""
        )
    
    async def detect_batch(self, texts: list) -> list:
        """Detect multiple texts in parallel"""
        tasks = [self.detect(t['content'], t.get('source_platform')) for t in texts]
        return await asyncio.gather(*tasks)
    
    def is_likely_bot(self, result: TextDetectionResult, tweet_metadata: Dict = None) -> bool:
        """Determine if content is likely from a bot account"""
        
        # High AI probability is a strong signal
        if result.ai_probability >= 0.8:
            return True
        
        if tweet_metadata:
            # Check for bot indicators in metadata
            username = tweet_metadata.get('username', '')
            
            # Random-looking usernames
            if re.match(r'^[a-z]+\d{5,}$', username.lower()):
                return True
            
            # Default profile indicators
            if tweet_metadata.get('default_profile', False):
                return True
            
            # Very new account with high activity
            # (would need account age data)
        
        return result.ai_probability >= 0.7

text_detector = TextDetector()
