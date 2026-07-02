"""
Conversational AI endpoints — the "Dhan Mitra" avatar layer.

Privacy-first design: this router pulls ANONYMIZED insights from the
insights engine and passes only those into the LLM. Raw transaction
data never crosses this boundary.
"""

from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse, HistoryResponse
from app.services import advisor_llm, insights_engine
from app.core.config import settings

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def chat_with_advisor(request: ChatRequest):
    """
    Send a message to the wealth advisor avatar.
    Insights are computed locally; only anonymized data reaches the LLM.
    """
    try:
        insights = insights_engine.analyze_user(request.user_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"User '{request.user_id}' not found")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    reply = advisor_llm.chat(request.session_id, request.message, insights)
    mode = "llm" if settings.anthropic_api_key else "fallback"
    return ChatResponse(reply=reply, session_id=request.session_id, mode=mode)


@router.get("/history/{session_id}", response_model=HistoryResponse)
def get_chat_history(session_id: str):
    """Fetch conversation history for a session (for frontend rendering)."""
    return HistoryResponse(
        session_id=session_id,
        history=advisor_llm.get_history(session_id),
    )
