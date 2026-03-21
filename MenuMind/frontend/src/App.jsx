import { useState } from "react";
import ChatWidget from "./ChatWidget";

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mm-page {
          min-height: 100vh;
          background: #0c0b08;
          font-family: 'DM Sans', sans-serif;
          color: #f0ebe0;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle vignette overlay */
        .mm-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(201,150,95,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* NAV */
        .mm-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 48px;
          border-bottom: 1px solid rgba(240,235,224,0.07);
          background: rgba(12,11,8,0.85);
          backdrop-filter: blur(12px);
        }
        .mm-nav-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: #f0ebe0;
          text-transform: uppercase;
        }
        .mm-nav-links {
          display: flex;
          gap: 36px;
        }
        .mm-nav-link {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240,235,224,0.55);
          text-decoration: none;
          transition: color 0.2s;
        }
        .mm-nav-link:hover { color: #f0ebe0; }
        .mm-nav-cta {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c9965f;
          text-decoration: none;
          border: 1px solid rgba(201,150,95,0.4);
          padding: 7px 18px;
          border-radius: 2px;
          transition: background 0.2s, color 0.2s;
        }
        .mm-nav-cta:hover { background: #c9965f; color: #0c0b08; }

        /* HERO */
        .mm-hero {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          min-height: 100vh;
          padding: 0 48px 0 72px;
          max-width: 760px;
        }
        .mm-hero-label {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #c9965f;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mm-hero-label::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: #c9965f;
        }
        .mm-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 7vw, 88px);
          font-weight: 300;
          line-height: 1.04;
          letter-spacing: -0.01em;
          color: #f0ebe0;
          margin-bottom: 32px;
        }
        .mm-hero-title em {
          font-style: italic;
          color: #c9965f;
        }
        .mm-hero-desc {
          font-size: 15px;
          font-weight: 300;
          color: rgba(240,235,224,0.55);
          letter-spacing: 0.04em;
          margin-bottom: 44px;
          max-width: 380px;
          line-height: 1.7;
        }
        .mm-hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .mm-btn-primary {
          background: #c9965f;
          color: #0c0b08;
          border: none;
          padding: 13px 30px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .mm-btn-primary:hover { background: #dba96e; }
        .mm-btn-primary:active { transform: scale(0.98); }
        .mm-btn-ghost {
          background: transparent;
          color: rgba(240,235,224,0.6);
          border: 1px solid rgba(240,235,224,0.2);
          padding: 12px 28px;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .mm-btn-ghost:hover {
          border-color: rgba(240,235,224,0.45);
          color: #f0ebe0;
        }

        /* Decorative horizontal rule */
        .mm-rule {
          position: absolute;
          bottom: 48px;
          left: 72px;
          right: 48px;
          height: 1px;
          background: rgba(240,235,224,0.07);
          z-index: 1;
        }
        .mm-scroll-hint {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(240,235,224,0.25);
          z-index: 1;
        }

        /* Decorative right panel image placeholder */
        .mm-hero-img {
          position: fixed;
          top: 0; right: 0;
          width: 42vw;
          height: 100vh;
          background: linear-gradient(135deg, #1a1208 0%, #0c0b08 100%);
          z-index: 0;
          overflow: hidden;
        }
        .mm-hero-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 600' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='200' cy='300' r='180' fill='none' stroke='rgba(201,150,95,0.08)' stroke-width='1'/%3E%3Ccircle cx='200' cy='300' r='140' fill='none' stroke='rgba(201,150,95,0.05)' stroke-width='1'/%3E%3Ccircle cx='200' cy='300' r='100' fill='none' stroke='rgba(201,150,95,0.06)' stroke-width='1'/%3E%3Cline x1='20' y1='300' x2='380' y2='300' stroke='rgba(201,150,95,0.06)' stroke-width='0.5'/%3E%3Cline x1='200' y1='120' x2='200' y2='480' stroke='rgba(201,150,95,0.06)' stroke-width='0.5'/%3E%3C/svg%3E") center / cover no-repeat;
        }
        .mm-hero-img-left-fade {
          position: absolute;
          top: 0; left: 0;
          width: 120px;
          height: 100%;
          background: linear-gradient(to right, #0c0b08, transparent);
          z-index: 1;
        }
        .mm-hero-img-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 2;
        }
        .mm-dish-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(201,150,95,0.5);
        }
        .mm-dish-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          color: rgba(201,150,95,0.12);
          line-height: 1;
          margin-top: 4px;
        }

        /* CHAT BUBBLE TRIGGER */
        .mm-chat-trigger {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #c9965f;
          color: #0c0b08;
          border: none;
          border-radius: 100px;
          padding: 13px 20px 13px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(201,150,95,0.35), 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.2s, box-shadow 0.2s, background 0.15s;
          animation: mm-bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
        }
        @keyframes mm-bounce-in {
          from { opacity: 0; transform: scale(0.7) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .mm-chat-trigger:hover {
          background: #dba96e;
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(201,150,95,0.4), 0 2px 8px rgba(0,0,0,0.25);
        }
        .mm-chat-trigger:active { transform: scale(0.97); }
        .mm-chat-trigger-icon {
          width: 28px;
          height: 28px;
          background: rgba(0,0,0,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .mm-chat-trigger-pulse {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 12px;
          height: 12px;
          background: #2ecc71;
          border-radius: 50%;
          border: 2px solid #0c0b08;
          animation: mm-pulse 2s infinite;
        }
        @keyframes mm-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }

        /* CHAT WINDOW CONTAINER */
        .mm-chat-window {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 100;
        }
      `}</style>

      <div className="mm-page">
        {/* Decorative right panel */}
        <div className="mm-hero-img" aria-hidden="true">
          <div className="mm-hero-img-left-fade" />
          <div className="mm-hero-img-text">
            <p className="mm-dish-name">Signature</p>
            <p className="mm-dish-price">$18</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mm-nav">
          <span className="mm-nav-brand">Osteria</span>
          <div className="mm-nav-links">
            <a href="#" className="mm-nav-link">Menu</a>
            <a href="#" className="mm-nav-link">Story</a>
            <a href="#" className="mm-nav-link">Events</a>
          </div>
          <a href="#" className="mm-nav-cta">Reserve</a>
        </nav>

        {/* Hero */}
        <section className="mm-hero">
          <p className="mm-hero-label">Est. 2019 · San Francisco</p>
          <h1 className="mm-hero-title">
            Where Every<br />
            <em>Dish Tells</em><br />
            a Story
          </h1>
          <p className="mm-hero-desc">
            Seasonal Italian cuisine crafted with intention. Fresh ingredients, honest flavors, a warm welcome.
          </p>
          <div className="mm-hero-actions">
            <button className="mm-btn-primary">View Menu</button>
            <button className="mm-btn-ghost">Our Story</button>
          </div>
        </section>

        <div className="mm-rule" aria-hidden="true" />
        <p className="mm-scroll-hint">Explore</p>

        {/* Floating Chat Button */}
        {!chatOpen && (
          <button
            className="mm-chat-trigger"
            onClick={() => setChatOpen(true)}
            aria-label="Open menu assistant"
          >
            <div className="mm-chat-trigger-pulse" />
            <div className="mm-chat-trigger-icon">🍽️</div>
            Ask about our menu
          </button>
        )}

        {/* Chat Widget */}
        {chatOpen && (
          <div className="mm-chat-window">
            <ChatWidget onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}