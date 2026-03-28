import math
from datetime import date, datetime
from typing import Optional


# Lambda values control how fast skills decay
# Higher = faster decay
# Tech skills decay fast, soft skills decay slowly
DECAY_RATES = {
    "tech": 0.03,
    "domain_knowledge": 0.02,
    "leadership": 0.008,
    "communication": 0.005,
    "other": 0.015
}


def months_since(last_used_date: str) -> int:
    """
    Takes ISO date string 'YYYY-MM-DD', returns months elapsed since then.
    """
    last_used = datetime.strptime(last_used_date, "%Y-%m-%d").date()
    today = date.today()
    months = (today.year - last_used.year) * 12 + (today.month - last_used.month)
    return max(months, 0)


def compute_skill_score(skill: dict) -> float:
    """
    Takes a skill dict, returns a decayed score between 0.0 and 1.0.

    Input skill dict:
    {
        "skill_name": "Python",
        "domain": "tech",               # tech / leadership / communication / domain_knowledge / other
        "proficiency": 4,               # 1-5
        "years_experience": 3,
        "last_used_date": "2021-06-01"  # ISO string
    }

    Returns: float between 0.0 and 1.0
    """
    domain = skill.get("domain", "other").lower()
    proficiency = skill.get("proficiency", 3)
    years_exp = skill.get("years_experience", 1)
    last_used_date = skill.get("last_used_date", "2020-01-01")

    # Base score: weighted combination of proficiency and experience
    # Proficiency contributes 60%, experience (capped at 10 yrs) contributes 40%
    proficiency_score = proficiency / 5.0
    experience_score = min(years_exp, 10) / 10.0
    base_score = (0.6 * proficiency_score) + (0.4 * experience_score)

    # Decay multiplier using exponential decay: e^(-λ * months)
    lam = DECAY_RATES.get(domain, DECAY_RATES["other"])
    months = months_since(last_used_date)
    decay_multiplier = math.exp(-lam * months)

    # Final score
    final_score = round(base_score * decay_multiplier, 4)
    return final_score


def score_all_skills(skills: list[dict]) -> list[dict]:
    """
    Takes a list of skill dicts, returns same list with decay_score added to each.
    Also adds a human-readable strength label.
    """
    scored = []
    for skill in skills:
        score = compute_skill_score(skill)
        label = (
            "strong" if score >= 0.6 else
            "needs_refresh" if score >= 0.3 else
            "heavily_decayed"
        )
        scored.append({
            **skill,
            "decay_score": score,
            "strength_label": label,
            "months_since_used": months_since(skill.get("last_used_date", "2020-01-01"))
        })

    # Sort by decay score descending
    scored.sort(key=lambda x: x["decay_score"], reverse=True)
    return scored


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_skills = [
        {
            "skill_name": "Python",
            "domain": "tech",
            "proficiency": 4,
            "years_experience": 3,
            "last_used_date": "2021-06-01"
        },
        {
            "skill_name": "SQL",
            "domain": "tech",
            "proficiency": 5,
            "years_experience": 5,
            "last_used_date": "2020-01-01"
        },
        {
            "skill_name": "Team Leadership",
            "domain": "leadership",
            "proficiency": 4,
            "years_experience": 4,
            "last_used_date": "2021-03-01"
        },
        {
            "skill_name": "Stakeholder Management",
            "domain": "communication",
            "proficiency": 3,
            "years_experience": 3,
            "last_used_date": "2021-06-01"
        },
        {
            "skill_name": "Product Strategy",
            "domain": "domain_knowledge",
            "proficiency": 4,
            "years_experience": 5,
            "last_used_date": "2019-01-01"
        }
    ]

    results = score_all_skills(test_skills)

    print(f"\n{'Skill':<25} {'Domain':<20} {'Months':<10} {'Score':<10} {'Label'}")
    print("-" * 75)
    for s in results:
        print(
            f"{s['skill_name']:<25} "
            f"{s['domain']:<20} "
            f"{s['months_since_used']:<10} "
            f"{s['decay_score']:<10} "
            f"{s['strength_label']}"
        )