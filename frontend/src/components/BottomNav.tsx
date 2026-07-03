export type View = "home" | "chat" | "analysis";

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
        <span className="nav-icon">⌂</span>
        <span>Home</span>
      </button>
      <button
        className={`nav-center ${view === "chat" ? "active" : ""}`}
        onClick={() => onChange("chat")}
        aria-label="Chat with Dhan Mitra"
      >
        ₹
      </button>
      <button className={view === "analysis" ? "active" : ""} onClick={() => onChange("analysis")}>
        <span className="nav-icon">◔</span>
        <span>Analysis</span>
      </button>
    </nav>
  );
}
