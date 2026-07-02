"""
Synthetic transaction data generator.

Generates realistic Indian banking transactions (UPI, NEFT, salary, EMI,
groceries, etc.) for 3 demo user profiles. This stands in for the IDBI
sandbox dataset — when that arrives, only the loader changes, the
insights engine stays the same.

Run:  python -m app.services.data_generator
Output: data/synthetic_transactions.json
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)  # reproducible demo data

OUTPUT_PATH = Path(__file__).resolve().parents[2] / "data" / "synthetic_transactions.json"

# ---------------------------------------------------------------------------
# Transaction templates: (category, description, min_amt, max_amt, channel)
# ---------------------------------------------------------------------------

DEBIT_TEMPLATES = [
    ("Food & Dining", "SWIGGY ORDER", 150, 600, "UPI"),
    ("Food & Dining", "ZOMATO ORDER", 150, 700, "UPI"),
    ("Food & Dining", "RESTAURANT PAYMENT", 400, 2500, "UPI"),
    ("Groceries", "BLINKIT", 200, 1500, "UPI"),
    ("Groceries", "BIGBASKET", 500, 3000, "UPI"),
    ("Groceries", "LOCAL KIRANA STORE", 100, 800, "UPI"),
    ("Transport", "UBER RIDE", 100, 500, "UPI"),
    ("Transport", "OLA RIDE", 100, 450, "UPI"),
    ("Transport", "METRO CARD RECHARGE", 200, 500, "UPI"),
    ("Transport", "PETROL PUMP", 500, 2000, "CARD"),
    ("Shopping", "AMAZON PURCHASE", 300, 5000, "CARD"),
    ("Shopping", "FLIPKART PURCHASE", 300, 4000, "CARD"),
    ("Shopping", "MYNTRA PURCHASE", 500, 3000, "CARD"),
    ("Entertainment", "NETFLIX SUBSCRIPTION", 199, 649, "CARD"),
    ("Entertainment", "SPOTIFY PREMIUM", 119, 119, "CARD"),
    ("Entertainment", "BOOKMYSHOW TICKETS", 300, 1200, "UPI"),
    ("Utilities", "ELECTRICITY BILL BSES", 800, 3500, "NETBANKING"),
    ("Utilities", "MOBILE RECHARGE JIO", 239, 999, "UPI"),
    ("Utilities", "BROADBAND BILL AIRTEL", 499, 1499, "NETBANKING"),
    ("Healthcare", "APOLLO PHARMACY", 150, 1200, "UPI"),
    ("Healthcare", "1MG ORDER", 200, 1500, "UPI"),
    ("EMI", "HOME LOAN EMI", 18000, 18000, "AUTO_DEBIT"),
    ("EMI", "PERSONAL LOAN EMI", 8500, 8500, "AUTO_DEBIT"),
    ("Rent", "HOUSE RENT TRANSFER", 15000, 15000, "NEFT"),
]

CREDIT_TEMPLATES = [
    ("Salary", "SALARY CREDIT", None, None, "NEFT"),  # amount set per profile
    ("Refund", "AMAZON REFUND", 200, 1500, "UPI"),
    ("Cashback", "UPI CASHBACK", 10, 100, "UPI"),
    ("Interest", "SAVINGS INTEREST CREDIT", 150, 600, "AUTO_CREDIT"),
]

INVESTMENT_TEMPLATES = [
    ("Investment", "SIP MUTUAL FUND", None, None, "AUTO_DEBIT"),  # per profile
    ("Investment", "PPF DEPOSIT", 1000, 5000, "NETBANKING"),
    ("Investment", "FD CREATION", 10000, 50000, "NETBANKING"),
]

# ---------------------------------------------------------------------------
# Demo user profiles — three distinct financial personalities so the
# insights engine has something interesting to differentiate.
# ---------------------------------------------------------------------------

PROFILES = {
    "user_001": {
        "name_alias": "Young Professional (High Spender)",
        "age": 26,
        "monthly_salary": 85000,
        "sip_amount": 2000,          # under-invests
        "spend_multiplier": 1.5,     # spends heavily
        "has_home_loan": False,
        "has_personal_loan": True,
        "pays_rent": True,
    },
    "user_002": {
        "name_alias": "Mid-career Balanced Saver",
        "age": 34,
        "monthly_salary": 150000,
        "sip_amount": 15000,
        "spend_multiplier": 1.0,
        "has_home_loan": True,
        "has_personal_loan": False,
        "pays_rent": False,
    },
    "user_003": {
        "name_alias": "Conservative Low-risk Saver",
        "age": 45,
        "monthly_salary": 120000,
        "sip_amount": 5000,          # invests but too conservative (FD-heavy)
        "spend_multiplier": 0.7,
        "has_home_loan": True,
        "has_personal_loan": False,
        "pays_rent": False,
    },
}

MONTHS_OF_HISTORY = 3


def _random_time() -> str:
    return f"{random.randint(8, 22):02d}:{random.randint(0, 59):02d}:{random.randint(0, 59):02d}"


def generate_user_transactions(user_id: str, profile: dict) -> list[dict]:
    txns: list[dict] = []
    today = datetime.now()
    txn_counter = 0

    for month_offset in range(MONTHS_OF_HISTORY, 0, -1):
        month_start = (today.replace(day=1) - timedelta(days=30 * (month_offset - 1))).replace(day=1)

        # --- Salary on 1st ---
        txn_counter += 1
        txns.append({
            "txn_id": f"{user_id}_txn_{txn_counter:04d}",
            "date": month_start.strftime("%Y-%m-%d"),
            "time": "09:15:00",
            "description": "SALARY CREDIT",
            "category": "Salary",
            "type": "CREDIT",
            "amount": profile["monthly_salary"],
            "channel": "NEFT",
        })

        # --- Fixed obligations ---
        fixed: list[tuple[str, str, int, str, int]] = []
        if profile["pays_rent"]:
            fixed.append(("Rent", "HOUSE RENT TRANSFER", 15000, "NEFT", 2))
        if profile["has_home_loan"]:
            fixed.append(("EMI", "HOME LOAN EMI", 18000, "AUTO_DEBIT", 5))
        if profile["has_personal_loan"]:
            fixed.append(("EMI", "PERSONAL LOAN EMI", 8500, "AUTO_DEBIT", 5))
        if profile["sip_amount"] > 0:
            fixed.append(("Investment", "SIP MUTUAL FUND", profile["sip_amount"], "AUTO_DEBIT", 7))

        for category, desc, amount, channel, day in fixed:
            txn_counter += 1
            txns.append({
                "txn_id": f"{user_id}_txn_{txn_counter:04d}",
                "date": (month_start + timedelta(days=day - 1)).strftime("%Y-%m-%d"),
                "time": "06:00:00",
                "description": desc,
                "category": category,
                "type": "DEBIT",
                "amount": amount,
                "channel": channel,
            })

        # --- Variable spending through the month ---
        n_txns = int(random.randint(25, 40) * profile["spend_multiplier"])
        for _ in range(n_txns):
            category, desc, lo, hi, channel = random.choice(DEBIT_TEMPLATES)
            if category in ("EMI", "Rent"):  # already handled as fixed
                continue
            txn_counter += 1
            txns.append({
                "txn_id": f"{user_id}_txn_{txn_counter:04d}",
                "date": (month_start + timedelta(days=random.randint(0, 27))).strftime("%Y-%m-%d"),
                "time": _random_time(),
                "description": desc,
                "category": category,
                "type": "DEBIT",
                "amount": round(random.uniform(lo, hi) * profile["spend_multiplier"]),
                "channel": channel,
            })

        # --- Occasional credits ---
        for _ in range(random.randint(1, 3)):
            category, desc, lo, hi, channel = random.choice(CREDIT_TEMPLATES[1:])
            txn_counter += 1
            txns.append({
                "txn_id": f"{user_id}_txn_{txn_counter:04d}",
                "date": (month_start + timedelta(days=random.randint(0, 27))).strftime("%Y-%m-%d"),
                "time": _random_time(),
                "description": desc,
                "category": category,
                "type": "CREDIT",
                "amount": round(random.uniform(lo, hi)),
                "channel": channel,
            })

        # --- Conservative saver parks money in FDs ---
        if profile["name_alias"].startswith("Conservative") and random.random() < 0.7:
            txn_counter += 1
            txns.append({
                "txn_id": f"{user_id}_txn_{txn_counter:04d}",
                "date": (month_start + timedelta(days=random.randint(8, 20))).strftime("%Y-%m-%d"),
                "time": _random_time(),
                "description": "FD CREATION",
                "category": "Investment",
                "type": "DEBIT",
                "amount": random.choice([10000, 20000, 25000]),
                "channel": "NETBANKING",
            })

    txns.sort(key=lambda t: (t["date"], t["time"]))
    return txns


def generate_dataset() -> dict:
    dataset = {}
    for user_id, profile in PROFILES.items():
        dataset[user_id] = {
            "profile": {
                "user_id": user_id,
                "alias": profile["name_alias"],
                "age": profile["age"],
                "monthly_salary": profile["monthly_salary"],
            },
            "transactions": generate_user_transactions(user_id, profile),
        }
    return dataset


def main():
    dataset = generate_dataset()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(dataset, f, indent=2)
    total = sum(len(u["transactions"]) for u in dataset.values())
    print(f"Generated {total} transactions for {len(dataset)} users -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
