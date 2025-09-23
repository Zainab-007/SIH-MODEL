# from typing import List, Dict, Any, Set


# def run_allocation(students: List[Dict[str, Any]], internships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
#     allocations: List[Dict[str, Any]] = []
#     assigned_student_ids: Set[int] = set()

#     for internship in internships:
#         internship_id = internship.get("id")
#         required_skills = _normalize_list(internship.get("skills_required") or [])
#         sector = (internship.get("sector") or "").strip().lower()
#         seats = int(internship.get("seats") or 0)
#         quotas_raw = internship.get("quota_json") or {}

#         quotas = {}
#         try:
#             for category, count in dict(quotas_raw).items():
#                 try:
#                     c = int(count)
#                     if c > 0:
#                         quotas[str(category)] = c
#                 except Exception:
#                     continue
#         except Exception:
#             quotas = {}

#         filled_quota = 0
#         for category, quota_count in quotas.items():
#             if quota_count <= 0:
#                 continue
#             eligible = [
#                 s for s in students
#                 if s.get("id") not in assigned_student_ids and (s.get("category") or "") == category
#             ]
#             scored = [(s, _final_score(s, sector, required_skills)) for s in eligible]
#             scored.sort(key=lambda t: t[1], reverse=True)
#             chosen = scored[:quota_count]
#             for s, score in chosen:
#                 allocations.append({
#                     "student_id": s.get("id"),
#                     "internship_id": internship_id,
#                     "score": round(score, 4),
#                     "allocation_type": "quota",
#                     "reason": f"quota-based: category={category}",
#                 })
#                 assigned_student_ids.add(s.get("id"))
#             filled_quota += len(chosen)

#         open_seats = max(0, seats - filled_quota)
#         if open_seats > 0:
#             eligible_open = [s for s in students if s.get("id") not in assigned_student_ids]
#             scored_open = [(s, _final_score(s, sector, required_skills)) for s in eligible_open]
#             scored_open.sort(key=lambda t: t[1], reverse=True)
#             for s, score in scored_open[:open_seats]:
#                 allocations.append({
#                     "student_id": s.get("id"),
#                     "internship_id": internship_id,
#                     "score": round(score, 4),
#                     "allocation_type": "open",
#                     "reason": "open seat",
#                 })
#                 assigned_student_ids.add(s.get("id"))

#     return allocations


# def _final_score(student: Dict[str, Any], internship_sector: str, required_skills: List[str]) -> float:
#     marks = float(student.get("marks") or 0.0)
#     student_sector_pref = (student.get("sector_pref") or "").strip().lower()
#     student_skills = _normalize_list(student.get("skills") or [])

#     skill_score = _skill_match_score(student_skills, required_skills)
#     sector_bonus = 20.0 if student_sector_pref and student_sector_pref == internship_sector else 0.0
#     final = marks * 0.4 + skill_score * 0.4 + sector_bonus
#     return final


# def _skill_match_score(student_skills: List[str], required_skills: List[str]) -> float:
#     if not required_skills:
#         return 100.0
#     sset = set([s.lower() for s in student_skills])
#     rset = set([r.lower() for r in required_skills])
#     matches = len(sset.intersection(rset))
#     return (matches / max(1, len(rset))) * 100.0


# def _normalize_list(value) -> List[str]:
#     if value is None:
#         return []
#     if isinstance(value, list):
#         return [str(v).strip() for v in value if str(v).strip()]
#     return [v.strip() for v in str(value).split(",") if v.strip()]

from typing import List, Dict, Any, Set
def run_allocation(students: List[Dict[str, Any]], internships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    allocations: List[Dict[str, Any]] = []
    assigned_student_ids: Set[int] = set()

    for internship in internships:
        internship_id = internship.get("id")
        required_skills = _normalize_list(internship.get("skills_required") or [])
        sector = (internship.get("sector") or "").strip().lower()
        seats = int(internship.get("seats") or 0)
        quotas_raw = internship.get("quota_json") or {}

        quotas = {}
        try:
            for category, count in dict(quotas_raw).items():
                try:
                    c = int(count)
                    if c > 0:
                        quotas[str(category)] = c
                except Exception:
                    continue
        except Exception:
            quotas = {}

        filled_quota = 0
        for category, quota_count in quotas.items():
            if quota_count <= 0:
                continue
            eligible = [
                s for s in students
                if s.get("id") not in assigned_student_ids and (s.get("category") or "") == category
            ]
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

        remaining_seats = seats - filled_quota
        if remaining_seats > 0:
            open_eligible = [
                s for s in students
                if s.get("id") not in assigned_student_ids
            ]
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

    return allocations


def _final_score(student: Dict[str, Any], internship_sector: str, required_skills: List[str]) -> float:
    marks = float(student.get("marks") or 0.0)
    student_sector_pref = (student.get("sector_pref") or "").strip().lower()
    student_skills = _normalize_list(student.get("skills") or [])

    skill_score = _skill_match_score(student_skills, required_skills)
    sector_bonus = 20.0 if student_sector_pref and student_sector_pref == internship_sector else 0.0
    final = marks * 0.4 + skill_score * 0.4 + sector_bonus
    return final


def _skill_match_score(student_skills: List[str], required_skills: List[str]) -> float:
    if not required_skills:
        return 100.0
    sset = set([s.lower() for s in student_skills])
    rset = set([r.lower() for r in required_skills])
    matches = len(sset.intersection(rset))
    score = (matches / len(rset)) * 100.0
    return score


def _normalize_list(value: Any) -> List[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [s.strip() for s in value.split(",") if s.strip()]
    if isinstance(value, list):
        return [str(s).strip() for s in value if str(s).strip()]
    return []