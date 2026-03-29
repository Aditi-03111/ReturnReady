# ── Imports ─────────────────────────────────────────────
import os
import re
import json
import base64
import logging
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
from anthropic import Anthropic

import pdfplumber

# your modules
from decay import score_all_skills
from claude_gap import analyze_gap
from claude_actions import generate_weekly_actions
from embeddings import generate_user_vector, store_embedding

# ── Setup ───────────────────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing Supabase credentials")

if not ANTHROPIC_API_KEY:
    raise Exception("Missing Anthropic API key")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = Anthropic(api_key=ANTHROPIC_API_KEY)

# ── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────
class SkillInput(BaseModel):
    skill_name: str
    domain: str
    proficiency: int
    years_experience: int
    last_used_date: str


class OnboardRequest(BaseModel):
    name: str
    email: str
    target_role: str
    gap_reason: str
    skills: list[SkillInput]


class AnalyzeRequest(BaseModel):
    user_id: str


# ── Helpers ─────────────────────────────────────────────

def extract_text_from_pdf(pdf_bytes):
    with open("temp.pdf", "wb") as f:
        f.write(pdf_bytes)

    text = ""
    with pdfplumber.open("temp.pdf") as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""

    return text


def fix_dates(skills):
    fixed = []
    for s in skills:
        try:
            date = s.get("last_used_date", "")

            # Convert DD-MM-YYYY → YYYY-MM-DD
            if "-" in date and len(date.split("-")[0]) == 2:
                d = datetime.strptime(date, "%d-%m-%Y")
                date = d.strftime("%Y-%m-%d")

            # Validate format
            if not re.match(r"\d{4}-\d{2}-\d{2}", date):
                date = "2019-01-01"

            s["last_used_date"] = date

        except:
            s["last_used_date"] = "2019-01-01"

        fixed.append(s)

    return fixed


def compute_gap(skills):
    dates = []
    for s in skills:
        try:
            dates.append(datetime.strptime(s["last_used_date"], "%Y-%m-%d"))
        except:
            continue

    if not dates:
        return 0

    last_job = max(dates)
    now = datetime.now()

    gap_months = (now.year - last_job.year) * 12 + (now.month - last_job.month)

    return max(gap_months, 0)


# ── Routes ──────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ReturnReady API running"}


# ── RESUME PARSER ───────────────────────────────────────
@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": """You are an expert resume parser.

Return ONLY valid JSON.

Schema:
{
  "name": "string",
  "email": "string",
  "target_role": "string",
  "gap_reason": "Caregiving | Health | Relocation | Education | Other",
  "career_gap_months": integer,
  "skills": [
    {
      "skill_name": "string",
      "domain": "tech | leadership | communication | domain_knowledge | other",
      "proficiency": integer (1-5),
      "years_experience": integer,
      "last_used_date": "YYYY-MM-DD"
    }
  ]
}

RULES:
- Extract 6–12 skills
- NEVER return empty skills
- Extract dates from actual experience
- Use END DATE of job as last_used_date
- DO NOT default to current year

gap_reason rules:
- Assign ONLY if clearly mentioned
- Otherwise use "Other"
"""
                        }
                    ]
                }
            ]
        )

        raw = "".join(
            block.text for block in response.content if hasattr(block, "text")
        ).strip()

        print("\nRAW RESPONSE:\n", raw[:1000])

        match = re.search(r"\{.*\}", raw, re.DOTALL)

        if not match:
            # fallback to text extraction
            text = extract_text_from_pdf(pdf_bytes)

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                temperature=0,
                messages=[
                    {
                        "role": "user",
                        "content": f"Extract structured resume JSON from:\n{text[:5000]}"
                    }
                ]
            )

            raw = "".join(
                block.text for block in response.content if hasattr(block, "text")
            ).strip()

            match = re.search(r"\{.*\}", raw, re.DOTALL)

            if not match:
                raise HTTPException(500, "Failed to extract JSON")

        parsed = json.loads(match.group())

        # ── Fix data ─────────────────────────────
        parsed["skills"] = fix_dates(parsed.get("skills", []))
        parsed["career_gap_months"] = compute_gap(parsed["skills"])

        if not parsed.get("skills"):
            parsed["skills"] = [
                {
                    "skill_name": "Python",
                    "domain": "tech",
                    "proficiency": 3,
                    "years_experience": 1,
                    "last_used_date": "2019-01-01"
                }
            ]

        parsed.setdefault("gap_reason", "Other")

        return parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ONBOARD ─────────────────────────────────────────────
@app.post("/api/onboard")
def onboard(req: OnboardRequest):
    try:
        # Check if email exists
        existing = supabase.table("users").select("id").eq("email", req.email).execute()

        if existing.data:
            user_id = existing.data[0]["id"]
            # Update the existing user
            supabase.table("users").update({
                "name": req.name,
                "target_role": req.target_role,
                "gap_reason": req.gap_reason
            }).eq("id", user_id).execute()
            # Delete old skills and re-insert fresh
            supabase.table("skills").delete().eq("user_id", user_id).execute()
            supabase.table("user_embeddings").delete().eq("user_id", user_id).execute()
            supabase.table("weekly_actions").delete().eq("user_id", user_id).execute()
        else:
            user = supabase.table("users").insert({
                "name": req.name,
                "email": req.email,
                "target_role": req.target_role,
                "gap_reason": req.gap_reason
            }).execute()
            user_id = user.data[0]["id"]

        skills = [s.model_dump() | {"user_id": user_id} for s in req.skills]
        supabase.table("skills").insert(skills).execute()

        scored = score_all_skills([s.model_dump() for s in req.skills])
        vector = generate_user_vector(scored)
        store_embedding(user_id, vector)

        return {"user_id": user_id}

    except Exception as e:
        raise HTTPException(500, str(e))


# ── ANALYZE ─────────────────────────────────────────────
@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    try:
        user = supabase.table("users").select("*").eq("id", req.user_id).execute().data[0]
        skills = supabase.table("skills").select("*").eq("user_id", req.user_id).execute().data

        gap = analyze_gap(skills, user["target_role"])

        # Calculate total weeks from gap duration
        # Use scored_skills to find the max months_since_used
        scored = gap.get("scored_skills", [])
        if scored:
            max_months = max(s.get("months_since_used", 12) for s in scored)
        else:
            max_months = 12

        # 1 week per month of gap, min 4 weeks, max 24 weeks
        total_weeks = max(4, min(24, max_months))

        actions = generate_weekly_actions(gap, user["target_role"], 1) or []

        return {
            "user_id": req.user_id,
            "target_role": user["target_role"],
            "total_weeks": total_weeks,
            "current_week": 1,
            "gap_analysis": gap,
            "weekly_actions": actions
        }

    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/related-roles")
def related_roles(req: dict):
    try:
        target_role = req.get("target_role", "")
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            system="You are a career advisor. Return ONLY a JSON array of exactly 3 related job titles. No preamble, no explanation.",
            messages=[{
                "role": "user",
                "content": f"Give 3 job titles closely related to: {target_role}"
            }]
        )
        raw = response.content[0].text.strip()
        clean = raw.replace("```json","").replace("```","").strip()
        roles = json.loads(clean)
        return {"roles": roles}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/peers/{user_id}")
def get_peers(user_id: str):
    try:
        # Get current user's embedding
        embedding_result = supabase.table("user_embeddings")\
            .select("embedding")\
            .eq("user_id", user_id)\
            .execute()

        if not embedding_result.data:
            raise HTTPException(404, "User embedding not found")

        user_vector = embedding_result.data[0]["embedding"]

        # Get similar users via pgvector
        matches = supabase.rpc("match_users", {
            "query_embedding": user_vector,
            "match_count": 3,
            "exclude_user_id": user_id
        }).execute()

        if not matches.data:
            return {"peers": []}

        # Fetch user details for each match
        peers = []
        for match in matches.data:
            matched_user_id = match["user_id"]
            similarity = match["similarity"]

            user_data = supabase.table("users")\
                .select("name, target_role, gap_reason")\
                .eq("id", matched_user_id)\
                .execute()

            if not user_data.data:
                continue

            u = user_data.data[0]
            name = u["name"]
            initials = "".join([p[0].upper() for p in name.split()[:2]])

            peers.append({
                "id": matched_user_id,
                "initials": initials,
                "domain": u["target_role"],
                "gap_reason": u["gap_reason"] or "Personal",
                "match_reason": f"Similar skill profile, both returning to {u['target_role']} roles",
                "match_percent": round(similarity * 100)
            })

        return {"peers": peers}

    except Exception as e:
        raise HTTPException(500, str(e))
    
@app.post("/api/next-week")
def next_week(req: dict):
    try:
        user_id = req.get("user_id")
        week_number = req.get("week_number", 2)

        user = supabase.table("users").select("*").eq("id", user_id).execute().data[0]
        skills = supabase.table("skills").select("*").eq("user_id", user_id).execute().data

        gap = analyze_gap(skills, user["target_role"])
        actions = generate_weekly_actions(gap, user["target_role"], week_number) or []

        return {"weekly_actions": actions, "current_week": week_number}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/stories/{user_id}")
def get_stories(user_id: str):
    try:
        embedding_result = supabase.table("user_embeddings")\
            .select("embedding")\
            .eq("user_id", user_id)\
            .execute()

        if not embedding_result.data:
            raise HTTPException(404, "User embedding not found")

        user_vector = embedding_result.data[0]["embedding"]

        matches = supabase.rpc("match_stories", {
            "query_embedding": user_vector,
            "match_count": 1
        }).execute()

        if not matches.data:
            return {"story": None}

        return {"story": matches.data[0]}

    except Exception as e:
        raise HTTPException(500, str(e))