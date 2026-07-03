import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchInsights,
  fetchTimeseries,
  fetchUsers,
  sendChat,
  type Insights,
  type SpendPoint,
} from "./api";
import { Avatar } from "./components/Avatar";
import { BottomNav, type View } from "./components/BottomNav";
import { Dashboard } from "./screens/Dashboard";
import { ChatScreen, type Message } from "./screens/ChatScreen";
import { AnalysisScreen } from "./screens/AnalysisScreen";

const FIRST_NAMES: Record<string, string> = {
  user_001: "Aarav",
  user_002: "Meera",
  user_003: "Rajan",
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [users, setUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState("user_001");
  const [insights, setInsights] = useState<Insights | null>(null);
  const [series, setSeries] = useState<SpendPoint[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setError("Backend not reachable — is uvicorn running?"));
  }, []);

  useEffect(() => {
    setMessages([]);
    sessionId.current = `session_${userId}_${Date.now()}`;
    fetchInsights(userId).then(setInsights).catch(() => setInsights(null));
    fetchTimeseries(userId).then(setSeries).catch(() => setSeries([]));
  }, [userId]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || typing) return;
    setView("chat");
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
          <span>9:41</span>
          <span className="notch" />
          <span className="sb-icons">⚡</span>
        </div>

        <div className="screen-wrap">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                className="screen"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
              >
                <Dashboard
                  name={name}
                  users={users}
                  userId={userId}
                  onUserChange={setUserId}
                  insights={insights}
                  onAsk={(prompt) => (prompt ? send(prompt) : setView("chat"))}
                  error={error}
                />
              </motion.div>
            )}

            {view === "chat" && (
              <motion.div
                key="chat"
                className="screen"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.22 }}
              >
                <ChatScreen
                  name={name}
                  messages={messages}
                  typing={typing}
                  error={error}
                  onBack={() => setView("home")}
                  onSend={send}
                />
              </motion.div>
            )}

            {view === "analysis" && (
              <motion.div
                key="analysis"
                className="screen"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <AnalysisScreen insights={insights} series={series} onAsk={send} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BottomNav view={view} onChange={setView} />
      </div>
    </div>
  );
}

export { Avatar };
