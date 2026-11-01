import pytest
import os
from pathlib import Path
from app import app, CONTENT_DATA

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_all_routes_render_successfully(client):
    """Test all 8 defined educational routes return HTTP 200 and render HTML."""
    routes = [
        "/",
        "/home",
        "/ingredients",
        "/process",
        "/flowchart",
        "/gallery",
        "/applications",
        "/quiz"
    ]
    for route in routes:
        res = client.get(route)
        assert res.status_code == 200, f"Route {route} failed with status {res.status_code}"
        assert b"<!DOCTYPE html>" in res.data or b"<html" in res.data

def test_navbar_structure_and_clickable_logo(client):
    """Verify that navbar has no separate Landing tab, and brand logo links to /."""
    res = client.get("/home")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    
    # Check that logo links to /
    assert 'href="/" class="nav-brand"' in html
    # Check that navigation links include Home, Ingredients, Process, etc.
    assert 'href="/home"' in html
    assert 'href="/ingredients"' in html
    assert 'href="/process"' in html
    assert 'href="/flowchart"' in html
    assert 'href="/gallery"' in html
    assert 'href="/applications"' in html
    assert 'href="/quiz"' in html
    # Check that separate Landing nav-link tab does NOT exist in nav menu
    assert 'class="nav-link' in html
    assert '>Landing</a>' not in html

def test_home_page_hero_and_team_photo(client):
    """Verify Home page has photographic hero with actual team photograph."""
    res = client.get("/home")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert "home-photo-hero" in html
    assert "team-photo.jpg" in html
    assert "Preparation of" in html
    assert "Liquid Detergent" in html
    assert "home-hero-team-strip" in html

def test_process_page_seven_stages_and_gifs(client):
    """Verify Process page renders all 7 stages with GIF media and controls."""
    res = client.get("/process")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    
    for i in range(1, 8):
        assert f"0{i}-" in html or f"scene-step-{i}" in html
        assert f"process/0{i}-" in html
    
    # Check for controls
    assert "play-all-btn" in html
    assert "beaker-liquid-fill" in html
    assert "prev-step-btn" in html
    assert "next-step-btn" in html

def test_process_gifs_exist_on_disk():
    """Verify all 7 process stage GIFs are present in static/media/process/."""
    base_dir = Path(__file__).resolve().parent.parent
    process_dir = base_dir / "static" / "media" / "process"
    
    for i in range(1, 8):
        files = list(process_dir.glob(f"0{i}-*.gif"))
        assert len(files) == 1, f"Missing GIF for stage 0{i}"
        assert files[0].stat().st_size > 5000, f"Stage 0{i} GIF is empty or corrupt"

def test_quiz_api_security(client):
    """MANDATORY SECURITY: /api/quiz must never expose answer_index or correct answers."""
    res = client.get("/api/quiz")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert "questions" in data
    assert len(data["questions"]) == 10

    for q in data["questions"]:
        assert "id" in q
        assert "q" in q
        assert "options" in q
        assert "answer_index" not in q
        assert "answer" not in q
        assert "explanation" not in q

def test_score_api_perfect_score(client):
    """Test /api/score correctly validates answers and returns explanations."""
    quiz_items = CONTENT_DATA.get("quiz", [])
    correct_answers = {item["id"]: item["answer_index"] for item in quiz_items}
    res = client.post("/api/score", json={"answers": correct_answers})
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert data["score"] == len(quiz_items)
    assert data["total"] == len(quiz_items)
    assert data["percentage"] == 100.0
    assert len(data["results"]) == len(quiz_items)
    for r in data["results"]:
        assert r["correct"] is True
        assert "explanation" in r
        assert len(r["explanation"]) > 0

def test_score_api_zero_score(client):
    """Test /api/score handles wrong answers accurately."""
    quiz_items = CONTENT_DATA.get("quiz", [])
    inverted_answers = {item["id"]: (item["answer_index"] + 1) % len(item["options"]) for item in quiz_items}
    res = client.post("/api/score", json={"answers": inverted_answers})
    assert res.status_code == 200
    data = res.get_json()
    assert data["score"] == 0
    assert data["percentage"] == 0.0

def test_score_api_validation(client):
    """Test /api/score payload validation for bad inputs."""
    res = client.post("/api/score", data="not json", content_type="text/plain")
    assert res.status_code == 400

    res = client.post("/api/score", json={"answers": "not a dict"})
    assert res.status_code == 400

    res = client.post("/api/score", json={})
    assert res.status_code == 400

def test_security_headers(client):
    """Verify standard security headers are attached to responses."""
    res = client.get("/")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"

def test_custom_404_handling(client):
    """Verify non-existent routes return 404 HTML and JSON respectively."""
    # HTML 404
    res = client.get("/nonexistent-page")
    assert res.status_code == 404
    assert b"Solution Precipitated" in res.data

    # API 404
    res_api = client.get("/api/nonexistent")
    assert res_api.status_code == 404
    data = res_api.get_json()
    assert data["status"] == "error"

def test_table_3_1_exact_ingredient_quantities(client):
    """Verify Table 3.1 exact experimental formulation quantities and categories."""
    res = client.get("/ingredients")
    assert res.status_code == 200
    html = res.data.decode("utf-8")

    expected_specs = [
        ("Distilled Water", "H2O", "30 ml", "Solvent"),
        ("Sodium Lauryl Sulphate", "SLS", "2 g", "Surfactant"),
        ("Sodium Carbonate", "Na2CO3", "2 g", "Builder"),
        ("Sodium Chloride", "NaCl", "2 g", "Thickener"),
        ("Glycerine", "C3H8O3", "5 ml", "Humectant"),
        ("Copper Sulphate", "CuSO4", "2 g", "Additive"),
        ("Sodium Hydroxide", "NaOH", "2 g", "Alkaline Agent"),
    ]

    assert "QUANTITY USED:" in html
    for name, formula_snippet, qty, cat in expected_specs:
        assert name in html
        assert f">{qty}<" in html or f" {qty} " in html or qty in html
        assert cat in html

def test_formulation_summary_section(client):
    """Verify Experimental Formulation Summary displays 7 total, 5 solids, 2 liquids, and integrity rule."""
    res = client.get("/ingredients")
    assert res.status_code == 200
    html = res.data.decode("utf-8")

    assert "Experimental Formulation Summary" in html
    assert "Total Ingredients" in html
    assert "Solid Reagents (g)" in html
    assert "Liquid Reagents (ml)" in html
    # Rule mandate: Never combine grams and millilitres into one total
    assert "Never combine grams and millilitres into one total" in html

def test_gallery_actual_photos_and_categories(client):
    """Verify Gallery has all 7 categories and the 8 authentic report figures."""
    res = client.get("/gallery")
    assert res.status_code == 200
    html = res.data.decode("utf-8")

    # Categories
    for cat in ["Experimental Setup", "Ingredient Measurement", "Mixing Process", "Heating and Stirring", "Filtration", "Final Product", "Team"]:
        assert cat in html

    # Authentic figures
    base_dir = Path(__file__).resolve().parent.parent
    gallery_dir = base_dir / "static" / "media" / "gallery"

    expected_files = [
        "setup-prototype.jpg",
        "measurement-raw-materials.jpg",
        "mixing-beaker.jpg",
        "heating-stirring-magnetic.jpg",
        "filtration-funnel.jpg",
        "final-product-storage.jpg",
        "final-product-sample.jpg",
        "team-group.jpg"
    ]
    for fn in expected_files:
        assert (gallery_dir / fn).exists(), f"Missing gallery photograph: {fn}"
        assert (gallery_dir / fn).stat().st_size > 10000, f"Gallery photo {fn} is too small or corrupt"
        assert fn in html

def test_video_documentation_section(client):
    """Verify the 5 video cards and playback integration in /gallery."""
    res = client.get("/gallery")
    assert res.status_code == 200
    html = res.data.decode("utf-8")

    assert "Experimental Video Documentation" in html
    assert "video-01-ingredient-measurement.mp4" in html
    assert "video-02-mixing-process.mp4" in html
    assert "video-03-heating-and-stirring.mp4" in html
    assert "video-04-filtration.mp4" in html
    assert "video-05-final-product.mp4" in html

    # Actual video files present
    base_dir = Path(__file__).resolve().parent.parent
    video_dir = base_dir / "static" / "media" / "videos"
    assert (video_dir / "video-02-mixing-process.mp4").exists()
    assert (video_dir / "video-02-mixing-process.mp4").stat().st_size > 100000
    assert (video_dir / "video-03-heating-and-stirring.mp4").exists()
    assert (video_dir / "video-03-heating-and-stirring.mp4").stat().st_size > 100000

def test_process_9_stages_and_table_5_1_observations(client):
    """Verify the 9 systematic stages and Table 5.1 actual physical observations on /process."""
    res = client.get("/process")
    assert res.status_code == 200
    html = res.data.decode("utf-8")

    # 9 Systematic Experimental Stages
    assert "9 Systematic Experimental Stages" in html
    for step_num in range(1, 10):
        assert f"Step {step_num}" in html

    # Table 5.1 Physical Observations
    assert "Table 5.1 Official Laboratory Data" in html
    assert "Dark blue-green" in html
    assert "To be measured" in html
    assert "Scientific Integrity Compliance" in html
