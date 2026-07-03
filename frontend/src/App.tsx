import { useEffect, useRef, useState } from "react";
import { fetchInsights, fetchUsers, sendChat, type Insights } from "./api";

interface Message {
  role: "user" | "advisor";
  text: string;
}

const USER_LABELS: Record<string, string> = {
  user_001: "Aarav · 20s",
  user_002: "Meera · 30s",
  user_003: "Rajan · 40s",
};

const FIRST_NAMES: Record<string, string> = {
  user_001: "Aarav",
  user_002: "Meera",
  user_003: "Rajan",
};

const SUGGESTIONS = [
  {
    title: "Spending Review",
    desc: "Mera kharcha kaha ja raha hai?",
    prompt: "Mera kharcha kaha ja raha hai?",
  },
  {
    title: "Start Investing",
    desc: "Should I start a SIP?",
    prompt: "Should I start a SIP?",
  },
  {
    title: "Savings Health",
    desc: "How are my savings doing?",
    prompt: "How are my savings?",
  },
  {
    title: "Smart Budget",
    desc: "Help me plan a monthly budget",
    prompt: "Help me plan a monthly budget based on my spending",
  },
];

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

export default function App() {
  const [view, setView] = useState<"home" | "chat">("home");
  const [users, setUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState("user_001");
  const [insights, setInsights] = useState<Insights | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setError("Backend not reachable — is uvicorn running?"));
  }, []);

  useEffect(() => {
    setMessages([]);
    sessionId.current = `session_${userId}_${Date.now()}`;
    fetchInsights(userId)
      .then(setInsights)
      .catch(() => setInsights(null));
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, view]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || typing) return;
    setView("chat");
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setTyping(true);
    try {
      const res = await sendChat(sessionId.current, userId, msg);
      setMessages((m) => [...m, { role: "advisor", text: res.reply }]);
    } catch {
      setError("Could not reach the advisor. Check that the backend is running.");
    } finally {
      setTyping(false);
    }
  }

  const name = FIRST_NAMES[userId] ?? "there";
  const maxCat = insights
    ? Math.max(...insights.top_spend_categories.map((c) => c.monthly_avg), 1)
    : 1;

  return (
    <div className="stage">
      <aside className="stage-note">
        <h1>
          Dhan Mitra<span className="tm">AI</span>
        </h1>
        <p className="tagline">Avatar-based wealth advisory, living inside the bank's mobile app.</p>
        <ul className="pitch-points">
          <li>Insights computed locally — only anonymized bands reach the AI</li>
          <li>Personalized to real spending behavior, not generic advice</li>
          <li>Switch demo profiles to see personalization in action →</li>
        </ul>
        <p className="credit">LoneWolf FinTech · IDBI Innovate 2026</p>
      </aside>

      <div className="phone">
        <div className="statusbar">
          <span>9:09</span>
          <span className="notch" />
          <span className="sb-icons">▂▄▆ ⚡</span>
        </div>

        {view === "home" && (
          <div className="screen home">
            <header className="home-head">
              <div>
                <div className="hello">Welcome back,</div>
                <div className="hello-name">{name}</div>
              </div>
              <select
                className="profile-pill"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                aria-label="Switch demo profile"
              >
                {users.map((u) => (
                  <option key={u} value={u}>
                    {USER_LABELS[u] ?? u}
                  </option>
                ))}
              </select>
            </header>

            <section className="card balance-card">
              <div className="card-row">
                <span className="card-label">Monthly Spend</span>
                <span className="pill-link">
                  {insights ? `${insights.period_months} mo avg` : "…"}
                </span>
              </div>
              <div className="balance">
                ₹{insights ? insights.monthly_spend.toLocaleString("en-IN") : "—"}
              </div>
              {insights && (
                <div className="bars" role="img" aria-label="Top spending categories">
                  {insights.top_spend_categories.map((c) => (
                    <div className="bar-col" key={c.category}>
                      <div
                        className="bar"
                        style={{ height: `${Math.max((c.monthly_avg / maxCat) * 64, 8)}px` }}
                      />
                      <span className="bar-label">{c.category.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-label">Savings rate</span>
                  <span
                    className={`stat-value ${
                      insights && insights.savings_rate_pct >= 20 ? "good" : "warn"
                    }`}
                  >
                    {insights ? `${insights.savings_rate_pct}%` : "—"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Investing</span>
                  <span className="stat-value">
                    {insights ? `${insights.investment_rate_pct}%` : "—"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Profile</span>
                  <span className="stat-value">{insights ? insights.investor_type : "—"}</span>
                </div>
              </div>
            </section>

            <section className="card ask-card">
              <div className="ask-eyebrow">
                <span className="dot" /> Your personal AI advisor
              </div>
              <h2>Learn how to save money and grow your wealth</h2>
              <button className="cta" onClick={() => setView("chat")}>
                Ask Dhan Mitra
              </button>
            </section>

            {insights && (
              <section className="recs">
                <div className="recs-head">Advisor notes</div>
                {insights.recommendations.slice(0, 2).map((r, i) => (
                  <div className="rec-item" key={i}>
                    <span className="rec-icon">₹</span>
                    <p>{r}</p>
                  </div>
                ))}
              </section>
            )}

            {error && <div className="error-note">{error}</div>}
          </div>
        )}

        {view === "chat" && (
          <div className="screen chat-screen">
            <header className="chat-head">
              <button className="back" onClick={() => setView("home")} aria-label="Back to home">
                ←
              </button>
              <span className="chat-title-pill">Dhan Mitra</span>
              <div className={`mini-avatar ${typing ? "thinking" : ""}`}>₹</div>
            </header>

            <div className="chat" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="chat-empty">
                  <div className="hi">Hi, {name}</div>
                  <div className="big-q">
                    How can I support you <strong>right now?</strong>
                  </div>
                  <div className="sugg-grid">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.title}
                        className="sugg-card"
                        onClick={() => handleSend(s.prompt)}
                      >
                        <span className="sugg-title">{s.title}</span>
                        <span className="sugg-desc">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role}`}>
                  {renderText(m.text)}
                </div>
              ))}
              {typing && (
                <div className="bubble advisor typing-dots" aria-label="Dhan Mitra is typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {error && <div className="error-note">{error}</div>}
            </div>

            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything"
                aria-label="Message Dhan Mitra"
              />
              <button type="submit" disabled={!input.trim() || typing} aria-label="Send">
                ➤
              </button>
            </form>
            <p className="privacy-note">
              Advice is grounded in anonymized spending patterns — your identity never reaches the
              AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
