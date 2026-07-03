// Dhan Mitra avatar. Drop a custom image at src/assets/avatar.png to use it;
// falls back to the ₹ monogram badge automatically.
import { useState } from "react";

const AVATAR_URL = new URL("../assets/avatar.png", import.meta.url).href;

export function Avatar({ size = 40, thinking = false }: { size?: number; thinking?: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div
      className={`dm-avatar ${thinking ? "thinking" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {imgOk ? (
        <img src={AVATAR_URL} alt="" onError={() => setImgOk(false)} />
      ) : (
        <span className="dm-avatar-mark" style={{ fontSize: size * 0.45 }}>₹</span>
      )}
    </div>
  );
}
