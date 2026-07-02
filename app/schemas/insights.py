from pydantic import BaseModel
from typing import List


class InsightsRequest(BaseModel):
    user_id: str
    lookback_days: int = 90


class SpendCategory(BaseModel):
    category: str
    monthly_avg: int


class InsightsResponse(BaseModel):
    user_segment: str
    age_band: str
    period_months: int
    monthly_income_band: str
    monthly_spend: int
    monthly_investment: int
    savings_rate_pct: float
    investment_rate_pct: float
    fixed_obligation_ratio_pct: float
    essential_spend_monthly: int
    discretionary_spend_monthly: int
    top_spend_categories: List[SpendCategory]
    investor_type: str
    suggested_equity_allocation_pct: int
    recommendations: List[str]
