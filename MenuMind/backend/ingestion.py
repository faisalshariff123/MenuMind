import pdfplumber
from werkzeug.utils import secure_filename


@app.route("/api/upload-menu", methods=["POST"])
def upload_menu():
    # "file" should match the name of the field in your frontend form / fetch
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # You can either save then open, or open directly from the file object.
    # Directly from file object:
    with pdfplumber.open(file) as pdf:
        first_page = pdf.pages[0]
        # Example: inspect first char or text
        first_char = first_page.chars[0] if first_page.chars else None
        first_text = first_page.extract_text()

    # For now just return something simple
    return jsonify({
        "status": "ok",
        "first_char": first_char,
        "first_page_text_preview": first_text[:200] if first_text else None,
    })