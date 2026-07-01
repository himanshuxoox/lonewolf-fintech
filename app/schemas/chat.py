from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[str] = None  # will map to anonymized profile, not raw PII


class ChatResponse(BaseModel):
    reply: str
    session_id: str
