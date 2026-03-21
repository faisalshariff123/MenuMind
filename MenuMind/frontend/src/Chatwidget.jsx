import { useState, useRef, useEffect } from "react";

const CHIPS = [
  { label: "Cheapest vegan dish", icon: "🌱" },
  { label: "Under $12", icon: "💰" },
  { label: "No nuts", icon: "🚫" },
  { label: "Show vegan options", icon: "🥗" },
];

export default function ChatWidget({ onClose }) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi there! I'm your AI menu guide. Ask me about prices, dietary needs, allergens — anything on the menu.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Connection issue — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .mm-widget {
          display: flex;
          flex-direction: column;
          width: 380px;
          height: 560px;
          border-radius: 20px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          background: #faf8f4;
          box-shadow: 0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.16);
          animation: mm-rise 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes mm-rise {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mm-header {
          background: #1a1208;
          padding: 16px 20px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .mm-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mm-avatar {
          width: 34px;
          height: 34px;
          background: #c9965f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .mm-title {
          font-family: 'Lora', serif;
          font-size: 15px;
          font-weight: 500;
          color: #f0ebe0;
          margin: 0;
          letter-spacing: 0.01em;
        }
        .mm-subtitle {
          font-size: 11px;
          color: #9c8a6e;
          margin: 1px 0 0;
          letter-spacing: 0.03em;
        }
        .mm-close {
          background: rgba(255,255,255,0.08);
          border: none;
          color: #9c8a6e;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
          line-height: 1;
        }
        .mm-close:hover { background: rgba(255,255,255,0.14); color: #f0ebe0; }

        .mm-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #faf8f4;
          scrollbar-width: thin;
          scrollbar-color: #ddd8cf transparent;
        }

        .mm-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          max-width: 82%;
          font-size: 13.5px;
          line-height: 1.55;
          animation: mm-pop 0.22s ease-out;
        }
        @keyframes mm-pop {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mm-bubble.bot {
          background: #fff;
          color: #2a2016;
          border: 1px solid #ede9e2;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }
        .mm-bubble.user {
          background: #1a1208;
          color: #f0ebe0;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        .mm-typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 12px 14px;
        }
        .mm-dot {
          width: 6px; height: 6px;
          background: #c9965f;
          border-radius: 50%;
          animation: mm-bounce 1.2s infinite;
        }
        .mm-dot:nth-child(2) { animation-delay: 0.2s; }
        .mm-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes mm-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        .mm-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 10px 14px;
          background: #f2ede6;
          border-top: 1px solid #ede9e2;
          flex-shrink: 0;
        }
        .mm-chip {
          background: #fff;
          border: 1px solid #ded8cf;
          border-radius: 100px;
          padding: 5px 11px;
          font-size: 11.5px;
          cursor: pointer;
          color: #5a4e38;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mm-chip:hover {
          background: #1a1208;
          border-color: #1a1208;
          color: #f0ebe0;
        }

        .mm-input-row {
          display: flex;
          padding: 10px 12px;
          gap: 8px;
          background: #fff;
          border-top: 1px solid #ede9e2;
          align-items: center;
          flex-shrink: 0;
        }
        .mm-input {
          flex: 1;
          padding: 9px 14px;
          border-radius: 100px;
          border: 1px solid #ded8cf;
          font-size: 13.5px;
          background: #faf8f4;
          color: #2a2016;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .mm-input::placeholder { color: #b0a898; }
        .mm-input:focus { border-color: #c9965f; }
        .mm-send {
          background: #1a1208;
          color: #f0ebe0;
          border: none;
          border-radius: 100px;
          padding: 9px 16px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mm-send:hover { background: #c9965f; }
        .mm-send:active { transform: scale(0.96); }
        .mm-send:disabled { opacity: 0.45; cursor: not-allowed; }

        .mm-powered {
          text-align: center;
          font-size: 10px;
          color: #b0a898;
          padding: 5px 0 6px;
          background: #fff;
          letter-spacing: 0.04em;
        }
        .mm-powered span { color: #c9965f; font-weight: 500; }
      `}</style>

      <div className="mm-widget">
        <div className="mm-header">
          <div className="mm-header-left">
            <div className="mm-avatar">🍽️</div>
            <div>
              <p className="mm-title">MenuMind</p>
              <p className="mm-subtitle">AI menu assistant · online</p>
            </div>
          </div>
          {onClose && (
            <button className="mm-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <div className="mm-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`mm-bubble ${msg.from}`}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="mm-bubble bot mm-typing">
              <div className="mm-dot" />
              <div className="mm-dot" />
              <div className="mm-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mm-chips">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              className="mm-chip"
              onClick={() => sendMessage(chip.label)}
              disabled={loading}
            >
              <span style={{ fontSize: 12 }}>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mm-input-row">
          <input
            className="mm-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about our menu…"
            disabled={loading}
          />
          <button
            className="mm-send"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>

        <div className="mm-powered">
          Powered by <span>MenuMind AI</span>
        </div>
      </div>
    </>
  );
}