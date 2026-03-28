import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv

from decay import score_all_skills
from claude_gap import analyze_gap
from claude_actions import generate_weekly_actions
from embeddings import generate_user_vector, store_embedding

load_dotenv()

app = FastAPI()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this after hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ──────────────────────────────────────────────────────────

class SkillInput(BaseModel):
    skill_name: str
    domain: str
    proficiency: int
    years_experience: int
    last_used_date: str  # "YYYY-MM-DD"


class OnboardRequest(BaseModel):
    name: str
    email: str
    target_role: str
    gap_reason: str
    skills: list[SkillInput]


class AnalyzeRequest(BaseModel):
    user_id: str


class ActionCompleteRequest(BaseModel):
    action_id: str
    user_id: str


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ReturnReady API running"}


@app.post("/api/onboard")
def onboard(req: OnboardRequest):
    """
    Creates user, stores skills, generates embedding.
    Returns user_id for all subsequent calls.
    """
    try:
        # 1. Insert user
        user_result = supabase.table("users").insert({
            "name": req.name,
            "email": req.email,
            "target_role": req.target_role,
            "gap_reason": req.gap_reason
        }).execute()

        user_id = user_result.data[0]["id"]

        # 2. Insert skills
        skills_data = [
            {
                "user_id": user_id,
                "skill_name": s.skill_name,
                "domain": s.domain,
                "proficiency": s.proficiency,
                "years_experience": s.years_experience,
                "last_used_date": s.last_used_date
            }
            for s in req.skills
        ]
        supabase.table("skills").insert(skills_data).execute()

        # 3. Generate and store embedding
        skills_dicts = [s.dict() for s in req.skills]
        scored = score_all_skills(skills_dicts)
        vector = generate_user_vector(scored)
        store_embedding(user_id, vector)

        return {"user_id": user_id, "message": "Onboarding complete"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    """
    Full analysis pipeline for a user.
    Returns gap analysis + weekly actions + scored skills.
    """
    try:
        # 1. Fetch user
        user_result = supabase.table("users") \
            .select("*") \
            .eq("id", req.user_id) \
            .execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_result.data[0]

        # 2. Fetch skills
        skills_result = supabase.table("skills") \
            .select("*") \
            .eq("user_id", req.user_id) \
            .execute()

        skills = skills_result.data

        # 3. Run gap analysis (includes decay internally)
        gap_analysis = analyze_gap(skills, user["target_role"])

        # 4. Generate weekly actions
        actions = generate_weekly_actions(
            gap_analysis,
            user["target_role"],
            week_number=1
        )

        # 5. Store actions in Supabase
        actions_to_store = [
            {
                "user_id": req.user_id,
                "title": a["title"],
                "skill_targeted": a["skill_targeted"],
                "duration_minutes": a["duration_minutes"],
                "resource_type": a["resource_type"],
                "week_number": a["week_number"],
                "completed": False
            }
            for a in actions
        ]
        supabase.table("weekly_actions").insert(actions_to_store).execute()

        return {
            "user_id": req.user_id,
            "target_role": user["target_role"],
            "gap_analysis": gap_analysis,
            "weekly_actions": actions
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/complete-action")
def complete_action(req: ActionCompleteRequest):
    """Marks a weekly action as completed."""
    try:
        supabase.table("weekly_actions") \
            .update({"completed": True}) \
            .eq("id", req.action_id) \
            .eq("user_id", req.user_id) \
            .execute()
        return {"message": "Action marked complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/progress/{user_id}")
def get_progress(user_id: str):
    """Returns completed vs total actions for the user."""
    try:
        all_actions = supabase.table("weekly_actions") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        total = len(all_actions.data)
        completed = sum(1 for a in all_actions.data if a["completed"])

        return {
            "user_id": user_id,
            "total_actions": total,
            "completed_actions": completed,
            "actions": all_actions.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))