"""
LoneWolf FinTech — AI Wealth Advisor Avatar
IDBI Innovate 2026 | Track 01: Wealth Advisory + Conversational AI + Mobile Banking

Entry point for the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, insights

app = FastAPI(
    title="LoneWolf FinTech - AI Wealth Advisor",
    description="AI-powered Digital Wealth Management Avatar for IDBI Innovate 2026",
    version="0.1.0",
)

# CORS - allow frontend to talk to this API during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before final submission
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "alive",
        "project": "LoneWolf FinTech - AI Wealth Advisor Avatar",
        "track": "Track 01 - Wealth Advisory / Conversational AI / Mobile Banking",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Routers (built out incrementally)
app.include_router(chat.router, prefix="/api/chat", tags=["Conversational AI"])
app.include_router(insights.router, prefix="/api/insights", tags=["Wealth Insights"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
