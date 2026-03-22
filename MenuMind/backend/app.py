from flask import Flask, request, jsonify
from flask_cors import CORS
from perplexity import Perplexity
import os
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
CORS(app)

client = Perplexity(
    api_key=os.getenv("PERPLEXITY_API_KEY")
)
# LLM prompt to paraphrase user message, aswer queries based on the menu and extract relevant dishes from menu
def llm_paraphrase(user_message, found_dishes):
    try:
        resp = client.chat.completions.create(
            model="sonar", 
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a friendly waiter for a restaurant called MenuMind. "
                        "Using ONLY the dishes provided as JSON, answer clearly. "
                        "Do NOT invent dishes, ingredients, or prices."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"User question: {user_message}\n\n"
                        f"Relevant dishes (JSON): {found_dishes}"
                    ),
                },
            ],
            disable_search=True,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print("Perplexity error:", e)
        return "Whoops! Having some trouble thinking right now, but we do have some great options for you."

# Hardcoded menu for now — swap with Neo4j later
menu = [
    {"name": "Vegan Bowl", "price": 12.50, "category": "Vegan", "allergens": [], "description": "Quinoa, veggies, tofu"},
    {"name": "Pasta Primavera", "price": 14.00, "category": "Pasta", "allergens": ["gluten"], "description": "Fresh pasta, seasonal vegetables"},
    {"name": "Nut Burger", "price": 11.00, "category": "Vegan", "allergens": ["nuts"], "description": "Plant-based patty with cashew sauce"},
    {"name": "Grilled Salmon", "price": 18.00, "category": "Seafood", "allergens": ["fish"], "description": "Atlantic salmon, lemon butter"},
    {"name": "Cheese Pizza", "price": 10.00, "category": "Pizza", "allergens": ["gluten", "dairy"], "description": "Classic margherita"},
]
# Basic rule-based parsing to find relevant dishes based on user message patterns
def get_answer(user_message):
    msg = user_message.lower()
    found_dishes = []

    # Pattern: cheapest + category
    for cat in ["vegan", "pasta", "pizza", "seafood"]:
        if "cheapest" in msg and cat in msg:
            filtered = [d for d in menu if d["category"].lower() == cat]
            if filtered:
                cheapest = min(filtered, key=lambda x: x["price"])
                found_dishes.append(cheapest)

            return llm_paraphrase(user_message, found_dishes)
    # Pattern: under $X
    for word in msg.split():
        if word.replace("$", "").replace(".", "").isdigit():
            max_price = float(word.replace("$", ""))
            filtered = [d for d in menu if d["price"] <= max_price]
            if filtered:
                filtered.sort(key=lambda x: x["price"])
                found_dishes = filtered
            return llm_paraphrase(user_message, found_dishes)

    # Pattern: allergen exclusion
    allergens_to_avoid = []
    for allergen in ["nuts", "gluten", "dairy", "fish"]:
        if f"no {allergen}" in msg or f"{allergen} free" in msg or f"without {allergen}" in msg:
            allergens_to_avoid.append(allergen)
    if allergens_to_avoid:
        filtered = [d for d in menu if not any(a in d["allergens"] for a in allergens_to_avoid)]
        if filtered:
            found_dishes = filtered
        return llm_paraphrase(user_message, found_dishes)

    # Pattern: show category
    for cat in ["vegan", "pasta", "pizza", "seafood"]:
        if cat in msg:
            filtered = [d for d in menu if d["category"].lower() == cat]
            if filtered:
                found_dishes = filtered
            return llm_paraphrase(user_message, found_dishes)

    return llm_paraphrase(user_message, found_dishes)
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
