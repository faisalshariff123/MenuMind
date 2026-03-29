from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from perplexity import Perplexity
import os
from dotenv import load_dotenv
load_dotenv()
import pdfplumber
from werkzeug.utils import secure_filename
from google import genai
from google.genai import types
import json
from neo4j import GraphDatabase


app = Flask(__name__)
CORS(app, origins="*", allow_headers=["Content-Type"], methods=["GET", "POST", "OPTIONS"])


try:
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print("Gemini init failed:", e)
    gemini_client = None

try:
    perplexity_client = Perplexity(api_key=os.getenv("PERPLEXITY_API_KEY"))
except Exception as e:
    print("Perplexity init failed:", e)
    perplexity_client = None

try:
    neo4j_driver = GraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD")),
        database=os.getenv("NEO4J_DATABASE"),
    )
except Exception as e:
    print("Neo4j connection failed:", e)
    neo4j_driver = None


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "gemini": gemini_client is not None,
        "perplexity": perplexity_client is not None,
        "neo4j": neo4j_driver is not None,
    })


def llm_paraphrase(user_message, full_menu):
    if perplexity_client is None:
        return "AI service unavailable — missing API key."
    try:
        resp = perplexity_client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a friendly waiter. "
                        "You have been given the full restaurant menu as JSON. "
                        "Answer the customer's question using ONLY the dishes in that JSON. And do NOT make the characters or words BOLD. "
                        "Filter, compare, recommend, and explain dishes based on what the customer asks. "
                        "Do NOT invent dishes, prices, ingredients, or allergens not present in the JSON. "
                        "If no dishes match the customer's request, say so honestly."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Customer question: {user_message}\n\n"
                        f"Full menu (JSON): {full_menu}"
                    ),
                },
            ],
            disable_search=True,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print("Perplexity error:", e)
        return "Whoops! Having some trouble thinking right now."


def save_menu_to_neo4j(restaurant_id, dishes):
    if neo4j_driver is None:
        print("Neo4j unavailable — skipping save.")
        return

    def _tx_save(tx, rid, dishes_list):
        tx.run(
            """
            MATCH (r:Restaurant {id: $rid})-[:HAS_DISH]->(d:Dish)
            DETACH DELETE d
            """,
            rid=rid,
        )
        tx.run(
            """
            MERGE (r:Restaurant {id: $rid})
            """,
            rid=rid,
        )
        for d in dishes_list:
            tx.run(
                """
                MATCH (r:Restaurant {id: $rid})
                CREATE (r)-[:HAS_DISH]->(:Dish {
                    name: $name,
                    price: $price,
                    category: $category,
                    allergens: $allergens,
                    description: $description
                })
                """,
                rid=rid,
                name=d["name"],
                price=d["price"],
                category=d["category"],
                allergens=d["allergens"],
                description=d["description"],
            )

    with neo4j_driver.session() as session:
        session.execute_write(_tx_save, restaurant_id, dishes)


def load_menu_from_neo4j(restaurant_id):
    if neo4j_driver is None:
        print("Neo4j unavailable — returning empty menu.")
        return []

    with neo4j_driver.session() as session:
        result = session.run(
            """
            MATCH (r:Restaurant {id: $rid})-[:HAS_DISH]->(d:Dish)
            RETURN d.name AS name,
                   d.price AS price,
                   d.category AS category,
                   d.allergens AS allergens,
                   d.description AS description
            """,
            rid=restaurant_id,
        )
        return [dict(record) for record in result]


def get_answer(user_message, restaurant_id):
    menu = load_menu_from_neo4j(restaurant_id)
    return llm_paraphrase(user_message, menu)


@app.route("/api/upload-menu", methods=["POST", "OPTIONS"])
@cross_origin(origins="*")
def upload_menu():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    if gemini_client is None:
        return jsonify({"error": "Gemini API key not configured on server."}), 500

    restaurant_id = request.form.get("restaurant_id", "demo-1")

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = file.filename.lower()
    file_bytes = file.read()

    if filename.endswith(".pdf"):
        mime_type = "application/pdf"
    elif filename.endswith(".png"):
        mime_type = "image/png"
    elif filename.endswith(".jpg") or filename.endswith(".jpeg"):
        mime_type = "image/jpeg"
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    try:
        prompt = """
        Read this restaurant menu. Extract all dishes into a valid JSON array.
        Each dish must be an object with exactly these keys:
        - "name" (string)
        - "price" (number)
        - "category" (string, e.g. "Vegan", "Pasta", "Pizza", "Seafood")
        - "allergens" (array of strings, e.g. ["nuts", "gluten"])
        - "description" (string)
        Output ONLY the raw JSON array. No markdown, no codeblocks, no explanations.
        """
        resp = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            ],
        )

        raw_text = resp.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()

        extracted_dishes = json.loads(raw_text)

        normalized_menu = []
        for d in extracted_dishes:
            normalized_menu.append({
                "name": d.get("name", "").strip(),
                "price": float(d.get("price", 0)),
                "category": d.get("category", "Other"),
                "allergens": d.get("allergens", []),
                "description": d.get("description", ""),
            })

        save_menu_to_neo4j(restaurant_id, normalized_menu)

        return jsonify({
            "status": "ok",
            "message": f"Successfully loaded {len(normalized_menu)} dishes from {filename}!",
            "menu": normalized_menu,
        })
    except Exception as e:
        print("Upload Error:", e)
        return jsonify({"error": "Failed to parse menu: " + str(e)}), 500


@app.route("/api/chat", methods=["POST", "OPTIONS"])
@cross_origin(origins="*")
def chat():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    user_message = data.get("message", "")
    restaurant_id = data.get("restaurant_id", "demo-1")
    answer = get_answer(user_message, restaurant_id)
    return jsonify({"answer": answer})


@app.route("/api/dishes", methods=["GET"])
def dishes():
    restaurant_id = request.args.get("restaurant_id", "demo-1")
    menu = load_menu_from_neo4j(restaurant_id)
    return jsonify(menu)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)
