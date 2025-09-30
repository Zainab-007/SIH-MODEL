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
    
    @app.route("/test_allocation_insert", methods=["POST"])
    def test_allocation_insert():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            
            # Get first student and internship for testing
            students = supabase.table("students").select("*").limit(1).execute()
            internships = supabase.table("internships").select("*").limit(1).execute()
            
            if not students.data or not internships.data:
                return jsonify({"error": "Need at least one student and one internship to test"}), 400
            
            # Test inserting with correct format
            test_record = {
                "student_id": str(students.data[0]["id"]),
                "internship_id": str(internships.data[0]["id"]),
                "score": 85.5,
                "reason": "test - test allocation"
            }
            
            print(f"Testing allocation insert: {test_record}")
            result = supabase.table("allocations").insert([test_record]).execute()
            print(f"Insert result: {result.data}")
            
            # Verify it was inserted
            all_allocations = supabase.table("allocations").select("*").execute()
            print(f"Total allocations after test insert: {len(all_allocations.data)}")
            print(f"All allocations data: {all_allocations.data}")
            
            return jsonify({
                "message": "Test allocation inserted",
                "inserted_data": result.data,
                "total_allocations": len(all_allocations.data),
                "all_allocations": all_allocations.data
            })
        except Exception as e:
            print(f"Test insert error: {e}")
            return jsonify({"error": str(e)}), 500
    
    @app.route("/raw_allocations", methods=["GET"])
    def raw_allocations():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            
            # Get raw allocations data
            allocations = supabase.table("allocations").select("*").execute()
            print(f"=== RAW ALLOCATIONS CHECK ===")
            print(f"Raw response: {allocations}")
            print(f"Raw data: {allocations.data}")
            print(f"Data type: {type(allocations.data)}")
            print(f"Data length: {len(allocations.data) if allocations.data else 'None'}")
            
            return jsonify({
                "raw_response": str(allocations),
                "data": allocations.data,
                "count": len(allocations.data) if allocations.data else 0
            })
        except Exception as e:
            print(f"Raw allocations error: {e}")
            return jsonify({"error": str(e)}), 500
    
    @app.route("/test_simple_insert", methods=["POST"])
    def test_simple_insert():
        if not session.get("logged_in"):
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            
            # Get first student and internship to use their actual UUIDs
            students = supabase.table("students").select("*").limit(1).execute()
            internships = supabase.table("internships").select("*").limit(1).execute()
            
            if not students.data or not internships.data:
                return jsonify({"error": "Need at least one student and one internship to test"}), 400
            
            # Test with correct UUID format
            minimal_record = {
                "student_id": str(students.data[0]["id"]),
                "internship_id": str(internships.data[0]["id"]),
                "score": 50.0,
                "reason": "Test allocation"
            }
            
            print(f"=== TESTING MINIMAL INSERT ===")
            print(f"Minimal record: {minimal_record}")
            
            result = supabase.table("allocations").insert([minimal_record]).execute()
            print(f"Minimal insert result: {result.data}")
            
            return jsonify({
                "message": "Minimal insert test",
                "result": result.data,
                "success": len(result.data) > 0 if result.data else False
            })
        except Exception as e:
            print(f"Minimal insert error: {e}")
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
            session["user_type"] = "admin"
            session.permanent = True
            print("Login successful - session set")
            return jsonify({"message": "Login successful"}), 200
        else:
            session["logged_in"] = False
            print("Login failed - invalid credentials")
            return jsonify({"message": "Invalid credentials"}), 401
    
    @app.route("/student_login", methods=["POST"])
    def student_login():
        print("Student login attempt received")
        data = request.get_json(silent=True) or {}
        email = str(data.get("email") or "").strip()
        password = str(data.get("password") or "")
        
        print(f"Student login attempt - Email: {email}")
        
        try:
            supabase = get_supabase()
            
            # Check if student exists in database - first get all students to see structure
            all_students = supabase.table("students").select("*").execute()
            print(f"All students data: {all_students.data}")
            
            if not all_students.data:
                print("No students found in database")
                return jsonify({"message": "No students in database"}), 401
            
            # Try to find student by email (if email field exists) or use first student for demo
            student = None
            for s in all_students.data:
                print(f"Checking student: {s}")
                if "email" in s and s["email"] == email:
                    student = s
                    break
            
            # If no email match, use first student for demo purposes
            if not student and password == "student123":
                student = all_students.data[0]
                print(f"Using first student for demo: {student}")
            
            if student and password == "student123":  # Default password for demo
                session["logged_in"] = True
                session["user_type"] = "student"
                session["user_id"] = student["id"]
                session["user_name"] = student.get("name", "Student")
                session.permanent = True
                print(f"Student login successful: {student.get('name', 'Student')}")
                return jsonify({"message": "Login successful", "user": student.get("name", "Student")}), 200
            
            print("Student login failed - invalid credentials")
            return jsonify({"message": "Invalid credentials"}), 401
        except Exception as e:
            print(f"Student login error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"message": "Login error", "error": str(e)}), 500
    
    @app.route("/company_login", methods=["POST"])
    def company_login():
        print("Company login attempt received")
        data = request.get_json(silent=True) or {}
        email = str(data.get("email") or "").strip()
        password = str(data.get("password") or "")
        
        print(f"Company login attempt - Email: {email}")
        
        try:
            supabase = get_supabase()
            
            # Check if company exists in internships table - first get all internships to see structure
            all_internships = supabase.table("internships").select("*").execute()
            print(f"All internships data: {all_internships.data}")
            
            if not all_internships.data:
                print("No internships found in database")
                return jsonify({"message": "No companies in database"}), 401
            
            # Try to find company by contact_email or use first internship for demo
            company = None
            for i in all_internships.data:
                print(f"Checking internship: {i}")
                if "contact_email" in i and i["contact_email"] == email:
                    company = i
                    break
            
            # If no email match, use first internship for demo purposes
            if not company and password == "company123":
                company = all_internships.data[0]
                print(f"Using first internship for demo: {company}")
            
            if company and password == "company123":  # Default password for demo
                session["logged_in"] = True
                session["user_type"] = "company"
                session["user_id"] = company["id"]
                session["company_name"] = company.get("org_name", "Company")
                session.permanent = True
                print(f"Company login successful: {company.get('org_name', 'Company')}")
                return jsonify({"message": "Login successful", "company": company.get("org_name", "Company")}), 200
            
            print("Company login failed - invalid credentials")
            return jsonify({"message": "Invalid credentials"}), 401
        except Exception as e:
            print(f"Company login error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"message": "Login error", "error": str(e)}), 500

    @app.route("/admin_logout", methods=["POST"])
    def admin_logout():
        session.clear()
        print("User logged out - session cleared")
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

            # Skip clearing existing allocations for now - just insert new ones
            print("Skipping delete operation - inserting new allocations...")
            
            if allocations:
                # First get students and internships to map IDs to UUIDs
                students_response = supabase.table("students").select("*").execute()
                internships_response = supabase.table("internships").select("*").execute()
                
                students_dict = {s["id"]: s for s in students_response.data}
                internships_dict = {i["id"]: i for i in internships_response.data}
                
                allocation_records = []
                for a in allocations:
                    student = students_dict.get(a['student_id'])
                    internship = internships_dict.get(a['internship_id'])
                    
                    if student and internship:
                        allocation_records.append({
                            "student_id": str(student['id']),  # Ensure string format
                            "internship_id": str(internship['id']),  # Ensure string format
                            "score": float(a['score']),
                            "reason": f"{a.get('allocation_type', 'unknown')} - {a.get('reason', '')}"
                        })
                    else:
                        print(f"Warning: Could not find student {a['student_id']} or internship {a['internship_id']}")
                
                print(f"Formatted {len(allocation_records)} allocation records for database")
                print(f"Inserting {len(allocation_records)} allocation records...")
                print(f"Sample allocation record: {allocation_records[0] if allocation_records else 'None'}")
                
                try:
                    insert_result = supabase.table("allocations").insert(allocation_records).execute()
                    print(f"Insert operation completed: {len(insert_result.data) if insert_result.data else 0} records inserted")
                    print(f"Insert result data: {insert_result.data}")
                    
                    # Verify insertion
                    final_allocations = supabase.table("allocations").select("*").execute()
                    print(f"Final verification: {len(final_allocations.data)} allocations in database")
                except Exception as insert_error:
                    print(f"Insert operation failed: {insert_error}")
                    return jsonify({"error": "Failed to insert allocations", "message": str(insert_error)}), 500
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
            print(f"=== GET_ALLOCATIONS DEBUG ===")
            print(f"Raw allocations response: {allocations_response.data}")
            print(f"Found {len(allocations_response.data)} allocations")
            
            if not allocations_response.data:
                print("No allocations found in database - returning empty array")
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
            print(f"Sample formatted allocation: {allocations_data[0] if allocations_data else 'None'}")
            print(f"Final response: {{'allocations': allocations_data}}")
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
        if not session.get("logged_in") or session.get("user_type") != "admin":
            print("Unauthorized access to admin dashboard - redirecting to login")
            return """
            <script>
                alert('Please login first');
                window.location.href = '/admin';
            </script>
            """
        print("Authorized access to admin dashboard")
        return send_from_directory('.', 'admin-dashboard.html')
    
    @app.route("/student-dashboard")
    def student_dashboard_redirect():
        if not session.get("logged_in") or session.get("user_type") != "student":
            print("Unauthorized access to student dashboard - redirecting to login")
            return """
            <script>
                alert('Please login first');
                window.location.href = '/admin';
            </script>
            """
        print("Authorized access to student dashboard")
        return send_from_directory('.', 'student-dashboard.html')
    
    @app.route("/company-dashboard")
    def company_dashboard_redirect():
        if not session.get("logged_in") or session.get("user_type") != "company":
            print("Unauthorized access to company dashboard - redirecting to login")
            return """
            <script>
                alert('Please login first');
                window.location.href = '/admin';
            </script>
            """
        print("Authorized access to company dashboard")
        return send_from_directory('.', 'company-dashboard.html')
    
    # Student API endpoints
    @app.route("/student_profile", methods=["GET"])
    def student_profile():
        if not session.get("logged_in") or session.get("user_type") != "student":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            student_id = session.get("user_id")
            
            student_response = supabase.table("students").select("*").eq("id", student_id).execute()
            if student_response.data:
                return jsonify(student_response.data[0]), 200
            return jsonify({"message": "Student not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/available_internships", methods=["GET"])
    def available_internships():
        if not session.get("logged_in") or session.get("user_type") != "student":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            internships_response = supabase.table("internships").select("*").execute()
            return jsonify({"internships": internships_response.data}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/my_applications", methods=["GET"])
    def my_applications():
        if not session.get("logged_in") or session.get("user_type") != "student":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            student_id = session.get("user_id")
            
            # For now, return empty array as we need to create applications table
            return jsonify({"applications": []}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/apply_internship", methods=["POST"])
    def apply_internship():
        if not session.get("logged_in") or session.get("user_type") != "student":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            data = request.get_json()
            internship_id = data.get("internship_id")
            student_id = session.get("user_id")
            
            # For now, just return success (need to implement applications table)
            return jsonify({"message": "Application submitted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Company API endpoints
    @app.route("/company_profile", methods=["GET"])
    def company_profile():
        if not session.get("logged_in") or session.get("user_type") != "company":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            company_name = session.get("company_name", "Company")
            return jsonify({"name": company_name}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/company_internships", methods=["GET"])
    def company_internships():
        if not session.get("logged_in") or session.get("user_type") != "company":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            company_name = session.get("company_name")
            
            internships_response = supabase.table("internships").select("*").eq("org_name", company_name).execute()
            return jsonify({"internships": internships_response.data}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/company_applications", methods=["GET"])
    def company_applications():
        if not session.get("logged_in") or session.get("user_type") != "company":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            # For now, return empty array as we need to create applications table
            return jsonify({"applications": []}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/create_internship", methods=["POST"])
    def create_internship():
        if not session.get("logged_in") or session.get("user_type") != "company":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            data = request.get_json()
            
            # Add company info to the internship data
            internship_data = {
                **data,
                "company_id": session.get("user_id"),
                "created_at": "now()"
            }
            
            result = supabase.table("internships").insert([internship_data]).execute()
            return jsonify({"message": "Internship created successfully", "data": result.data}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/internship/<internship_id>", methods=["GET", "PUT"])
    def manage_internship(internship_id):
        if not session.get("logged_in") or session.get("user_type") != "company":
            return jsonify({"message": "Unauthorized"}), 401
        
        try:
            supabase = get_supabase()
            
            if request.method == "GET":
                result = supabase.table("internships").select("*").eq("id", internship_id).execute()
                if result.data:
                    return jsonify(result.data[0]), 200
                return jsonify({"message": "Internship not found"}), 404
            
            elif request.method == "PUT":
                data = request.get_json()
                result = supabase.table("internships").update(data).eq("id", internship_id).execute()
                return jsonify({"message": "Internship updated successfully"}), 200
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/static/<path:filename>")
    def static_files(filename):
        return send_from_directory('.', filename)
    
    return app
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)