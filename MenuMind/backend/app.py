from flask import Flask, request, jsonify
from flask_cors import CORS
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
CORS(app)
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
client = Perplexity(
    api_key=os.getenv("PERPLEXITY_API_KEY")
)

neo4j_driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD")),
    database=os.getenv("NEO4J_DATABASE"),
)
# LLM prompt to paraphrase user message, aswer queries based on the menu and extract relevant dishes from menu
def llm_paraphrase(user_message, full_menu):
    try:
        resp = client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a friendly waiter. "
                        "You have been given the full restaurant menu as JSON. "
                        "Answer the customer's question using ONLY the dishes in that JSON. "
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


# Hardcoded menu for now, swap with Neo4j later
#menu = [
    #{"name": "Vegan Bowl", "price": 12.50, "category": "Vegan", "allergens": [], "description": "Quinoa, veggies, tofu"},
    #{"name": "Pasta Primavera", "price": 14.00, "category": "Pasta", "allergens": ["gluten"], "description": "Fresh pasta, seasonal vegetables"},
    #{"name": "Nut Burger", "price": 11.00, "category": "Vegan", "allergens": ["nuts"], "description": "Plant-based patty with cashew sauce"},
    #{"name": "Grilled Salmon", "price": 18.00, "category": "Seafood", "allergens": ["fish"], "description": "Atlantic salmon, lemon butter"},
    #{"name": "Cheese Pizza", "price": 10.00, "category": "Pizza", "allergens": ["gluten", "dairy"], "description": "Classic margherita"},
#]
#menu = []
def save_menu_to_neo4j(restaurant_id, dishes):
    def _tx_save(tx, rid, dishes_list):
        # Remove old dishes for this restaurant
        tx.run(
            """
            MATCH (r:Restaurant {id: $rid})-[:HAS_DISH]->(d:Dish)
            DETACH DELETE d
            """,
            rid=rid,
        )

        # Ensure restaurant node exists
        tx.run(
            """
            MERGE (r:Restaurant {id: $rid})
            """,
            rid=rid,
        )

        # Create new dishes
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
# Basic rule-based parsing to find relevant dishes based on user message patterns
def get_answer(user_message):
    return llm_paraphrase(user_message, menu)  # where menu comes from Gemini/Neo4j now

@app.route("/api/upload-menu", methods=["POST"])
def upload_menu():
    global menu  # we really are updating the global

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = file.filename.lower()
    file_bytes = file.read()

    # Determine mime type based on extension
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
# Teh above code block tells mr. gemini to extract dishes from the menu and return it in a json format
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

        # Ensure each dish has the fields we expect
        normalized_menu = []
        for d in extracted_dishes:
            normalized_menu.append({
                "name": d.get("name", "").strip(),
                "price": float(d.get("price", 0)),
                "category": d.get("category", "Other"),
                "allergens": d.get("allergens", []),
                "description": d.get("description", ""),
            })

        menu = normalized_menu

        return jsonify({
            "status": "ok",
            "message": f"Successfully loaded {len(menu)} dishes from {filename}!",
            "menu": menu,
        })
    except Exception as e:
        print("Upload Error:", e)
        return jsonify({"error": "Failed to parse menu: " + str(e)}), 500

    
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    answer = get_answer(user_message)
    return jsonify({"answer": answer})


@app.route("/api/dishes", methods=["GET"])
def dishes():
    return jsonify(menu)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
