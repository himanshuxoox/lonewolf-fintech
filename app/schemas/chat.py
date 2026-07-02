from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: str  # which demo user's insights to load


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    mode: str  # "llm" or "fallback" - transparency for demo


class HistoryItem(BaseModel):
    role: str
    content: str


class HistoryResponse(BaseModel):
    session_id: str
    history: List[HistoryItem]
