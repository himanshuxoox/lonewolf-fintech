import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { Insights, SpendPoint } from "../api";

const COLORS = ["#0B5D4D", "#FFB74D", "#7E57C2", "#5C8DEF", "#E05B7B"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function AnalysisScreen({
  insights,
  series,
  onAsk,
}: {
  insights: Insights | null;
  series: SpendPoint[];
  onAsk: (prompt: string) => void;
}) {
  if (!insights) {
    return <div className="error-note">Loading analysis…</div>;
  }

  const cats = insights.top_spend_categories;
  const total = cats.reduce((s, c) => s + c.monthly_avg, 0) || 1;
  const donut = cats.map((c) => ({ name: c.category, value: c.monthly_avg }));

  // thin the series for a smooth chart (every 2nd point if long)
  const chartData = series.length > 45 ? series.filter((_, i) => i % 2 === 0) : series;

  return (
    <>
      <header className="an-head">
        <div>
          <div className="an-title">Spending Analysis</div>
          <div className="an-sub">✦ Insight powered by Dhan Mitra AI</div>
        </div>
      </header>

      <motion.section className="card-dark" {...fadeUp} transition={{ duration: 0.3 }}>
        <div className="cd-row">
          <div>
            <div className="cd-label">Total Spend / month</div>
            <div className="cd-value">₹{insights.monthly_spend.toLocaleString("en-IN")}</div>
          </div>
          <span className={`sc-chip ${insights.savings_rate_pct >= 20 ? "good" : "warn"}`}>
            Savings {insights.savings_rate_pct}%
          </span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2ecf9a" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#2ecf9a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#7fa695", fontSize: 9 }}
                tickFormatter={(d: string) => d.slice(8)}
                interval={Math.ceil(chartData.length / 6)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#06281f",
                  border: "1px solid #14513f",
                  borderRadius: 10,
                  fontSize: 11,
                  color: "#e7f5ee",
                }}
                formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "spend"]}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#2ecf9a"
                strokeWidth={2}
                fill="url(#spendFill)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section className="card-light" {...fadeUp} transition={{ duration: 0.3, delay: 0.08 }}>
        <div className="section-head dark-text">Spending by Category</div>
        <div className="donut-row">
          <div className="donut-box">
            <ResponsiveContainer width="100%" height={128}>
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={3}
                  animationDuration={900}
                >
                  {donut.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`₹${Number(v).toLocaleString("en-IN")}`, String(n)]}
                  contentStyle={{ borderRadius: 10, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span>₹{insights.monthly_spend.toLocaleString("en-IN")}</span>
              <small>Total</small>
            </div>
          </div>
          <ul className="cat-list">
            {cats.map((c, i) => (
              <li key={c.category}>
                <span className="cat-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="cat-name">{c.category}</span>
                <span className="cat-amt">₹{c.monthly_avg.toLocaleString("en-IN")}</span>
                <span className="cat-pct">{Math.round((c.monthly_avg / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {insights.recommendations[0] && (
        <motion.section className="insight-card" {...fadeUp} transition={{ duration: 0.3, delay: 0.14 }}>
          <div className="ic-eyebrow">🤖 AI Insight</div>
          <p className="ic-text">{insights.recommendations[0]}</p>
          <button className="ic-cta" onClick={() => onAsk("Give me specific recommendations to optimize my spending")}>
            See Recommendations →
          </button>
        </motion.section>
      )}

      <motion.section className="savings-card" {...fadeUp} transition={{ duration: 0.3, delay: 0.2 }}>
        <span className="savings-icon">💰</span>
        <div>
          <div className="savings-title">Savings Opportunity</div>
          <p className="savings-text">
            Discretionary spend is ₹{insights.discretionary_spend_monthly.toLocaleString("en-IN")}/month —
            trimming it funds a bigger SIP.
          </p>
        </div>
        <button className="savings-cta" onClick={() => onAsk("How much could I realistically save each month?")}>
          Explore →
        </button>
      </motion.section>
    </>
  );
}
