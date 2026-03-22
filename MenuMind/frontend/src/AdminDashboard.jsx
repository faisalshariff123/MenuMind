import { useState } from "react";

export default function AdminDashboard() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("AWAITING MENU UPLOAD...");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // demo id
  const restaurantId = "demo-1";

  const handleUpload = async () => {
    if (!file) {
      setStatus("ERROR: NO FILE SELECTED");
      setIsError(true);
      return;
    }
    
    setStatus("UPLOADING AND PARSING DATA...");
    setIsError(false);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);               
    formData.append("restaurant_id", restaurantId);

    try {
      const res = await fetch("https://menumind-zuwu.onrender.com/api/upload-menu", {
        method: "POST",
        body: formData, 
      });
      const data = await res.json();
      if (data.error) {
        setStatus("ERROR: " + data.error);
        setIsError(true);
      } else {
        setStatus(data.message.toUpperCase());
        setIsError(false);
        setFile(null); // clear the file after success
      }
    } catch (e) {
      setStatus("CRITICAL ERROR: " + e.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Silkscreen&family=VT323&display=swap');

        .admin-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f0ebe0;
          background-image: radial-gradient(#d3cdc1 2px, transparent 2px);
          background-size: 16px 16px;
          font-family: 'VT323', monospace;
          padding: 20px;
        }

        .admin-card {
          width: 100%;
          max-width: 500px;
          background: #faf8f4;
          border: 4px solid #1a1208;
          box-shadow: 12px 12px 0px #1a1208;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .admin-header {
          font-family: 'Silkscreen', cursive;
          font-size: 24px;
          color: #1a1208;
          margin: 0;
          text-align: center;
          text-transform: uppercase;
          border-bottom: 4px solid #1a1208;
          padding-bottom: 16px;
        }

        /* Retro Terminal Screen for Status */
        .status-screen {
          background: #1a1208;
          color: #55ff55;
          border: 4px solid #6b5c49;
          padding: 16px;
          min-height: 80px;
          font-size: 20px;
          box-shadow: inset 4px 4px 0px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          line-height: 1.3;
        }
        .status-screen.error { color: #ff5555; }
        .status-screen.loading { animation: pulse 1s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Custom File Input Trick */
        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        }
        .file-input-wrapper input[type="file"] {
          font-size: 100px;
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          cursor: pointer;
          height: 100%;
          z-index: 10;
        }

        .btn {
          background: #faf8f4;
          color: #1a1208;
          border: 4px solid #1a1208;
          padding: 16px;
          font-size: 18px;
          font-family: 'Silkscreen', cursive;
          cursor: pointer;
          box-shadow: 6px 6px 0px #1a1208;
          text-transform: uppercase;
          width: 100%;
          text-align: center;
          transition: background 0.15s, color 0.15s;
          display: block;
          position: relative;
        }
        
        /* Hover triggers for BOTH the direct button and the file input wrapper */
        .btn:hover,
        .file-input-wrapper:hover .btn { 
          background: #1a1208; 
          color: #faf8f4;
        }
        
        .btn:active,
        .file-input-wrapper:active .btn { 
          transform: translate(6px, 6px); 
          box-shadow: none; 
        }
        
        .btn.submit { 
          background: #c9965f; 
          margin-top: 8px; 
        }
        
        /* Ensure disabled buttons don't get the cool hover effect */
        .btn.submit:disabled { 
          background: #d3cdc1; 
          color: #888; 
          cursor: not-allowed; 
          box-shadow: none; 
          transform: translate(6px, 6px); 
        }
        .btn.submit:disabled:hover {
          background: #d3cdc1;
          color: #888;
        }

        .file-name {
          font-size: 22px;
          text-align: center;
          margin: 0;
          min-height: 26px;
          color: #1a1208;
        }
      `}</style>

      <div className="admin-page">
        <div className="admin-card">
          <h1 className="admin-header">Menu Upload Terminal</h1>
          
          <div className={`status-screen ${isError ? "error" : ""} ${loading ? "loading" : ""}`}>
            &gt; {status}
          </div>

          <div className="file-input-wrapper">
            <button className="btn">
              SELECT MENU FILE
            </button>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={loading}
            />
          </div>

          <div className="file-name">
            {file ? `[ ${file.name} ]` : "[ NO FILE SELECTED ]"}
          </div>

          <button 
            className="btn submit" 
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? "PROCESSING..." : "UPLOAD TO DATABASE"}
          </button>
        </div>
      </div>
    </>
  );
}
