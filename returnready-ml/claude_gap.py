import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv
from decay import score_all_skills
from role_skills import get_missing_skills

load_dotenv()

client = Anthropic()

def analyze_gap(skills: list[dict], target_role: str) -> dict:
    """
    Takes a list of raw skills + target role.
    Runs decay scoring internally, then calls Claude to analyze the gap.
    
    Returns:
    {
        "strong_skills": [...],
        "decayed_skills": [...],
        "missing_skills": [...],
        "summary": "...",
        "scored_skills": [...]   ← full decay data for frontend
    }
    """

    # Run decay model first
    scored_skills = score_all_skills(skills)

    # Get data-driven missing skills from role frequency table
    user_skill_names = [s["skill_name"] for s in skills]
    data_driven_missing = get_missing_skills(user_skill_names, target_role, threshold=0.5)

    # Build a clean text representation for Claude
    skill_lines = []
    for s in scored_skills:
        skill_lines.append(
            f"- {s['skill_name']} ({s['domain']}): "
            f"proficiency {s['proficiency']}/5, "
            f"{s['years_experience']} yrs experience, "
            f"unused for {s['months_since_used']} months, "
            f"current strength score: {s['decay_score']} ({s['strength_label']})"
        )
    skills_text = "\n".join(skill_lines)
    missing_hint = ", ".join(data_driven_missing) if data_driven_missing else "none identified from job data"

    system_prompt = """You are a career re-entry advisor specializing in helping women return to the workforce after a career gap.

You will be given a user's skill profile with decay scores and their target role.
Your job is to analyze the gap between where they are and where they want to be.

You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no backticks.
The JSON must have exactly these four keys:
- strong_skills: array of skill name strings (decay_score >= 0.4)
- decayed_skills: array of objects with keys: skill_name, months_since_used, refresh_priority (high/medium/low)
- missing_skills: array of skill name strings likely needed for the target role but not present
- summary: one sentence, warm and encouraging, acknowledging their background while being honest about gaps

Be specific about missing_skills based on the actual target role. Do not make them generic."""

    user_prompt = f"""Target role: {target_role}

Current skill profile:
{skills_text}

Skills identified as missing from real job posting data (frequency >50%):
{missing_hint}

Use the job data above as your primary source for missing_skills.
You may add 1-2 additional missing skills if clearly relevant but not in the list.
Analyze the gap and return the JSON."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )

    raw = response.content[0].text.strip()

    # Safe JSON parse
    try:
        gap_analysis = json.loads(raw)
    except json.JSONDecodeError:
        # If Claude added backticks despite instructions, strip them
        clean = raw.replace("```json", "").replace("```", "").strip()
        gap_analysis = json.loads(clean)

    # Attach full scored skills for frontend use
    gap_analysis["scored_skills"] = scored_skills

    return gap_analysis


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

    target_role = "Product Manager at a tech company"

    print("Running gap analysis...\n")
    result = analyze_gap(test_skills, target_role)

    print("STRONG SKILLS:")
    for s in result.get("strong_skills", []):
        print(f"  ✅ {s}")

    print("\nDECAYED SKILLS:")
    for s in result.get("decayed_skills", []):
        print(f"  ⚠️  {s['skill_name']} — {s['months_since_used']} months — priority: {s['refresh_priority']}")

    print("\nMISSING SKILLS:")
    for s in result.get("missing_skills", []):
        print(f"  ❌ {s}")

    print(f"\nSUMMARY:\n  {result.get('summary')}")

    print(f"\nFull JSON saved. Total skills scored: {len(result['scored_skills'])}")