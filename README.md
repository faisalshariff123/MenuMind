# MenuMind

**Live demo → [menumind-1.onrender.com](https://menumind-1.onrender.com)**

Restaurant owners spend way too much time answering the same questions — "do you have anything vegan?", "what's gluten free?", "what can I get under $15?". MenuMind lets them upload their menu once and get an RAG AI chatbot they can embed on their site that handles all of that automatically.

Built at Hack Hayward 2026 in about 19 hours.

---

## How it works

You upload a PDF or image of your menu. Gemini reads it and pulls out every dish — name, price, category, allergens, description — and stores it in a Neo4j graph database. From there, customers can ask natural language questions and Perplexity Sonar answers them based only on what's actually on the menu.

The graph structure makes it easy to do things like "cheapest vegan dish with no nuts under $15" without needing a vector database or embeddings. It's just a well-structured knowledge graph with a good prompt on top.

---

## Stack

- **Frontend** — React + Vite, deployed on Render
- **Backend** — Flask + Gunicorn, deployed on Render
- **Database** — Neo4j AuraDB
- **Menu parsing** — Google Gemini 2.5 Flash
- **Chat** — Perplexity Sonar

---

## Running locally

You need API keys for Gemini, Perplexity, and a Neo4j instance before anything works.

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

---

## Environment variables

Create a `.env` file in `backend/` with:

```
GEMINI_API_KEY=
PERPLEXITY_API_KEY=
NEO4J_URI=
NEO4J_USER=
NEO4J_PASSWORD=
NEO4J_DATABASE=
```

---

## Project structure

```
MenuMind/
├── backend/
│   ├── app.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        └── ChatWidget.jsx
```

---

## Team

Built by Faisal Shariff and Syed Rizwanuddin at Hack Hayward 2026.
