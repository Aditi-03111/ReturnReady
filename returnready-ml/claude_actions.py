import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic()


def generate_weekly_actions(gap_analysis: dict, target_role: str, week_number: int = 1) -> list[dict]:
    """
    Takes gap analysis output from claude_gap.py, returns exactly 3 weekly micro-actions.

    Returns:
    [
        {
            "title": "...",
            "description": "...",
            "skill_targeted": "...",
            "duration_minutes": 45,
            "resource_type": "video/article/course/practice",
            "resource_url_placeholder": "...",
            "priority": "high/medium/low"
        },
        ...
    ]
    """

    # Pull what we need from gap analysis
    decayed = gap_analysis.get("decayed_skills", [])
    missing = gap_analysis.get("missing_skills", [])
    summary = gap_analysis.get("summary", "")

    # Build context for Claude
    decayed_text = "\n".join([
        f"- {s['skill_name']} (unused {s['months_since_used']} months, refresh priority: {s['refresh_priority']})"
        for s in decayed
    ])

    missing_text = "\n".join([f"- {s}" for s in missing])

    system_prompt = """You are a career re-entry coach helping women return to the workforce after a career gap.

You generate weekly micro-actions — small, achievable tasks that fit into a busy life.
Actions should be specific, practical, and completable in under 60 minutes each.

You MUST respond with ONLY a valid JSON array of exactly 3 objects. No preamble, no explanation, no markdown, no backticks.
Each object must have exactly these keys:
- title: short action title, max 10 words
- description: one sentence explaining exactly what to do
- skill_targeted: the specific skill this action addresses
- duration_minutes: integer, must be between 20 and 60
- resource_type: one of: video, article, course, practice, networking
- resource_url_placeholder: a realistic search query the user can Google, not a made-up URL
- priority: one of: high, medium, low

Rules:
- At least 1 action must target a decayed skill
- At least 1 action must target a missing skill
- Actions must be realistic for someone who has been out of the workforce
- Do not suggest anything that takes more than 60 minutes
- Week number affects difficulty: week 1 = very easy entry tasks, later weeks = more challenging"""

    user_prompt = f"""Target role: {target_role}
Week number: {week_number}
Context: {summary}

Decayed skills needing refresh:
{decayed_text if decayed_text else "None identified"}

Missing skills for target role:
{missing_text if missing_text else "None identified"}

Generate exactly 3 micro-actions for this week."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )

    raw = response.content[0].text.strip()

    try:
        actions = json.loads(raw)
    except json.JSONDecodeError:
        clean = raw.replace("```json", "").replace("```", "").strip()
        actions = json.loads(clean)

    # Validate we got exactly 3
    if not isinstance(actions, list) or len(actions) != 3:
        raise ValueError(f"Claude returned {len(actions)} actions instead of 3. Raw: {raw}")

    # Attach week number to each action
    for i, action in enumerate(actions):
        action["week_number"] = week_number
        action["order"] = i + 1

    return actions


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Simulate what claude_gap.py returns
    mock_gap_analysis = {
        "strong_skills": ["Stakeholder Management"],
        "decayed_skills": [
            {"skill_name": "Python", "months_since_used": 57, "refresh_priority": "high"},
            {"skill_name": "SQL", "months_since_used": 74, "refresh_priority": "high"},
            {"skill_name": "Team Leadership", "months_since_used": 60, "refresh_priority": "medium"}
        ],
        "missing_skills": ["Agile/Scrum", "Product Roadmapping", "Data Analysis"],
        "summary": "Your communication and leadership foundation is strong, but your technical skills need refreshing to compete for PM roles in tech."
    }

    target_role = "Product Manager at a tech company"

    print("Generating week 1 actions...\n")
    actions = generate_weekly_actions(mock_gap_analysis, target_role, week_number=1)

    for i, action in enumerate(actions, 1):
        print(f"Action {i}: {action['title']}")
        print(f"  Skill targeted : {action['skill_targeted']}")
        print(f"  What to do     : {action['description']}")
        print(f"  Time           : {action['duration_minutes']} mins")
        print(f"  Resource type  : {action['resource_type']}")
        print(f"  Find it by     : {action['resource_url_placeholder']}")
        print(f"  Priority       : {action['priority']}")
        print()

    print("─" * 50)
    print("Testing week 3 (should be harder tasks)...\n")
    actions_w3 = generate_weekly_actions(mock_gap_analysis, target_role, week_number=3)
    for action in actions_w3:
        print(f"  • {action['title']} ({action['duration_minutes']} mins)")