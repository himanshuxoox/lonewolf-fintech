// The Dhan Mitra avatar — ₹ monogram in a coin-like badge.
// The ring pulses while the advisor is "thinking", giving the
// avatar a living presence without heavy animation.

export function Avatar({ typing }: { typing: boolean }) {
  return (
    <div className={`avatar ${typing ? "avatar-thinking" : ""}`} aria-hidden="true">
      <span className="avatar-mark">₹</span>
    </div>
  );
}
