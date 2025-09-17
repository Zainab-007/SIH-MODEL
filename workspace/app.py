import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from supabase_client import get_supabase
from allocation import run_allocation


def create_app() -> Flask:
    app = Flask(__name__)
    # Enable sessions
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret")
    # Allow cookies for session during fetch
    CORS(app, supports_credentials=True)

    supabase = get_supabase()

    @app.errorhandler(Exception)
    def handle_exception(err):
        if isinstance(err, HTTPException):
            return jsonify({
                "error": err.name,
                "message": err.description,
                "status": err.code,
            }), err.code
        return jsonify({
            "error": "Internal Server Error",
            "message": str(err),
            "status": 500,
        }), 500

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    @app.route("/admin_login", methods=["POST"])
    def admin_login():
        data = request.get_json(silent=True) or {}
        email = str(data.get("email") or "").strip()
        password = str(data.get("password") or "")

        admin_email = os.getenv("ADMIN_EMAIL", "")
        admin_password = os.getenv("ADMIN_PASSWORD", "")

        if not admin_email or not admin_password:
            return jsonify({"error": "ServerMisconfigured", "message": "ADMIN_EMAIL/ADMIN_PASSWORD not set"}), 500

        if email == admin_email and password == admin_password:
            session["is_admin"] = True
            return jsonify({"success": True})
        return jsonify({"error": "Unauthorized", "message": "Invalid credentials"}), 403

    @app.route("/admin_logout", methods=["POST"])
    def admin_logout():
        session.clear()
        return jsonify({"success": True})

    @app.route("/add_student", methods=["POST"])
    def add_student():
        data = request.get_json(silent=True) or {}
        required = ["name", "marks", "skills", "category", "location_pref", "sector_pref"]
        missing = [k for k in required if k not in data]
        if missing:
            return jsonify({"error": "ValidationError", "message": f"Missing fields: {', '.join(missing)}"}), 400

        try:
            marks = float(data["marks"])
        except Exception:
            return jsonify({"error": "ValidationError", "message": "marks must be a number"}), 400

        student_row = {
            "name": data["name"],
            "marks": marks,
            "skills": normalize_string_list(data.get("skills", [])),
            "category": str(data["category"]),
            "location_pref": str(data["location_pref"]),
            "sector_pref": str(data["sector_pref"]),
        }

        result = supabase.table("students").insert(student_row).execute()
        return jsonify({"data": result.data}), 201

    @app.route("/add_internship", methods=["POST"])
    def add_internship():
        data = request.get_json(silent=True) or {}
        required = ["org_name", "sector", "skills_required", "seats", "quota_json", "location"]
        missing = [k for k in required if k not in data]
        if missing:
            return jsonify({"error": "ValidationError", "message": f"Missing fields: {', '.join(missing)}"}), 400

        try:
            seats = int(data["seats"])
        except Exception:
            return jsonify({"error": "ValidationError", "message": "seats must be an integer"}), 400
        if seats < 0:
            return jsonify({"error": "ValidationError", "message": "seats must be a non-negative integer"}), 400

        internship_row = {
            "org_name": data["org_name"],
            "sector": str(data["sector"]),
            "skills_required": normalize_string_list(data.get("skills_required", [])),
            "seats": seats,
            "quota_json": data.get("quota_json") or {},
            "location": str(data["location"]),
        }

        result = supabase.table("internships").insert(internship_row).execute()
        return jsonify({"data": result.data}), 201

    @app.route("/allocate", methods=["POST"])
    def allocate():
        students_res = supabase.table("students").select("*").execute()
        internships_res = supabase.table("internships").select("*").execute()
        students = students_res.data or []
        internships = internships_res.data or []

        allocations = run_allocation(students, internships)
        if not allocations:
            return jsonify({"allocations": []}), 200

        insert_res = supabase.table("allocations").insert(allocations).execute()
        return jsonify({"allocations": insert_res.data}), 201

    @app.route("/allocations", methods=["GET"])
    def get_allocations():
        # Admin-only
        if not session.get("is_admin"):
            return jsonify({"error": "Unauthorized", "message": "Admin login required"}), 403

        alloc_res = supabase.table("allocations").select("*").order("created_at", desc=True).execute()
        allocations = alloc_res.data or []

        if not allocations:
            return jsonify({"allocations": []})

        student_ids = sorted({a["student_id"] for a in allocations if a.get("student_id") is not None})
        internship_ids = sorted({a["internship_id"] for a in allocations if a.get("internship_id") is not None})

        students_map = {}
        internships_map = {}

        if student_ids:
            students_data = (
                supabase
                .table("students")
                .select("id,name,category,location_pref,sector_pref,skills,marks")
                .in_("id", student_ids)
                .execute()
            ).data or []
            students_map = {s["id"]: s for s in students_data}

        if internship_ids:
            internships_data = (
                supabase
                .table("internships")
                .select("id,org_name,sector,location,skills_required,seats,quota_json")
                .in_("id", internship_ids)
                .execute()
            ).data or []
            internships_map = {i["id"]: i for i in internships_data}

        enriched = []
        for a in allocations:
            s = students_map.get(a.get("student_id"))
            i = internships_map.get(a.get("internship_id"))
            enriched.append({
                "id": a.get("id"),
                "student_id": a.get("student_id"),
                "student_name": s.get("name") if s else None,
                "internship_id": a.get("internship_id"),
                "internship_org": i.get("org_name") if i else None,
                "sector": i.get("sector") if i else None,
                "location": i.get("location") if i else None,
                "score": a.get("score"),
                "allocation_type": a.get("allocation_type"),
                "reason": a.get("reason"),
                "created_at": a.get("created_at"),
            })

        return jsonify({"allocations": enriched})

    return app


def normalize_string_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return [v.strip() for v in str(value).split(",") if v.strip()]


app = create_app()

if __name__ == "__main__":
    # Run on 8000 for frontend to call
    app.run(host="0.0.0.0", port=8000, debug=True)