import { motion } from "framer-motion";
import type { Insights } from "../api";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { Avatar } from "../components/Avatar";

const USER_LABELS: Record<string, string> = {
  user_001: "Aarav · 20s",
  user_002: "Meera · 30s",
  user_003: "Rajan · 40s",
};

const QUICK_ACTIONS = [
  { icon: "👛", label: "Reduce Spending", prompt: "How can I reduce my spending?" },
  { icon: "🌱", label: "Start SIP", prompt: "Should I start a SIP?" },
  { icon: "◔", label: "Check Expenses", prompt: "Mera kharcha kaha ja raha hai?" },
  { icon: "🎯", label: "Financial Goals", prompt: "Help me set financial goals" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function Dashboard({
  name,
  users,
  userId,
  onUserChange,
  insights,
  onAsk,
  error,
}: {
  name: string;
  users: string[];
  userId: string;
  onUserChange: (id: string) => void;
  insights: Insights | null;
  onAsk: (prompt?: string) => void;
  error: string | null;
}) {
  const savings = insights?.savings_rate_pct ?? 0;
  const savingsGood = savings >= 20;
  // simple derived "net worth" proxy for the demo: 14x monthly investment + buffer
  const netWorth = insights ? Math.round(insights.monthly_investment * 14 + 240000) : 0;

  return (
    <>
      <header className="home-head">
        <div>
          <div className="hello">Good Evening 👋</div>
          <div className="hello-name">{name}</div>
        </div>
        <div className="head-right">
          <select
            className="profile-pill"
            value={userId}
            onChange={(e) => onUserChange(e.target.value)}
            aria-label="Switch demo profile"
          >
            {users.map((u) => (
              <option key={u} value={u}>
                {USER_LABELS[u] ?? u}
              </option>
            ))}
          </select>
        </div>
      </header>

      <motion.section
        className="hero"
        {...fadeUp}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="hero-label">Net Worth 👁</div>
          <div className="hero-value">
            <AnimatedCounter value={netWorth} prefix="₹" />
          </div>
          <span className="hero-badge">↑ 4.3% vs last month</span>
        </div>
        <div className="hero-avatar">
          <Avatar size={62} />
          <div className="hero-bubble">
            I'm <strong>Dhan Mitra</strong>, your AI Wealth Coach
          </div>
        </div>
      </motion.section>

      <motion.section className="stat-cards" {...fadeUp} transition={{ duration: 0.3, delay: 0.06 }}>
        <div className="stat-card primary">
          <span className="sc-label">Monthly Spend</span>
          <span className="sc-value">
            {insights ? <AnimatedCounter value={insights.monthly_spend} prefix="₹" /> : "—"}
          </span>
          <span className="sc-foot">{insights ? `${insights.period_months} month avg` : ""}</span>
        </div>
        <div className="stat-card">
          <span className="sc-label">Savings Rate</span>
          <span className="sc-ring" style={{ ["--p" as string]: `${Math.min(savings, 100)}` }}>
            <span className="sc-ring-text">{insights ? `${savings}%` : "—"}</span>
          </span>
          <span className={`sc-chip ${savingsGood ? "good" : "warn"}`}>
            {savingsGood ? "Good" : "Low"}
          </span>
        </div>
        <div className="stat-card">
          <span className="sc-label">Investing</span>
          <span className="sc-value small">
            {insights ? `${insights.investment_rate_pct}%` : "—"}
          </span>
          <span className="sc-foot">{insights?.investor_type ?? ""}</span>
        </div>
      </motion.section>

      {insights && insights.recommendations[0] && (
        <motion.section className="insight-card" {...fadeUp} transition={{ duration: 0.3, delay: 0.12 }}>
          <div className="ic-eyebrow">💡 AI Insight</div>
          <p className="ic-text">{insights.recommendations[0]}</p>
          <button className="ic-cta" onClick={() => onAsk("Give me a detailed analysis of my spending and how to improve it")}>
            View Analysis →
          </button>
        </motion.section>
      )}

      <motion.section {...fadeUp} transition={{ duration: 0.3, delay: 0.18 }}>
        <div className="section-head">Quick Actions</div>
        <div className="qa-grid">
          {QUICK_ACTIONS.map((q) => (
            <button key={q.label} className="qa-card" onClick={() => onAsk(q.prompt)}>
              <span className="qa-icon">{q.icon}</span>
              <span className="qa-label">{q.label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {error && <div className="error-note">{error}</div>}
    </>
  );
}
