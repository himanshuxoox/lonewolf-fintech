import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "../components/Avatar";
import { TypingIndicator } from "../components/TypingIndicator";

export interface Message {
  role: "user" | "advisor";
  text: string;
}

const CHIPS = [
  "💰 How can I save more?",
  "📈 Best SIP for me?",
  "📊 Show spending report",
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

export function ChatScreen({
  name,
  messages,
  typing,
  error,
  onBack,
  onSend,
}: {
  name: string;
  messages: Message[];
  typing: boolean;
  error: string | null;
  onBack: () => void;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function submit(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    onSend(msg);
  }

  return (
    <>
      <header className="chat-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div className="chat-id">
          <Avatar size={32} thinking={typing} />
          <div>
            <div className="chat-name">
              Dhan Mitra <span className="verified">✓</span>
            </div>
            <div className="chat-status">
              <span className="online-dot" /> {typing ? "typing…" : "AI Wealth Coach · online"}
            </div>
          </div>
        </div>
        <span style={{ width: 36 }} />
      </header>

      <div className="chat" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="hi">Hi {name}! 👋</div>
            <div className="big-q">How can I help you improve your finances today?</div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={`bubble ${m.role}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderText(m.text)}
          </motion.div>
        ))}
        {typing && (
          <div className="bubble advisor">
            <TypingIndicator />
          </div>
        )}
        {error && <div className="error-note">{error}</div>}
      </div>

      <div className="chips">
        {CHIPS.map((c) => (
          <button key={c} onClick={() => submit(c.replace(/^[^ ]+ /, ""))} disabled={typing}>
            {c}
          </button>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <span className="composer-icon" aria-hidden="true">🎙</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Dhan Mitra anything…"
          aria-label="Message Dhan Mitra"
        />
        <motion.button
          type="submit"
          disabled={!input.trim() || typing}
          aria-label="Send"
          whileTap={{ scale: 0.88 }}
        >
          ↑
        </motion.button>
      </form>
      <p className="privacy-note">
        Advice is grounded in anonymized spending patterns — your identity never reaches the AI.
      </p>
    </>
  );
}
