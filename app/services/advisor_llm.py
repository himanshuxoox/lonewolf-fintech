"""
Advisor LLM Layer — turns anonymized insights into conversational,
avatar-style wealth advisory responses.

PRIVACY GUARANTEE (core architecture decision):
  The ONLY user data that enters the prompt is the anonymized insights
  dict from insights_engine (income bands, age bands, behavioral segment,
  ratios). Raw transactions, names, account numbers NEVER reach this layer.

FALLBACK MODE:
  If no ANTHROPIC_API_KEY is configured, responses fall back to a
  template-based composer so the demo never breaks. (Judges > API keys.)
"""

import json
from typing import Optional

from app.core.config import settings

# In-memory conversation store: {session_id: [{"role": ..., "content": ...}]}
# Fine for hackathon demo; production would use Redis/DB.
_conversations: dict[str, list[dict]] = {}

MAX_HISTORY_TURNS = 10  # keep prompt size bounded

SYSTEM_PROMPT = """You are "Dhan Mitra", a friendly AI wealth advisor avatar inside a bank's mobile banking app, built for Indian retail banking customers.

Your personality:
- Warm, encouraging, and jargon-free — like a knowledgeable friend, not a salesman
- You speak simple English (the user may switch to Hindi/Hinglish — mirror their language naturally)
- Concise: 2-5 short sentences per reply unless the user asks for detail
- You use Indian financial context: SIP, ELSS, PPF, FD, NPS, UPI, lakhs/crores, INR amounts

Your knowledge about this user comes ONLY from the anonymized financial profile provided below. It contains NO personal identity — only behavioral insights. Never invent specific transactions, balances, or personal details beyond what the profile shows.

Rules:
- Ground every piece of advice in the profile data (mention their actual savings rate, top spend categories, etc.)
- Give actionable, specific suggestions (e.g., "increasing your SIP by INR 3,000" not "invest more")
- Standard disclaimers only when recommending specific instrument types: add a short "(subject to market risk — consider consulting a certified advisor for large decisions)" at most once per conversation
- Never guarantee returns. Never pressure. If asked something outside personal finance, politely steer back.
- If the user asks what data you can see, be transparent: explain you only see anonymized spending patterns and ratios, not their raw transactions or identity.

ANONYMIZED USER PROFILE:
{insights_json}
"""


def get_history(session_id: str) -> list[dict]:
    return _conversations.get(session_id, [])


def _append_history(session_id: str, role: str, content: str):
    _conversations.setdefault(session_id, []).append({"role": role, "content": content})
    # trim old turns, keep last N
    if len(_conversations[session_id]) > MAX_HISTORY_TURNS * 2:
        _conversations[session_id] = _conversations[session_id][-MAX_HISTORY_TURNS * 2:]


def chat(session_id: str, user_message: str, insights: dict) -> str:
    """
    Main entry: takes user message + anonymized insights,
    returns the avatar's conversational reply.
    """
    _append_history(session_id, "user", user_message)

    if settings.anthropic_api_key:
        reply = _chat_via_claude(session_id, insights)
    else:
        reply = _chat_fallback(user_message, insights)

    _append_history(session_id, "assistant", reply)
    return reply


# ---------------------------------------------------------------------------
# Claude API path
# ---------------------------------------------------------------------------

def _chat_via_claude(session_id: str, insights: dict) -> str:
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        system = SYSTEM_PROMPT.format(insights_json=json.dumps(insights, indent=2))

        response = client.messages.create(
            model=settings.llm_model,
            max_tokens=500,
            system=system,
            messages=get_history(session_id),
        )
        return response.content[0].text
    except Exception as e:
        # DEBUG: print actual error to terminal
        import traceback
        print("=" * 50)
        print(f"CLAUDE API ERROR: {type(e).__name__}: {e}")
        traceback.print_exc()
        print("=" * 50)
        # Never crash the demo — degrade gracefully
        return (
            f"{_chat_fallback(get_history(session_id)[-1]['content'], insights)}\n\n"
            f"_(note: AI service temporarily unavailable, showing rule-based response)_"
        )


# ---------------------------------------------------------------------------
# Fallback path (no API key / API failure) — template-based but data-driven
# ---------------------------------------------------------------------------

def _chat_fallback(user_message: str, insights: dict) -> str:
    msg = user_message.lower()
    savings = insights["savings_rate_pct"]
    inv_type = insights["investor_type"]
    top_cat = insights["top_spend_categories"][0]["category"] if insights["top_spend_categories"] else "N/A"
    recs = insights["recommendations"]

    if any(w in msg for w in ["spend", "kharcha", "expense", "kaha ja"]):
        cats = ", ".join(f"{c['category']} (₹{c['monthly_avg']:,}/mo)" for c in insights["top_spend_categories"][:3])
        return (
            f"Your top spending areas: {cats}. "
            f"Monthly spend is ₹{insights['monthly_spend']:,} against a savings rate of {savings}%. "
            + ("That's healthy!" if savings >= 20 else "There's room to tighten discretionary spending.")
        )
    if any(w in msg for w in ["save", "bachat", "saving"]):
        return (
            f"Your current savings rate is {savings}% "
            + ("— great, above the 20% benchmark! " if savings >= 20 else "— below the recommended 20%. ")
            + (recs[0] if recs else "")
        )
    if any(w in msg for w in ["invest", "sip", "mutual fund", "elss", "fd", "stock"]):
        return (
            f"Based on your profile ({inv_type}, savings rate {savings}%), "
            f"a good starting point: {recs[0] if recs else 'maintain your current SIP and review quarterly.'} "
            f"Suggested equity allocation for your age band: ~{insights['suggested_equity_allocation_pct']}%."
        )
    if any(w in msg for w in ["hello", "hi", "namaste", "hey"]):
        return (
            f"Namaste! I'm Dhan Mitra, your personal wealth advisor. "
            f"I've analyzed your recent spending patterns — your savings rate is {savings}% and your top spend category is {top_cat}. "
            f"Ask me anything about saving, investing, or budgeting!"
        )
    # generic
    return (
        f"Here's what stands out in your finances: savings rate {savings}%, profile type '{inv_type}'. "
        f"Key suggestion: {recs[0] if recs else 'your finances look balanced — consider a periodic review.'}"
    )
