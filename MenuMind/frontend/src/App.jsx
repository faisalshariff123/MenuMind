// src/App.jsx
import ChatWidget from './Chatwidget';
import AdminDashboard from './AdminDashboard';

function App() {
  const params = new URLSearchParams(window.location.search);
  const isAdmin = params.get('admin') === '1';

  if (isAdmin) {
    return <AdminDashboard />;
  }
}


  // --- CUSTOMER VIEW ---
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Silkscreen&family=VT323&display=swap');

        .customer-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          background-color: #f0ebe0;
          background-image: radial-gradient(#d3cdc1 2px, transparent 2px);
          background-size: 16px 16px;
          font-family: 'VT323', monospace;
          padding: 40px 20px;
        }

        .hero-banner {
          background: #c9965f;
          border: 4px solid #1a1208;
          box-shadow: 10px 10px 0px #1a1208;
          padding: 30px 40px; /* Made padding smaller */
          text-align: center;
          max-width: 800px;
          margin-top: 6vh;
          animation: float-block 3s steps(4, end) infinite;
        }

        @keyframes float-block {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .restaurant-title {
          font-family: 'Silkscreen', cursive;
          font-size: 40px; /* Reduced from 56px */
          color: #faf8f4;
          text-shadow: 4px 4px 0px #1a1208;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          line-height: 1.1;
        }

        .welcome-text {
          font-size: 22px; /* Reduced slightly to match */
          color: #1a1208;
          margin: 0;
          background: #faf8f4;
          padding: 12px 20px;
          border: 4px solid #1a1208;
          display: inline-block;
          box-shadow: inset 4px 4px 0px rgba(0,0,0,0.1);
          text-transform: uppercase;
        }

        .welcome-text span {
          animation: blink 1s steps(2, start) infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        .chat-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        /* --- NEW: Bottom Left Admin Box --- */
        .admin-cta {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: #faf8f4;
          border: 4px solid #1a1208;
          box-shadow: 6px 6px 0px #1a1208;
          padding: 12px 16px;
          color: #1a1208;
          text-decoration: none;
          z-index: 1000;
          transition: background 0.15s, color 0.15s;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-cta:hover {
          background: #1a1208;
          color: #faf8f4;
        }

        .admin-cta:active {
          transform: translate(6px, 6px);
          box-shadow: none;
        }

        .admin-cta-title {
          font-family: 'Silkscreen', cursive;
          font-size: 12px;
          margin: 0;
          border-bottom: 2px solid currentColor;
          padding-bottom: 4px;
          margin-bottom: 4px;
        }

        .admin-cta-text {
          font-size: 18px;
          margin: 0;
          line-height: 1.1;
        }
      `}</style>
      
      <div className="customer-page">
        <div className="hero-banner">
          <h1 className="restaurant-title">The Rusty Spoon</h1>
          <p className="welcome-text">
            <span>&gt;</span> CHAT WITH MENUMIND AI!
          </p>
        </div>
        
        {/* NEW: Bottom Left Admin Link */}
        <a href="/?admin=1" className="admin-cta">
          <p className="admin-cta-title">⚙️ SYSTEM SETTINGS</p>
          <p className="admin-cta-text">Want your own Menu bot?</p>
          <p className="admin-cta-text">Click to access Admin Panel</p>
        </a>
      


        {/* The widget sits on top of the customer site */}
        <div className="chat-container">
          <ChatWidget />
        </div>
      </div>
    </>
  );
}

export default App;
