import os
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from dotenv import load_dotenv

from supabase_client import get_supabase
from allocation_fixed import run_allocation

load_dotenv()

def create_app():
    app = Flask(__name__, static_url_path='/static', static_folder='.')
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret")
    app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour
    CORS(app, supports_credentials=True)

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
    
    @app.route("/session_status", methods=["GET"])
    def session_status():
        logged_in = session.get("logged_in", False)
        print(f"Session status check - logged_in: {logged_in}")
        return jsonify({
            "logged_in": logged_in,
            "session_id": session.get("_id", "none")
        })
    
    @app.route("/debug_db", methods=["GET"])
    def debug_db():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            client_type = str(type(supabase))
            print(f"Supabase client type: {client_type}")
            
            # Check all tables
            students = supabase.table("students").select("*").execute()
            internships = supabase.table("internships").select("*").execute()
            allocations = supabase.table("allocations").select("*").execute()
            
            print(f"Students: {len(students.data)}")
            print(f"Internships: {len(internships.data)}")
            print(f"Allocations: {len(allocations.data)}")
            print(f"Allocations data: {allocations.data}")
            
            return jsonify({
                "client_type": client_type,
                "is_mock_client": "Mock" in client_type,
                "students_count": len(students.data),
                "internships_count": len(internships.data),
                "allocations_count": len(allocations.data),
                "allocations_data": allocations.data,
                "students_sample": students.data[:2] if students.data else [],
                "internships_sample": internships.data[:2] if internships.data else []
            })
        except Exception as e:
            print(f"Debug DB error: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/admin_login", methods=["POST"])
    def admin_login():
        print("Admin login attempt received")
        data = request.get_json(silent=True) or {}
        email = str(data.get("email") or "").strip()
        password = str(data.get("password") or "")
        
        print(f"Login attempt - Email: {email}")

        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        
        print(f"Expected - Email: {admin_email}")

        if email == admin_email and password == admin_password:
            session["logged_in"] = True
            session.permanent = True
            print("Login successful - session set")
            return jsonify({"message": "Login successful"}), 200
        else:
            session["logged_in"] = False
            print("Login failed - invalid credentials")
            return jsonify({"message": "Invalid credentials"}), 401
    
    @app.route("/admin_logout", methods=["POST"])
    def admin_logout():
        session.clear()
        print("Admin logged out - session cleared")
        return jsonify({"message": "Logged out successfully"}), 200

    @app.route("/run_allocation", methods=["POST"])
    def run_allocation_route():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401

        try:
            supabase = get_supabase()
            
            # Get students and internships data
            students_response = supabase.table("students").select("*").execute()
            internships_response = supabase.table("internships").select("*").execute()
            
            students_data = students_response.data
            internships_data = internships_response.data
            
            print(f"Found {len(students_data)} students and {len(internships_data)} internships")
            
            if not students_data:
                return jsonify({"error": "No students found", "message": "Please add students to the database first"}), 400
            
            if not internships_data:
                return jsonify({"error": "No internships found", "message": "Please add internships to the database first"}), 400
            
            allocations = run_allocation(students_data, internships_data)
            print(f"Generated {len(allocations)} allocations")

            # Clear existing allocations and insert new ones
            print("Clearing existing allocations...")
            try:
                # First check what allocations exist
                existing_allocations = supabase.table("allocations").select("*").execute()
                print(f"Found {len(existing_allocations.data)} existing allocations before delete")
                
                # Try to delete all allocations
                delete_result = supabase.table("allocations").delete().neq("id", 0).execute()
                print(f"Delete operation completed")
                
                # Verify deletion
                remaining_allocations = supabase.table("allocations").select("*").execute()
                print(f"Found {len(remaining_allocations.data)} allocations after delete")
            except Exception as delete_error:
                print(f"Delete operation failed: {delete_error}")
                # Continue anyway
            
            if allocations:
                allocation_records = [
                    {
                        "student_id": a['student_id'],
                        "internship_id": a['internship_id'],
                        "score": a['score'],
                        "allocation_type": a['allocation_type'],
                        "reason": a['reason']
                    }
                    for a in allocations
                ]
                print(f"Inserting {len(allocation_records)} allocation records...")
                print(f"Sample allocation record: {allocation_records[0] if allocation_records else 'None'}")
                
                insert_result = supabase.table("allocations").insert(allocation_records).execute()
                print(f"Insert operation completed: {len(insert_result.data) if insert_result.data else 0} records inserted")
                print(f"Insert result data: {insert_result.data}")
                
                # Verify insertion
                final_allocations = supabase.table("allocations").select("*").execute()
                print(f"Final verification: {len(final_allocations.data)} allocations in database")
            else:
                print("No allocations to insert")
            
            return jsonify({"message": "Allocation complete", "allocations": allocations}), 200
        except Exception as e:
            return jsonify({"error": "Database error", "message": str(e)}), 500

    @app.route("/get_allocations", methods=["GET"])
    def get_allocations():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
            
        try:
            supabase = get_supabase()
            
            # Fetch allocations first
            allocations_response = supabase.table("allocations").select("*").execute()
            print(f"Raw allocations response: {allocations_response.data}")
            print(f"Found {len(allocations_response.data)} allocations")
            
            if not allocations_response.data:
                print("No allocations found in database")
                return jsonify({"allocations": []}), 200
            
            # Fetch students and internships separately
            students_response = supabase.table("students").select("*").execute()
            internships_response = supabase.table("internships").select("*").execute()
            
            # Create lookup dictionaries
            students_dict = {s["id"]: s for s in students_response.data}
            internships_dict = {i["id"]: i for i in internships_response.data}
            
            # Format the data for the frontend
            allocations_data = []
            for alloc in allocations_response.data:
                student = students_dict.get(alloc.get("student_id"))
                internship = internships_dict.get(alloc.get("internship_id"))
                
                allocations_data.append({
                    "id": alloc["id"],
                    "score": alloc.get("score", 0),
                    "allocation_type": alloc.get("allocation_type", "unknown"),
                    "reason": alloc.get("reason", ""),
                    "student_name": student.get("name", "Unknown") if student else "Unknown",
                    "internship_org": (internship.get("org_name") or internship.get("company", "Unknown")) if internship else "Unknown",
                    "sector": internship.get("sector", "Unknown") if internship else "Unknown",
                    "location": internship.get("location", "Unknown") if internship else "Unknown"
                })
            
            print(f"Returning {len(allocations_data)} formatted allocations")
            return jsonify({"allocations": allocations_data}), 200
        except Exception as e:
            print(f"Error in get_allocations: {e}")
            return jsonify({"error": "Database error", "message": str(e)}), 500
    
    @app.route("/add_internship", methods=["POST"])
    def add_internship():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401

        data = request.get_json(silent=True) or {}
        org_name = data.get("org_name")
        sector = data.get("sector")
        skills_required = data.get("skills_required")
        seats = data.get("seats")
        quota_json = data.get("quota_json")

        if not all([org_name, sector, skills_required, seats]):
            return jsonify({"message": "Missing required fields"}), 400

        try:
            supabase = get_supabase()
            
            internship_data = {
                "org_name": org_name,
                "company": org_name,  # For compatibility
                "sector": sector,
                "skills_required": skills_required,
                "seats": seats,
                "quota_json": quota_json
            }
            
            response = supabase.table("internships").insert(internship_data).execute()
            return jsonify({"message": "Internship added successfully"}), 200
        except Exception as e:
            return jsonify({"error": "Database error", "message": str(e)}), 500

    @app.route("/get_internships", methods=["GET"])
    def get_internships():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
            
        try:
            supabase = get_supabase()
            response = supabase.table("internships").select("*").execute()
            return jsonify({"internships": response.data}), 200
        except Exception as e:
            return jsonify({"error": "Database error", "message": str(e)}), 500

    @app.route("/get_students", methods=["GET"])
    def get_students():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
            
        try:
            supabase = get_supabase()
            response = supabase.table("students").select("*").execute()
            return jsonify({"students": response.data}), 200
        except Exception as e:
            return jsonify({"error": "Database error", "message": str(e)}), 500

    @app.route("/admin_dashboard_data", methods=["GET"])
    def admin_dashboard_data():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
            
        try:
            supabase = get_supabase()
            
            # Get students count and data
            students_response = supabase.table("students").select("*", count="exact").execute()
            students_count = students_response.count
            recent_students = students_response.data[:10]  # Get first 10
            
            # Get internships count and data
            internships_response = supabase.table("internships").select("*", count="exact").execute()
            internships_count = internships_response.count
            recent_internships = internships_response.data[:10]  # Get first 10
            
            # Get allocations count
            allocations_response = supabase.table("allocations").select("*", count="exact").execute()
            allocations_count = allocations_response.count
            
            dashboard_data = {
                "stats": {
                    "total_students": students_count,
                    "total_internships": internships_count,
                    "total_allocations": allocations_count
                },
                "recent_students": recent_students,
                "recent_internships": recent_internships
            }
            
            return jsonify(dashboard_data), 200
        except Exception as e:
            return jsonify({"error": "Database error", "message": str(e)}), 500

    @app.route("/")
    def home():
        return """
        <html>
        <head><title>Optima - Admin & Main App</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🎓 Optima - Smart Internship Allocation</h1>
            <p>Choose your access point:</p>
            <div style="margin: 30px;">
                <a href="/admin" style="display: inline-block; margin: 10px; padding: 15px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px;">🛡️ Admin Dashboard</a>
                <a href="http://localhost:5173" target="_blank" style="display: inline-block; margin: 10px; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px;">🚀 Main App (React)</a>
            </div>
            <p style="color: #666; margin-top: 30px;">Admin credentials: zainab.n.shaikh1346@gmail.com / zainab1346</p>
        </body>
        </html>
        """
    
    @app.route("/admin")
    def admin_redirect():
        return send_from_directory('.', 'admin.html')
    
    @app.route("/admin-dashboard")
    def admin_dashboard_redirect():
        if not session.get("logged_in"):
            print("Unauthorized access to admin dashboard - redirecting to login")
            return """
            <script>
                alert('Please login first');
                window.location.href = '/admin';
            </script>
            """
        print("Authorized access to admin dashboard")
        return send_from_directory('.', 'admin-dashboard.html')
    
    @app.route("/populate_sample_data", methods=["POST"])
    def populate_sample_data():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
            
        try:
            supabase = get_supabase()
            
            # Sample students data
            sample_students = [
                {
                    "name": "Rahul Sharma",
                    "email": "rahul.sharma@example.com",
                    "marks": 85.5,
                    "skills": "Python, Machine Learning, Data Analysis",
                    "category": "GEN",
                    "location_pref": "Mumbai",
                    "sector_pref": "technology"
                },
                {
                    "name": "Priya Patel",
                    "email": "priya.patel@example.com", 
                    "marks": 92.3,
                    "skills": "Java, Spring Boot, React",
                    "category": "OBC",
                    "location_pref": "Bangalore",
                    "sector_pref": "technology"
                },
                {
                    "name": "Amit Kumar",
                    "email": "amit.kumar@example.com",
                    "marks": 78.9,
                    "skills": "Finance, Excel, SQL",
                    "category": "SC",
                    "location_pref": "Delhi",
                    "sector_pref": "finance"
                },
                {
                    "name": "Sneha Reddy",
                    "email": "sneha.reddy@example.com",
                    "marks": 88.7,
                    "skills": "Healthcare, Research, Biology",
                    "category": "GEN",
                    "location_pref": "Hyderabad",
                    "sector_pref": "healthcare"
                },
                {
                    "name": "Vikash Singh",
                    "email": "vikash.singh@example.com",
                    "marks": 81.2,
                    "skills": "Marketing, Digital Marketing, Analytics",
                    "category": "EWS",
                    "location_pref": "Mumbai",
                    "sector_pref": "marketing"
                }
            ]
            
            # Sample internships data
            sample_internships = [
                {
                    "org_name": "TechCorp India",
                    "company": "TechCorp India",
                    "role": "Software Development Intern",
                    "location": "Mumbai",
                    "sector": "technology",
                    "skills_required": "Python, React, JavaScript",
                    "seats": 10,
                    "quota_json": {
                        "GEN": 4,
                        "OBC": 3,
                        "SC": 2,
                        "ST": 1,
                        "EWS": 0
                    }
                },
                {
                    "org_name": "FinanceHub Ltd",
                    "company": "FinanceHub Ltd",
                    "role": "Financial Analyst Intern", 
                    "location": "Delhi",
                    "sector": "finance",
                    "skills_required": "Excel, SQL, Finance",
                    "seats": 8,
                    "quota_json": {
                        "GEN": 3,
                        "OBC": 2,
                        "SC": 2,
                        "ST": 1,
                        "EWS": 0
                    }
                },
                {
                    "org_name": "HealthTech Solutions",
                    "company": "HealthTech Solutions",
                    "role": "Research Intern",
                    "location": "Bangalore", 
                    "sector": "healthcare",
                    "skills_required": "Research, Biology, Healthcare",
                    "seats": 6,
                    "quota_json": {
                        "GEN": 2,
                        "OBC": 2,
                        "SC": 1,
                        "ST": 1,
                        "EWS": 0
                    }
                }
            ]
            
            # Insert sample data
            students_result = supabase.table("students").insert(sample_students).execute()
            internships_result = supabase.table("internships").insert(sample_internships).execute()
            
            return jsonify({
                "message": "Sample data populated successfully",
                "students_added": len(sample_students),
                "internships_added": len(sample_internships)
            }), 200
            
        except Exception as e:
            return jsonify({"error": "Failed to populate data", "message": str(e)}), 500
    
    @app.route("/static/<path:filename>")
    def static_files(filename):
        return send_from_directory('.', filename)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)