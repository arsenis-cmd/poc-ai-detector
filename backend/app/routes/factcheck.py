from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.detection.factcheck import FactChecker, FactCheckResult

router = APIRouter(prefix="/api/v1/factcheck", tags=["factcheck"])
fact_checker = FactChecker()

class FactCheckRequest(BaseModel):
    text: str
    claims: Optional[List[str]] = None  # Optional: check specific claims

class FactCheckResponse(BaseModel):
    results: List[dict]
    total_claims: int
    false_count: int
    misleading_count: int
    summary: str

@router.post("/", response_model=FactCheckResponse)
async def fact_check_text(request: FactCheckRequest):
    """
    Fact-check text content
    - Automatically extracts factual claims
    - Verifies each claim
    - Returns verdicts with explanations
    """
    try:
        if request.claims:
            # Check specific claims provided by user
            results = []
            for claim in request.claims:
                result = await fact_checker.check_claim(claim)
                results.append(result)
        else:
            # Auto-extract and check claims from text
            results = await fact_checker.check_text(request.text)

        # Count verdicts
        false_count = sum(1 for r in results if r.verdict == "FALSE")
        misleading_count = sum(1 for r in results if r.verdict == "MISLEADING")

        # Generate summary
        if not results:
            summary = "No factual claims detected."
        elif false_count > 0:
            summary = f"⚠️ Found {false_count} false claim(s). Be cautious!"
        elif misleading_count > 0:
            summary = f"🟡 Found {misleading_count} misleading claim(s). Needs context."
        else:
            summary = "✓ No obvious false claims detected."

        return FactCheckResponse(
            results=[{
                'claim': r.claim,
                'verdict': r.verdict,
                'explanation': r.explanation,
                'sources': r.sources,
                'confidence': r.confidence
            } for r in results],
            total_claims=len(results),
            false_count=false_count,
            misleading_count=misleading_count,
            summary=summary
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fact-check failed: {str(e)}")


@router.post("/claim", response_model=dict)
async def fact_check_claim(claim: str):
    """
    Fact-check a single claim
    """
    try:
        result = await fact_checker.check_claim(claim)

        return {
            'claim': result.claim,
            'verdict': result.verdict,
            'explanation': result.explanation,
            'sources': result.sources,
            'confidence': result.confidence
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claim check failed: {str(e)}")
