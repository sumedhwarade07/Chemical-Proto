import json
import os
from pathlib import Path
from flask import Flask, render_template, jsonify, request, abort

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "content.json"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-detergent-experiment-key")

# Load content dynamically
def load_content():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

CONTENT_DATA = load_content()

@app.context_processor
def inject_content():
    """Make content data globally accessible across all Jinja2 templates."""
    return dict(content=load_content())

@app.after_request
def add_security_headers(response):
    """Enforce standard educational application security headers."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# -----------------
# Page Routes
# -----------------

@app.route("/")
def index():
    """Landing page with video/photo hero, animated waves, team badge, and preview strip."""
    return render_template("index.html", current_page="index")

@app.route("/home")
def home():
    """Overview, objectives, detergent chemistry theory, and team members."""
    return render_template("home.html", current_page="home")

@app.route("/ingredients")
def ingredients():
    """Detailed ingredient breakdowns, safety hazard tags, and chemical reactions."""
    return render_template("ingredients.html", current_page="ingredients")

@app.route("/process")
def process():
    """Interactive animated lab process with 7 scenes and signature filling beaker."""
    return render_template("process.html", current_page="process")

@app.route("/flowchart")
def flowchart():
    """Canva process flow diagram viewer + native animated converging SVG diagram."""
    return render_template("flowchart.html", current_page="flowchart")

@app.route("/gallery")
def gallery():
    """Masonry photo gallery with lightbox, lab video showcase, and upload placeholders."""
    return render_template("gallery.html", current_page="gallery")

@app.route("/applications")
def applications():
    """Pictorial use cases, comparative advantages vs disadvantages, and interactive scale."""
    return render_template("applications.html", current_page="applications")

@app.route("/quiz")
def quiz():
    """Interactive educational quiz and comprehensive accordion FAQ."""
    return render_template("quiz.html", current_page="quiz")

# -----------------
# API Endpoints
# -----------------

@app.route("/api/quiz", methods=["GET"])
def get_quiz():
    """
    Returns quiz questions for client rendering.
    SECURITY MANDATE: Answers and answer indices are strictly scrubbed on server side.
    """
    quiz_items = load_content().get("quiz", [])
    safe_questions = []

    for item in quiz_items:
        safe_questions.append({
            "id": item["id"],
            "q": item["q"],
            "options": item["options"]
        })

    return jsonify({
        "status": "success",
        "count": len(safe_questions),
        "questions": safe_questions
    }), 200

@app.route("/api/score", methods=["POST"])
def score_quiz():
    """
    Scores client quiz submissions on server side.
    Accepts JSON: { "answers": { "q1": 0, "q2": 1, ... } }
    Returns score, total, percentage, and detailed answer explanations.
    """
    if not request.is_json:
        return jsonify({"status": "error", "message": "Request payload must be valid JSON"}), 400

    payload = request.get_json()
    user_answers = payload.get("answers")

    if user_answers is None or not isinstance(user_answers, dict):
        return jsonify({"status": "error", "message": "Missing or invalid 'answers' dictionary"}), 400

    quiz_items = load_content().get("quiz", [])
    results = []
    total_score = 0
    total_questions = len(quiz_items)

    for item in quiz_items:
        q_id = item["id"]
        correct_idx = item["answer_index"]
        correct_option_text = item["options"][correct_idx]
        user_val = user_answers.get(q_id)

        is_correct = False
        if user_val is not None:
            # Check by index (integer or string integer) or exact string
            if isinstance(user_val, int) and user_val == correct_idx:
                is_correct = True
            elif isinstance(user_val, str):
                if user_val.isdigit() and int(user_val) == correct_idx:
                    is_correct = True
                elif user_val.strip() == correct_option_text.strip():
                    is_correct = True

        if is_correct:
            total_score += 1

        results.append({
            "id": q_id,
            "correct": is_correct,
            "user_selection": user_val,
            "correct_index": correct_idx,
            "correct_option": correct_option_text,
            "explanation": item.get("explanation", "")
        })

    percentage = round((total_score / total_questions) * 100, 1) if total_questions > 0 else 0

    return jsonify({
        "status": "success",
        "score": total_score,
        "total": total_questions,
        "percentage": percentage,
        "results": results
    }), 200

# -----------------
# Error Handlers
# -----------------

@app.errorhandler(404)
def page_not_found(e):
    """Custom lab-themed 404 page."""
    if request.path.startswith("/api/"):
        return jsonify({"status": "error", "message": "API endpoint not found"}), 404
    return render_template("404.html", current_page="404"), 404

@app.errorhandler(500)
def server_error(e):
    """Graceful 500 error handler."""
    if request.path.startswith("/api/"):
        return jsonify({"status": "error", "message": "Internal server error"}), 500
    return render_template("404.html", current_page="500", error_code=500), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
