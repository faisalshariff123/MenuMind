from flask import Flask, request, jsonify
from flask_cors import CORS
from perplexity import Perplexity
import os
from dotenv import load_dotenv
load_dotenv()
import pdfplumber
from werkzeug.utils import secure_filename


app = Flask(__name__)
CORS(app)
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
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

    # 1) Name-based keyword search (burger, fish, salmon)
    keywords = []
    if "burger" in msg:
        keywords.append("burger")
    if "fish" in msg:
        keywords.append("fish")
    if "salmon" in msg:
        keywords.append("salmon")
    if "vegetarian" in msg:
        keywords.append("vegetarian")

    if keywords:
        for d in menu:
            name_l = d["name"].lower()
            # match if any keyword appears in the dish name
            if any(k in name_l for k in keywords):
                found_dishes.append(d)
        if found_dishes:
            return llm_paraphrase(user_message, found_dishes)

    # 2) Pattern: cheapest + category
    for cat in ["vegan", "pasta", "pizza", "seafood"]:
        if "cheapest" in msg and cat in msg:
            filtered = [d for d in menu if d["category"].lower() == cat]
            if filtered:
                cheapest = min(filtered, key=lambda x: x["price"])
                found_dishes.append(cheapest)
            return llm_paraphrase(user_message, found_dishes)

    # 3) Pattern: under $X
    for word in msg.split():
        if word.replace("$", "").replace(".", "").isdigit():
            max_price = float(word.replace("$", ""))
            filtered = [d for d in menu if d["price"] <= max_price]
            if filtered:
                filtered.sort(key=lambda x: x["price"])
                found_dishes = filtered
            return llm_paraphrase(user_message, found_dishes)

    # 4) Pattern: allergen exclusion
    allergens_to_avoid = []
    for allergen in ["nuts", "gluten", "dairy", "fish"]:
        if f"no {allergen}" in msg or f"{allergen} free" in msg or f"without {allergen}" in msg:
            allergens_to_avoid.append(allergen)
    if allergens_to_avoid:
        filtered = [d for d in menu if not any(a in d["allergens"] for a in allergens_to_avoid)]
        if filtered:
            found_dishes = filtered
        return llm_paraphrase(user_message, found_dishes)

    # 5) Pattern: show category
    for cat in ["vegan", "pasta", "pizza", "seafood"]:
        if cat in msg:
            filtered = [d for d in menu if d["category"].lower() == cat]
            if filtered:
                found_dishes = filtered
            return llm_paraphrase(user_message, found_dishes)

    # 6) Fallback when nothing matched
    if not found_dishes:
        return (
            "I can only answer questions about the dishes in this menu: "
            "Vegan Bowl, Pasta Primavera, Nut Burger, Grilled Salmon, and Cheese Pizza. "
            "Try asking about these by name, price, or allergens."
        )

    return llm_paraphrase(user_message, found_dishes)

@app.route("/api/upload-menu", methods=["POST"])
def upload_menu():
    global menu # Tell Python we are modifying the global menu variable
    
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        file_bytes = file.read()
        # Gemini accepts native PDFs and images
        mime_type = "application/pdf" if file.filename.lower().endswith(".pdf") else "image/jpeg"

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
            model="gemini-2.0-flash", 
            contents=[prompt, types.Part.from_bytes(data=file_bytes, mime_type=mime_type)]
        )

        # Clean output in case Gemini adds ```json
        raw_text = resp.text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"): raw_text = raw_text[3:-3].strip()

        # Parse JSON and update the global menu!
        extracted_dishes = json.loads(raw_text)
        menu = extracted_dishes 

        return jsonify({
            "status": "ok", 
            "message": f"Successfully loaded {len(menu)} dishes!",
            "menu": menu
        })
    except Exception as e:
        print("Upload Error:", e)
        return jsonify({"error": "Failed to parse menu: " + str(e)}), 50
    
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
