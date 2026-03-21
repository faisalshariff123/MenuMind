from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Hardcoded menu for now — swap with Neo4j later
menu = [
    {"name": "Vegan Bowl", "price": 12.50, "category": "Vegan", "allergens": [], "description": "Quinoa, veggies, tofu"},
    {"name": "Pasta Primavera", "price": 14.00, "category": "Pasta", "allergens": ["gluten"], "description": "Fresh pasta, seasonal vegetables"},
    {"name": "Nut Burger", "price": 11.00, "category": "Vegan", "allergens": ["nuts"], "description": "Plant-based patty with cashew sauce"},
    {"name": "Grilled Salmon", "price": 18.00, "category": "Seafood", "allergens": ["fish"], "description": "Atlantic salmon, lemon butter"},
    {"name": "Cheese Pizza", "price": 10.00, "category": "Pizza", "allergens": ["gluten", "dairy"], "description": "Classic margherita"},
]

def get_answer(user_message):
    msg = user_message.lower()

    # Pattern: cheapest + category
    for cat in ["vegan", "pasta", "pizza", "seafood"]:
        if "cheapest" in msg and cat in msg:
            filtered = [d for d in menu if d["category"].lower() == cat]
            if filtered:
                dish = min(filtered, key=lambda x: x["price"])
                return f"Our cheapest {cat} dish is {dish['name']} at ${dish['price']:.2f}. {dish['description']}."

    # Pattern: under $X
    for word in msg.split():
        if word.replace("$", "").replace(".", "").isdigit():
            max_price = float(word.replace("$", ""))
            filtered = [d for d in menu if d["price"] <= max_price]
            if filtered:
                filtered.sort(key=lambda x: x["price"])
                names = ", ".join(f"{d['name']} (${d['price']:.2f})" for d in filtered)
                return f"Dishes under ${max_price:.0f}: {names}."

    # Pattern: allergen exclusion
    allergens_to_avoid = []
    for allergen in ["nuts", "gluten", "dairy", "fish"]:
        if f"no {allergen}" in msg or f"{allergen} free" in msg or f"without {allergen}" in msg:
            allergens_to_avoid.append(allergen)
    if allergens_to_avoid:
        filtered = [d for d in menu if not any(a in d["allergens"] for a in allergens_to_avoid)]
        if filtered:
            names = ", ".join(d["name"] for d in filtered)
            return f"Dishes without {', '.join(allergens_to_avoid)}: {names}."

    # Pattern: show category
    for cat in ["vegan", "pasta", "pizza", "seafood"]:
        if cat in msg:
            filtered = [d for d in menu if d["category"].lower() == cat]
            if filtered:
                names = ", ".join(f"{d['name']} (${d['price']:.2f})" for d in filtered)
                return f"Our {cat} dishes: {names}."

    return "I can help you find vegan options, dishes under a price, or filter by allergens. Try asking something like 'cheapest vegan dish' or 'no nuts'!"


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
