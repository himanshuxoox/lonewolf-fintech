# LoneWolf FinTech — AI Wealth Advisor Avatar

**IDBI Innovate 2026 | Track 01** — Wealth Advisory + Conversational AI + Mobile Banking

## Problem Statement
Wealth management and advisory services remain fragmented and largely inaccessible
to a large number of customers. Absence of comprehensive customer investment
behavior and spending habits data limits the ability to provide timely,
personalized, data-driven guidance.

## Solution
An AI-powered Digital Wealth Management (Avatar-Based) Application that integrates
into the bank's mobile app to deliver personalized, scalable wealth advisory
services through a conversational interface.

## Architecture (privacy-first)

```
User (synthetic) transaction data
        │
        ▼
Local Insights Engine (app/services)
  — spending pattern analysis
  — risk profiling
  — recommendation generation
  — PII stripped here, never leaves this layer
        │
        ▼
Anonymized insights (no PII)
        │
        ▼
LLM Conversational Layer (Claude API)
  — turns insights into natural, advisory conversation
        │
        ▼
User-facing Avatar (chat UI)
```

Raw customer data is processed locally and never sent to the LLM directly —
only anonymized, aggregated insights are used to generate conversational
responses. In a production deployment this would be re-architected with the
bank's existing Java/Spring Boot stack and an on-prem/private LLM option.

## Tech Stack
- **Backend:** FastAPI (Python)
- **AI Layer:** Anthropic Claude API (conversational responses)
- **Frontend:** React + TypeScript (planned)
- **Data:** Synthetic transaction/UPI datasets (IDBI sandbox)

## Project Structure
```
lonewolf-fintech/
├── main.py                 # FastAPI entry point
├── app/
│   ├── api/                # Route handlers (chat, insights)
│   ├── core/                # Config
│   ├── models/              # DB models (future)
│   ├── schemas/              # Pydantic request/response schemas
│   └── services/             # Business logic (insights engine, LLM client)
├── data/                   # Synthetic datasets
├── tests/
├── requirements.txt
└── .env.example
```

## Setup

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your API key
uvicorn main:app --reload
```

Visit `http://localhost:8000/docs` for the interactive API docs.

## Status
🚧 Early development — solo build for IDBI Innovate 2026 submission (deadline: 9 July 2026).

## Author
Himanshu — Team **LoneWolf FinTech**
