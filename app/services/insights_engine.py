"""
Insights Engine — the local processing layer (privacy-first core).

This module does ALL sensitive computation locally:
  - spending category breakdown
  - savings rate & cash-flow analysis
  - fixed-obligation ratio (EMI/rent burden)
  - investment behavior profiling
  - rule-based recommendations

Its output is an ANONYMIZED insights dict — no names, account numbers,
or transaction IDs — which is the ONLY thing ever passed to the LLM layer.
"""

import json
from collections import defaultdict
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "synthetic_transactions.json"

# Categories considered "essential" vs "discretionary" for spend analysis
ESSENTIAL_CATEGORIES = {"Groceries", "Utilities", "Healthcare", "Rent", "EMI", "Transport"}
DISCRETIONARY_CATEGORIES = {"Food & Dining", "Shopping", "Entertainment"}


def load_dataset() -> dict:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. Run: python -m app.services.data_generator"
        )
    with open(DATA_PATH) as f:
        return json.load(f)


def get_user_ids() -> list[str]:
    return list(load_dataset().keys())


def analyze_user(user_id: str, lookback_days: int = 90) -> dict:
    """
    Compute anonymized financial insights for a user.
    Returns a dict safe to pass to the LLM layer (no PII).
    """
    dataset = load_dataset()
    if user_id not in dataset:
        raise KeyError(f"Unknown user_id: {user_id}")

    user = dataset[user_id]
    txns = user["transactions"]
    profile = user["profile"]

    # ------------------------------------------------------------------
    # Aggregations
    # ------------------------------------------------------------------
    total_credit = 0.0
    total_debit = 0.0
    salary_credits: list[float] = []
    category_spend: dict[str, float] = defaultdict(float)
    investment_total = 0.0
    months_seen = set()

    for t in txns:
        months_seen.add(t["date"][:7])  # YYYY-MM
        if t["type"] == "CREDIT":
            total_credit += t["amount"]
            if t["category"] == "Salary":
                salary_credits.append(t["amount"])
        else:
            total_debit += t["amount"]
            category_spend[t["category"]] += t["amount"]
            if t["category"] == "Investment":
                investment_total += t["amount"]

    n_months = max(len(months_seen), 1)
    monthly_income = (sum(salary_credits) / len(salary_credits)) if salary_credits else 0
    monthly_spend = (total_debit - investment_total) / n_months
    monthly_investment = investment_total / n_months

    # ------------------------------------------------------------------
    # Ratios
    # ------------------------------------------------------------------
    savings_rate = 0.0
    investment_rate = 0.0
    if monthly_income > 0:
        savings_rate = round((monthly_income - monthly_spend) / monthly_income * 100, 1)
        investment_rate = round(monthly_investment / monthly_income * 100, 1)

    fixed_monthly = (category_spend.get("EMI", 0) + category_spend.get("Rent", 0)) / n_months
    fixed_obligation_ratio = round(fixed_monthly / monthly_income * 100, 1) if monthly_income else 0.0

    essential_spend = sum(v for k, v in category_spend.items() if k in ESSENTIAL_CATEGORIES) / n_months
    discretionary_spend = sum(v for k, v in category_spend.items() if k in DISCRETIONARY_CATEGORIES) / n_months

    # Top spend categories (monthly average), excluding investments
    top_categories = sorted(
        ((k, round(v / n_months)) for k, v in category_spend.items() if k != "Investment"),
        key=lambda x: x[1],
        reverse=True,
    )[:5]

    # ------------------------------------------------------------------
    # Risk / investor profiling (simple rule-based, explainable)
    # ------------------------------------------------------------------
    age = profile["age"]
    if investment_rate < 5:
        investor_type = "Under-invested"
    elif investment_rate < 12:
        investor_type = "Moderate investor"
    else:
        investor_type = "Active investor"

    # Age-based equity guidance (classic 100-minus-age heuristic)
    suggested_equity_pct = max(100 - age, 40)

    # ------------------------------------------------------------------
    # Rule-based recommendations (transparent + explainable — important
    # for banking context; the LLM only rephrases these conversationally)
    # ------------------------------------------------------------------
    recommendations: list[str] = []

    if savings_rate < 20:
        recommendations.append(
            f"Savings rate is {savings_rate}%, below the recommended 20%. "
            f"Reducing discretionary spending (currently ~INR {round(discretionary_spend):,}/month) could free up funds."
        )
    if investment_rate < 10 and savings_rate > 10:
        surplus = round(monthly_income * (savings_rate - investment_rate * 100 / 100) / 100)
        recommendations.append(
            f"Investment rate is only {investment_rate}% of income while savings exist. "
            f"Consider starting/increasing SIP allocation — even INR 5,000/month more compounds significantly."
        )
    if fixed_obligation_ratio > 40:
        recommendations.append(
            f"Fixed obligations (EMI/rent) are {fixed_obligation_ratio}% of income — above the healthy 40% ceiling. "
            "Avoid new loans; consider prepayment options when possible."
        )
    if discretionary_spend > essential_spend:
        recommendations.append(
            "Discretionary spending exceeds essential spending — a 50/30/20 budget review is advisable."
        )
    if investor_type == "Active investor" and age >= 40:
        recommendations.append(
            f"Given age {age}, review portfolio allocation — suggested equity exposure around {suggested_equity_pct}% "
            "with the remainder in debt/hybrid instruments."
        )
    if not recommendations:
        recommendations.append(
            "Financial health looks balanced. Consider tax-saving instruments (ELSS/PPF) and periodic portfolio review."
        )

    # ------------------------------------------------------------------
    # Anonymized output — NOTE: no name, no account no, no txn IDs
    # ------------------------------------------------------------------
    return {
        "user_segment": profile["alias"],       # behavioral segment label, not identity
        "age_band": f"{(age // 10) * 10}s",     # e.g. "20s" — banded, not exact
        "period_months": n_months,
        "monthly_income_band": _to_band(monthly_income),
        "monthly_spend": round(monthly_spend),
        "monthly_investment": round(monthly_investment),
        "savings_rate_pct": savings_rate,
        "investment_rate_pct": investment_rate,
        "fixed_obligation_ratio_pct": fixed_obligation_ratio,
        "essential_spend_monthly": round(essential_spend),
        "discretionary_spend_monthly": round(discretionary_spend),
        "top_spend_categories": [{"category": c, "monthly_avg": a} for c, a in top_categories],
        "investor_type": investor_type,
        "suggested_equity_allocation_pct": suggested_equity_pct,
        "recommendations": recommendations,
    }


def _to_band(amount: float) -> str:
    """Convert exact income to a band — extra anonymization before LLM."""
    if amount < 50000:
        return "under-50k"
    if amount < 100000:
        return "50k-1L"
    if amount < 200000:
        return "1L-2L"
    return "2L+"


if __name__ == "__main__":
    # quick manual test
    for uid in get_user_ids():
        print(f"\n===== {uid} =====")
        print(json.dumps(analyze_user(uid), indent=2))
