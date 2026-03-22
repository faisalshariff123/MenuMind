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

  // hardcode for now; must match what you use on upload
  const restaurantId = "demo-1";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://menumind-1.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          restaurant_id: restaurantId,
        }),
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
        @import url('https://fonts.googleapis.com/css2?family=Silkscreen&family=VT323&display=swap');

        .mm-widget {
          display: flex;
          flex-direction: column;
          width: 380px;
          height: 560px;
          overflow: hidden;
          font-family: 'VT323', monospace;
          background: #faf8f4;
          border: 4px solid #1a1208;
          box-shadow: 8px 8px 0px #1a1208;
          animation: mm-rise 0.2s steps(4);
        }
        @keyframes mm-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mm-header {
          background: #c9965f;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 4px solid #1a1208;
          flex-shrink: 0;
        }
        .mm-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mm-avatar {
          width: 36px;
          height: 36px;
          background: #faf8f4;
          border: 2px solid #1a1208;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 2px 2px 0px #1a1208;
        }
        .mm-title {
          font-family: 'Silkscreen', cursive;
          font-size: 16px;
          color: #1a1208;
          margin: 0;
          text-transform: uppercase;
        }
        .mm-subtitle {
          font-size: 16px;
          color: #1a1208;
          margin: 0;
        }
        .mm-close {
          background: transparent;
          border: 2px solid #1a1208;
          background: #faf8f4;
          color: #1a1208;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-family: 'Silkscreen', cursive;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 2px 2px 0px #1a1208;
        }
        .mm-close:hover { background: #1a1208; color: #faf8f4; }
        .mm-close:active { transform: translate(2px, 2px); box-shadow: none; }

        .mm-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #faf8f4;
          /* Pixel pattern background */
          background-image: radial-gradient(#d3cdc1 2px, transparent 2px);
          background-size: 16px 16px;
        }

        .mm-bubble {
          padding: 10px 14px;
          max-width: 82%;
          font-size: 20px; /* VT323 needs to be larger for readability */
          line-height: 1.2;
          border: 2px solid #1a1208;
          box-shadow: 4px 4px 0px #1a1208;
        }
        .mm-bubble.bot {
          background: #fff;
          color: #1a1208;
          align-self: flex-start;
        }
        .mm-bubble.user {
          background: #c9965f;
          color: #1a1208;
          align-self: flex-end;
        }
        .mm-typing {
          display: flex;
          gap: 6px;
          align-items: center;
          padding: 12px 14px;
        }
        .mm-dot {
          width: 8px; height: 8px;
          background: #1a1208;
          animation: mm-blink 1s steps(2, start) infinite;
        }
        .mm-dot:nth-child(2) { animation-delay: 0.2s; }
        .mm-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes mm-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        .mm-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 14px;
          background: #c9965f;
          border-top: 4px solid #1a1208;
          flex-shrink: 0;
        }
        .mm-chip {
          background: #faf8f4;
          border: 2px solid #1a1208;
          padding: 6px 10px;
          font-size: 16px;
          cursor: pointer;
          color: #1a1208;
          font-family: 'VT323', monospace;
          box-shadow: 2px 2px 0px #1a1208;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mm-chip:hover {
          background: #1a1208;
          color: #faf8f4;
        }
        .mm-chip:active {
          transform: translate(2px, 2px);
          box-shadow: none;
        }

        .mm-input-row {
          display: flex;
          padding: 12px;
          gap: 10px;
          background: #faf8f4;
          border-top: 4px solid #1a1208;
          align-items: center;
          flex-shrink: 0;
        }
        .mm-input {
          flex: 1;
          padding: 10px;
          border: 2px solid #1a1208;
          font-size: 18px;
          background: #fff;
          color: #1a1208;
          font-family: 'VT323', monospace;
          outline: none;
          box-shadow: inset 3px 3px 0px rgba(0,0,0,0.05);
        }
        .mm-input::placeholder { color: #888; }
        .mm-input:focus { background: #fffae6; }
        
        .mm-send {
          background: #1a1208;
          color: #fff;
          border: 2px solid #1a1208;
          padding: 10px 16px;
          font-size: 16px;
          font-family: 'Silkscreen', cursive;
          cursor: pointer;
          box-shadow: 3px 3px 0px #c9965f;
          text-transform: uppercase;
        }
        .mm-send:hover { background: #332411; }
        .mm-send:active { transform: translate(3px, 3px); box-shadow: none; }
        .mm-send:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }

        .mm-powered {
          text-align: center;
          font-size: 14px;
          color: #1a1208;
          padding: 6px 0 8px;
          background: #faf8f4;
          font-family: 'VT323', monospace;
        }
      `}</style>

      <div className="mm-widget">
        <div className="mm-header">
          <div className="mm-header-left">
            <div className="mm-avatar">👾</div>
            <div>
              <p className="mm-title">MenuMind</p>
              <p className="mm-subtitle">LVL 1 AI</p>
            </div>
          </div>
          {onClose && (
            <button className="mm-close" onClick={onClose} aria-label="Close">
              X
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
              <span>{chip.icon}</span>
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
            placeholder="INSERT COIN... OR QUESTION"
            disabled={loading}
          />
          <button
            className="mm-send"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            A
          </button>
        </div>

        <div className="mm-powered">
          POWERED BY MENUMIND AI
        </div>
      </div>
    </>
  );
}
