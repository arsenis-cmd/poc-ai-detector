import base64
import hashlib
import io
from typing import Dict, Optional
from dataclasses import dataclass
from PIL import Image
from PIL.ExifTags import TAGS
import numpy as np

@dataclass
class ImageDetectionResult:
    classification: str
    ai_probability: float
    confidence: float
    scores: Dict[str, float]
    content_hash: str
    reason: Optional[str] = None

class ImageDetector:
    def __init__(self):
        # Known AI generation software signatures
        self.ai_software = [
            'dall-e', 'dalle', 'midjourney', 'mj', 'stable diffusion', 'sd',
            'comfyui', 'automatic1111', 'invoke', 'leonardo', 'nightcafe',
            'artbreeder', 'runway', 'firefly', 'adobe firefly', 'imagen',
            'stability', 'novelai', 'nai', 'craiyon', 'dreamstudio'
        ]
        
        # Camera manufacturers (indicates real photo)
        self.camera_makers = [
            'apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oppo', 'vivo',
            'canon', 'nikon', 'sony', 'fujifilm', 'panasonic', 'olympus',
            'leica', 'hasselblad', 'pentax', 'gopro', 'dji'
        ]
    
    async def detect(self, image_data: str) -> ImageDetectionResult:
        """Detect if image is AI-generated"""
        
        # Decode image
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            content_hash = hashlib.sha256(image_bytes).hexdigest()
            image = Image.open(io.BytesIO(image_bytes))
            
        except Exception as e:
            return ImageDetectionResult(
                classification="UNCERTAIN",
                ai_probability=0.5,
                confidence=0.0,
                scores={},
                content_hash="",
                reason=f"Failed to decode: {e}"
            )
        
        # Analyze metadata
        metadata_result = self._analyze_metadata(image)
        
        # If AI software detected in metadata, high confidence
        if metadata_result.get('ai_detected'):
            return ImageDetectionResult(
                classification="AI",
                ai_probability=0.98,
                confidence=0.99,
                scores={'metadata': 0.98},
                content_hash=content_hash,
                reason=f"AI software in metadata: {metadata_result.get('software')}"
            )
        
        # If camera detected, likely human
        if metadata_result.get('camera_detected'):
            return ImageDetectionResult(
                classification="HUMAN",
                ai_probability=0.1,
                confidence=0.85,
                scores={'metadata': 0.1},
                content_hash=content_hash,
                reason=f"Camera detected: {metadata_result.get('camera')}"
            )
        
        # Analyze image properties
        properties_result = self._analyze_properties(image)
        
        # Combine scores
        combined = self._combine_scores(metadata_result, properties_result)
        combined.content_hash = content_hash
        
        return combined
    
    def _analyze_metadata(self, image: Image.Image) -> Dict:
        """Analyze EXIF metadata"""
        result = {
            'ai_detected': False,
            'camera_detected': False,
            'has_gps': False,
            'has_timestamp': False,
            'software': None,
            'camera': None,
            'score': 0.5
        }
        
        try:
            exif = image._getexif()
            if not exif:
                return result
            
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                value_str = str(value).lower() if value else ""
                
                if tag == 'Make':
                    result['camera'] = value
                    if any(maker in value_str for maker in self.camera_makers):
                        result['camera_detected'] = True
                        result['score'] = 0.15
                
                if tag == 'Model':
                    result['camera_model'] = value
                
                if tag == 'Software':
                    result['software'] = value
                    if any(ai in value_str for ai in self.ai_software):
                        result['ai_detected'] = True
                        result['score'] = 0.95
                
                if tag == 'GPSInfo':
                    result['has_gps'] = True
                    if not result['ai_detected']:
                        result['score'] = max(result['score'] - 0.15, 0.1)
                
                if tag == 'DateTimeOriginal':
                    result['has_timestamp'] = True
                    if not result['ai_detected']:
                        result['score'] = max(result['score'] - 0.05, 0.1)
        
        except Exception:
            pass
        
        return result
    
    def _analyze_properties(self, image: Image.Image) -> Dict:
        """Analyze image properties for AI signatures"""
        result = {'score': 0.5}
        
        try:
            # Convert to array
            img_array = np.array(image.convert('RGB'))
            
            # Check for unusual dimensions (AI often uses specific sizes)
            width, height = image.size
            ai_sizes = [
                (512, 512), (768, 768), (1024, 1024),
                (512, 768), (768, 512), (1024, 768), (768, 1024),
                (1920, 1080), (1080, 1920)
            ]
            
            if (width, height) in ai_sizes:
                result['score'] += 0.1
                result['ai_size'] = True
            
            # Check color distribution
            # AI images often have unusual color patterns
            r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
            
            # Very uniform color distribution can indicate AI
            r_std = np.std(r)
            g_std = np.std(g)
            b_std = np.std(b)
            
            avg_std = (r_std + g_std + b_std) / 3
            
            if avg_std < 30:  # Very uniform
                result['score'] += 0.15
                result['uniform_colors'] = True
            elif avg_std > 80:  # High variance (natural photos)
                result['score'] -= 0.1
            
            # Ensure score is in range
            result['score'] = max(min(result['score'], 1.0), 0.0)
            
        except Exception:
            pass
        
        return result
    
    def _combine_scores(self, metadata: Dict, properties: Dict) -> ImageDetectionResult:
        """Combine analysis results"""
        
        # Weighted combination
        metadata_weight = 0.7
        properties_weight = 0.3
        
        combined_score = (
            metadata_weight * metadata['score'] +
            properties_weight * properties['score']
        )
        
        # Classification
        if combined_score >= 0.8:
            classification = "AI"
        elif combined_score >= 0.6:
            classification = "LIKELY_AI"
        elif combined_score >= 0.4:
            classification = "UNCERTAIN"
        elif combined_score >= 0.2:
            classification = "LIKELY_HUMAN"
        else:
            classification = "HUMAN"
        
        # Confidence based on available data
        confidence = 0.5
        if metadata.get('ai_detected') or metadata.get('camera_detected'):
            confidence = 0.9
        elif metadata.get('has_gps') or metadata.get('has_timestamp'):
            confidence = 0.7
        
        return ImageDetectionResult(
            classification=classification,
            ai_probability=round(combined_score, 4),
            confidence=round(confidence, 4),
            scores={
                'metadata': round(metadata['score'], 4),
                'properties': round(properties['score'], 4)
            },
            content_hash=""
        )

image_detector = ImageDetector()
