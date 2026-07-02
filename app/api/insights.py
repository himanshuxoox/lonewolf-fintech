"""
Wealth Insights endpoints — the "local processing" layer.

All sensitive computation happens here via insights_engine. Output is
anonymized (income bands, age bands, behavioral segments) — this is the
only data that ever reaches the LLM layer.
"""

from fastapi import APIRouter, HTTPException
from app.schemas.insights import InsightsRequest, InsightsResponse
from app.services import insights_engine

router = APIRouter()


@router.get("/users")
def list_demo_users():
    """List available demo user IDs (from synthetic dataset)."""
    try:
        return {"users": insights_engine.get_user_ids()}
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=InsightsResponse)
def analyze_spending(request: InsightsRequest):
    """
    Analyze a user's (synthetic) transactions and return anonymized
    spending insights + rule-based recommendations.
    """
    try:
        result = insights_engine.analyze_user(request.user_id, request.lookback_days)
        return result
    except KeyError:
        raise HTTPException(status_code=404, detail=f"User '{request.user_id}' not found")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
