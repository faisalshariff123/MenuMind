// src/App.jsx
import { useState } from 'react'
import ChatWidget from './ChatWidget' // <-- 1. Import the widget

function App() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0ebe0" }}>
      {/* 2. Render the widget here instead of the default Vite stuff */}
      <ChatWidget />
    </div>
  )
}

export default App
