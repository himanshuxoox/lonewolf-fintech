from pydantic import BaseModel
from typing import List


class InsightsRequest(BaseModel):
    user_id: str
    # transactions will likely come from the synthetic dataset provided
    # by the sandbox rather than the request body — placeholder for now
    lookback_days: int = 30


class InsightsResponse(BaseModel):
    summary: str
    recommendations: List[str]
