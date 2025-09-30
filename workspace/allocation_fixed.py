from typing import List, Dict, Any, Set

def run_allocation(students: List[Dict[str, Any]], internships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Improved allocation algorithm with better error handling and data structure compatibility
    """
    allocations: List[Dict[str, Any]] = []
    assigned_student_ids: Set[int] = set()
    
    print(f"🚀 Starting allocation with {len(students)} students and {len(internships)} internships")
    
    if not students:
        print("❌ No students found for allocation")
        return []
    
    if not internships:
        print("❌ No internships found for allocation")
        return []

    for internship in internships:
        internship_id = internship.get("id")
        internship_name = internship.get("org_name") or internship.get("company") or "Unknown"
        
        # Handle both field name variations
        required_skills = _normalize_list(
            internship.get("skills_required") or 
            internship.get("required_skills") or []
        )
        
        sector = (internship.get("sector") or "").strip().lower()
        
        # Handle both 'seats' and 'total_positions' field names
        seats = int(internship.get("seats") or internship.get("total_positions") or 0)
        
        if seats <= 0:
            print(f"⚠️ Skipping {internship_name} - no seats available")
            continue
        
        # Handle quota_json or individual quota fields
        quotas_raw = internship.get("quota_json")
        if not quotas_raw:
            # Fallback to individual quota fields
            quotas_raw = {
                "GEN": internship.get("quota_gen", 0),
                "OBC": internship.get("quota_obc", 0), 
                "SC": internship.get("quota_sc", 0),
                "ST": internship.get("quota_st", 0),
                "EWS": internship.get("quota_ews", 0)
            }
        
        print(f"📋 Processing {internship_name} - {seats} seats, sector: {sector}")
        print(f"   Required skills: {required_skills}")
        print(f"   Quotas: {quotas_raw}")

        # Process quotas
        quotas = {}
        try:
            for category, count in dict(quotas_raw).items():
                try:
                    c = int(count)
                    if c > 0:
                        quotas[str(category)] = c
                except (ValueError, TypeError):
                    continue
        except Exception as e:
            print(f"⚠️ Error processing quotas for {internship_name}: {e}")
            quotas = {}

        filled_quota = 0
        
        # Allocate based on quotas
        for category, quota_count in quotas.items():
            if quota_count <= 0:
                continue
                
            eligible = [
                s for s in students
                if s.get("id") not in assigned_student_ids and (s.get("category") or "") == category
            ]
            
            print(f"   📊 Category {category}: {len(eligible)} eligible students for {quota_count} quota seats")
            
            if not eligible:
                continue
                
            scored = [(s, _final_score(s, sector, required_skills)) for s in eligible]
            scored.sort(key=lambda x: x[1], reverse=True)

            to_allocate_count = min(quota_count, len(scored))
            for i in range(to_allocate_count):
                s = scored[i][0]
                score = scored[i][1]
                allocations.append({
                    "student_id": s.get("id"),
                    "internship_id": internship_id,
                    "score": round(score, 4),
                    "allocation_type": "quota",
                    "reason": f"quota for {category}",
                })
                assigned_student_ids.add(s.get("id"))
                filled_quota += 1
                print(f"   ✅ Allocated {s.get('name')} (score: {score:.2f}) to quota {category}")

        # Allocate remaining open seats
        remaining_seats = seats - filled_quota
        if remaining_seats > 0:
            open_eligible = [
                s for s in students
                if s.get("id") not in assigned_student_ids
            ]
            
            print(f"   🔓 {remaining_seats} open seats available, {len(open_eligible)} eligible students")
            
            if open_eligible:
                scored_open = [(s, _final_score(s, sector, required_skills)) for s in open_eligible]
                scored_open.sort(key=lambda x: x[1], reverse=True)

                to_allocate_count = min(remaining_seats, len(scored_open))
                for i in range(to_allocate_count):
                    s = scored_open[i][0]
                    score = scored_open[i][1]
                    allocations.append({
                        "student_id": s.get("id"),
                        "internship_id": internship_id,
                        "score": round(score, 4),
                        "allocation_type": "open",
                        "reason": "open seat",
                    })
                    assigned_student_ids.add(s.get("id"))
                    print(f"   ✅ Allocated {s.get('name')} (score: {score:.2f}) to open seat")

    print(f"🎉 Allocation complete! Generated {len(allocations)} allocations")
    print(f"📈 Students allocated: {len(assigned_student_ids)} out of {len(students)}")
    
    return allocations


def _final_score(student: Dict[str, Any], internship_sector: str, required_skills: List[str]) -> float:
    """Calculate final score for student-internship match"""
    try:
        marks = float(student.get("marks") or 0.0)
        student_sector_pref = (student.get("sector_pref") or "").strip().lower()
        student_skills = _normalize_list(student.get("skills") or [])

        skill_score = _skill_match_score(student_skills, required_skills)
        sector_bonus = 20.0 if student_sector_pref and student_sector_pref == internship_sector else 0.0
        final = marks * 0.4 + skill_score * 0.4 + sector_bonus
        return final
    except Exception as e:
        print(f"⚠️ Error calculating score for student {student.get('name', 'Unknown')}: {e}")
        return 0.0


def _skill_match_score(student_skills: List[str], required_skills: List[str]) -> float:
    """Calculate skill match score between student and internship"""
    if not required_skills:
        return 100.0
    
    try:
        sset = set([s.lower().strip() for s in student_skills])
        rset = set([r.lower().strip() for r in required_skills])
        matches = len(sset.intersection(rset))
        score = (matches / len(rset)) * 100.0
        return score
    except Exception as e:
        print(f"⚠️ Error calculating skill match: {e}")
        return 0.0


def _normalize_list(value: Any) -> List[str]:
    """Normalize various input formats to a list of strings"""
    if not value:
        return []
    
    try:
        if isinstance(value, str):
            return [s.strip() for s in value.split(",") if s.strip()]
        if isinstance(value, list):
            return [str(s).strip() for s in value if str(s).strip()]
        return [str(value).strip()] if str(value).strip() else []
    except Exception as e:
        print(f"⚠️ Error normalizing list: {e}")
        return []
