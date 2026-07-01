"""
Wealth Insights endpoints — the "local processing" layer.

This is where spending pattern analysis, risk profiling, and investment
recommendations get computed BEFORE anything touches the LLM. Keeps
sensitive computation local; only sanitized outputs get passed downstream.
"""

from fastapi import APIRouter
from app.schemas.insights import InsightsRequest, InsightsResponse

router = APIRouter()


@router.post("/analyze", response_model=InsightsResponse)
def analyze_spending(request: InsightsRequest):
    """
    Takes raw (synthetic) transaction data for a user,
    returns anonymized spending insights + recommendations.

    TODO:
    - Load synthetic transaction dataset (from IDBI sandbox)
    - Compute spending category breakdown
    - Compute simple risk profile / investment suggestion
    - Strip any PII before returning
    """
    return InsightsResponse(
        summary="[stub] Spending analysis pending implementation.",
        recommendations=[],
    )
