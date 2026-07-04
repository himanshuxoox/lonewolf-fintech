export type View = "home" | "chat" | "analysis";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#2ecf9a" : "#9cbcae"} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M10 21v-6h4v6" />
  </svg>
);

const AnalysisIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#2ecf9a" : "#9cbcae"} strokeWidth="1.8"
    strokeLinecap="round">
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
);

export function BottomNav({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button className={view === "home" ? "active" : ""} onClick={() => onChange("home")}>
        <HomeIcon active={view === "home"} />
        <span>Home</span>
        {view === "home" && <span className="nav-dot" />}
      </button>
      <button
        className={`nav-center ${view === "chat" ? "active" : ""}`}
        onClick={() => onChange("chat")}
        aria-label="Chat with Dhan Mitra"
      >
        <span className="nav-center-inner">₹</span>
      </button>
      <button className={view === "analysis" ? "active" : ""} onClick={() => onChange("analysis")}>
        <AnalysisIcon active={view === "analysis"} />
        <span>Analysis</span>
        {view === "analysis" && <span className="nav-dot" />}
      </button>
    </nav>
  );
}