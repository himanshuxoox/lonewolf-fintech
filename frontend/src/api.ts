// API client — talks to the FastAPI backend.
// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.ts).
// In production, set VITE_API_BASE to the deployed backend URL.

const BASE = import.meta.env.VITE_API_BASE ?? "";

export interface SpendCategory {
  category: string;
  monthly_avg: number;
}

export interface Insights {
  user_segment: string;
  age_band: string;
  period_months: number;
  monthly_income_band: string;
  monthly_spend: number;
  monthly_investment: number;
  savings_rate_pct: number;
  investment_rate_pct: number;
  fixed_obligation_ratio_pct: number;
  essential_spend_monthly: number;
  discretionary_spend_monthly: number;
  top_spend_categories: SpendCategory[];
  investor_type: string;
  suggested_equity_allocation_pct: number;
  recommendations: string[];
}

export interface ChatReply {
  reply: string;
  session_id: string;
  mode: "llm" | "fallback";
}

export interface Txn {
  txn_id: string;
  date: string;
  time: string;
  description: string;
  category: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  channel: string;
}

export async function fetchTransactions(userId: string, limit = 4): Promise<Txn[]> {
  const res = await fetch(`${BASE}/api/insights/transactions/${userId}?limit=${limit}`);
  if (!res.ok) throw new Error("Could not load transactions");
  const data = await res.json();
  return data.transactions;
}

export async function fetchUsers(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/insights/users`);
  if (!res.ok) throw new Error("Could not load demo users");
  const data = await res.json();
  return data.users;
}

export async function fetchInsights(userId: string): Promise<Insights> {
  const res = await fetch(`${BASE}/api/insights/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("Could not analyze spending");
  return res.json();
}

export async function sendChat(
  sessionId: string,
  userId: string,
  message: string,
): Promise<ChatReply> {
  const res = await fetch(`${BASE}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, user_id: userId, message }),
  });
  if (!res.ok) throw new Error("Advisor is unreachable right now");
  return res.json();
}
