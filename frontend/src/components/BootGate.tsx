// BootGate — pings /health until the backend is awake, showing a branded
// loading screen meanwhile. Solves Render free-tier cold starts (~50s)
// with a proper UX instead of broken fetches.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "./Avatar";

const BASE = import.meta.env.VITE_API_BASE ?? "";
const RETRY_MS = 2500;
const SLOW_AFTER_MS = 8000; // switch message after this long

const TIPS = [
  "Crunching your spending patterns…",
  "Waking up the insights engine…",
  "Polishing personalized advice…",
  "Counting every rupee twice…",
];

export function BootGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const started = Date.now();

    async function ping() {
      if (!alive.current) return;
      try {
        const res = await fetch(`${BASE}/health`, { cache: "no-store" });
        if (res.ok) {
          setReady(true);
          return;
        }
      } catch {
        /* backend still asleep — keep polling */
      }
      if (Date.now() - started > SLOW_AFTER_MS) setSlow(true);
      setTimeout(ping, RETRY_MS);
    }

    ping();
    const tipTimer = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 2800);
    return () => {
      alive.current = false;
      clearInterval(tipTimer);
    };
  }, []);

  if (ready) return <>{children}</>;

  return (
    <div className="boot">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="boot-inner"
      >
        <div className="boot-avatar">
          <Avatar size={86} thinking />
        </div>
        <h1 className="boot-title">
          Dhan Mitra<span className="boot-tm">AI</span>
        </h1>
        <p className="boot-tag">Your AI Wealth Coach</p>

        <div className="boot-bar">
          <div className="boot-bar-fill" />
        </div>

        <motion.p
          key={tipIdx}
          className="boot-tip"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {TIPS[tipIdx]}
        </motion.p>

        {slow && (
          <p className="boot-slow">
            Waking the server from its nap — free-tier hosting takes up to a minute on first visit.
            Hang tight! ☕
          </p>
        )}
      </motion.div>
      <p className="boot-credit">LoneWolf FinTech · IDBI Innovate 2026</p>
    </div>
  );
}
