import type { Insights } from "../api";

// Compact "financial pulse" strip — the numbers Dhan Mitra grounds
// its advice in, visible to the user for transparency.

export function InsightsStrip({ insights }: { insights: Insights }) {
  const savingsGood = insights.savings_rate_pct >= 20;
  return (
    <div className="insights-strip" role="status">
      <div className="chip">
        <span className="chip-label">Savings rate</span>
        <span className={`chip-value ${savingsGood ? "good" : "warn"}`}>
          {insights.savings_rate_pct}%
        </span>
      </div>
      <div className="chip">
        <span className="chip-label">Monthly spend</span>
        <span className="chip-value">₹{insights.monthly_spend.toLocaleString("en-IN")}</span>
      </div>
      <div className="chip">
        <span className="chip-label">Top category</span>
        <span className="chip-value">
          {insights.top_spend_categories[0]?.category ?? "—"}
        </span>
      </div>
      <div className="chip">
        <span className="chip-label">Profile</span>
        <span className="chip-value">{insights.investor_type}</span>
      </div>
    </div>
  );
}
