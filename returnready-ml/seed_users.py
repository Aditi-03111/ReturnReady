import os
import json
from datetime import date, timedelta
from dotenv import load_dotenv
from supabase import create_client
from fastembed import TextEmbedding
from decay import score_all_skills

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

SEED_USERS = [
    {
        "name": "Priya Menon", "email": "priya.menon@seed.com",
        "target_role": "Data Analyst", "gap_reason": "Caregiving",
        "skills": [
            {"skill_name": "Python", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-06-01"},
            {"skill_name": "SQL", "domain": "tech", "proficiency": 5, "years_experience": 4, "last_used_date": "2021-06-01"},
            {"skill_name": "Excel", "domain": "tech", "proficiency": 4, "years_experience": 5, "last_used_date": "2021-06-01"},
            {"skill_name": "Data Visualization", "domain": "tech", "proficiency": 3, "years_experience": 2, "last_used_date": "2021-01-01"},
            {"skill_name": "Stakeholder Management", "domain": "communication", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-06-01"},
        ]
    },
    {
        "name": "Kavitha Rao", "email": "kavitha.rao@seed.com",
        "target_role": "DevOps Engineer", "gap_reason": "Health",
        "skills": [
            {"skill_name": "Docker", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-01-01"},
            {"skill_name": "Kubernetes", "domain": "tech", "proficiency": 3, "years_experience": 2, "last_used_date": "2022-01-01"},
            {"skill_name": "AWS", "domain": "tech", "proficiency": 4, "years_experience": 4, "last_used_date": "2022-01-01"},
            {"skill_name": "CI/CD", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-01-01"},
            {"skill_name": "Linux", "domain": "tech", "proficiency": 5, "years_experience": 5, "last_used_date": "2022-01-01"},
        ]
    },
    {
        "name": "Sunita Bhat", "email": "sunita.bhat@seed.com",
        "target_role": "Product Manager", "gap_reason": "Caregiving",
        "skills": [
            {"skill_name": "Product Strategy", "domain": "domain_knowledge", "proficiency": 4, "years_experience": 4, "last_used_date": "2020-06-01"},
            {"skill_name": "Agile/Scrum", "domain": "domain_knowledge", "proficiency": 4, "years_experience": 3, "last_used_date": "2020-06-01"},
            {"skill_name": "Stakeholder Management", "domain": "communication", "proficiency": 5, "years_experience": 5, "last_used_date": "2020-06-01"},
            {"skill_name": "User Research", "domain": "domain_knowledge", "proficiency": 3, "years_experience": 2, "last_used_date": "2020-01-01"},
            {"skill_name": "Team Leadership", "domain": "leadership", "proficiency": 4, "years_experience": 4, "last_used_date": "2020-06-01"},
        ]
    },
    {
        "name": "Meera Nair", "email": "meera.nair@seed.com",
        "target_role": "Backend Engineer", "gap_reason": "Relocation",
        "skills": [
            {"skill_name": "Python", "domain": "tech", "proficiency": 5, "years_experience": 5, "last_used_date": "2021-09-01"},
            {"skill_name": "Django", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-09-01"},
            {"skill_name": "PostgreSQL", "domain": "tech", "proficiency": 4, "years_experience": 4, "last_used_date": "2021-09-01"},
            {"skill_name": "REST APIs", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-09-01"},
            {"skill_name": "Git", "domain": "tech", "proficiency": 4, "years_experience": 5, "last_used_date": "2021-09-01"},
        ]
    },
    {
        "name": "Ananya Singh", "email": "ananya.singh@seed.com",
        "target_role": "Cloud Engineer", "gap_reason": "Caregiving",
        "skills": [
            {"skill_name": "AWS", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-12-01"},
            {"skill_name": "Terraform", "domain": "tech", "proficiency": 3, "years_experience": 2, "last_used_date": "2021-12-01"},
            {"skill_name": "Python", "domain": "tech", "proficiency": 3, "years_experience": 3, "last_used_date": "2021-12-01"},
            {"skill_name": "Linux", "domain": "tech", "proficiency": 4, "years_experience": 4, "last_used_date": "2021-12-01"},
            {"skill_name": "Networking", "domain": "tech", "proficiency": 3, "years_experience": 2, "last_used_date": "2021-06-01"},
        ]
    },
    {
        "name": "Divya Krishnan", "email": "divya.krishnan@seed.com",
        "target_role": "ML Engineer", "gap_reason": "Education",
        "skills": [
            {"skill_name": "Python", "domain": "tech", "proficiency": 5, "years_experience": 4, "last_used_date": "2022-06-01"},
            {"skill_name": "TensorFlow", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-06-01"},
            {"skill_name": "scikit-learn", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-06-01"},
            {"skill_name": "SQL", "domain": "tech", "proficiency": 3, "years_experience": 2, "last_used_date": "2022-01-01"},
            {"skill_name": "Statistics", "domain": "domain_knowledge", "proficiency": 4, "years_experience": 4, "last_used_date": "2022-06-01"},
        ]
    },
    {
        "name": "Lakshmi Iyer", "email": "lakshmi.iyer@seed.com",
        "target_role": "UX Designer", "gap_reason": "Caregiving",
        "skills": [
            {"skill_name": "Figma", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-03-01"},
            {"skill_name": "User Research", "domain": "domain_knowledge", "proficiency": 4, "years_experience": 4, "last_used_date": "2021-03-01"},
            {"skill_name": "Prototyping", "domain": "tech", "proficiency": 3, "years_experience": 3, "last_used_date": "2021-03-01"},
            {"skill_name": "Wireframing", "domain": "tech", "proficiency": 4, "years_experience": 4, "last_used_date": "2021-03-01"},
            {"skill_name": "Communication", "domain": "communication", "proficiency": 5, "years_experience": 5, "last_used_date": "2021-03-01"},
        ]
    },
    {
        "name": "Nithya Sharma", "email": "nithya.sharma@seed.com",
        "target_role": "Site Reliability Engineer", "gap_reason": "Health",
        "skills": [
            {"skill_name": "Prometheus", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-03-01"},
            {"skill_name": "Grafana", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-03-01"},
            {"skill_name": "Kubernetes", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2022-03-01"},
            {"skill_name": "Python", "domain": "tech", "proficiency": 3, "years_experience": 2, "last_used_date": "2022-03-01"},
            {"skill_name": "Incident Management", "domain": "domain_knowledge", "proficiency": 4, "years_experience": 4, "last_used_date": "2022-03-01"},
        ]
    },
    {
        "name": "Rekha Pillai", "email": "rekha.pillai@seed.com",
        "target_role": "Scrum Master", "gap_reason": "Caregiving",
        "skills": [
            {"skill_name": "Agile/Scrum", "domain": "domain_knowledge", "proficiency": 5, "years_experience": 5, "last_used_date": "2020-09-01"},
            {"skill_name": "JIRA", "domain": "tech", "proficiency": 4, "years_experience": 4, "last_used_date": "2020-09-01"},
            {"skill_name": "Team Leadership", "domain": "leadership", "proficiency": 4, "years_experience": 4, "last_used_date": "2020-09-01"},
            {"skill_name": "Stakeholder Management", "domain": "communication", "proficiency": 4, "years_experience": 3, "last_used_date": "2020-09-01"},
            {"skill_name": "Risk Management", "domain": "domain_knowledge", "proficiency": 3, "years_experience": 3, "last_used_date": "2020-09-01"},
        ]
    },
    {
        "name": "Pooja Verma", "email": "pooja.verma@seed.com",
        "target_role": "Data Scientist", "gap_reason": "Relocation",
        "skills": [
            {"skill_name": "Python", "domain": "tech", "proficiency": 5, "years_experience": 4, "last_used_date": "2021-06-01"},
            {"skill_name": "R", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-06-01"},
            {"skill_name": "Machine Learning", "domain": "tech", "proficiency": 4, "years_experience": 3, "last_used_date": "2021-06-01"},
            {"skill_name": "SQL", "domain": "tech", "proficiency": 4, "years_experience": 4, "last_used_date": "2021-06-01"},
            {"skill_name": "Statistics", "domain": "domain_knowledge", "proficiency": 5, "years_experience": 5, "last_used_date": "2021-06-01"},
        ]
    },
]

def generate_vector(skills):
    scored = score_all_skills(skills)
    parts = []
    for s in scored:
        weight = max(1, round(s["decay_score"] * 10))
        parts.extend([f"{s['skill_name']} {s['domain']}"] * weight)
    text = " ".join(parts)
    vector = list(model.embed([text]))[0]
    return vector.tolist()

def seed():
    print(f"Seeding {len(SEED_USERS)} users...\n")

    for i, u in enumerate(SEED_USERS):
        try:
            # Check if email exists
            existing = supabase.table("users").select("id").eq("email", u["email"]).execute()
            if existing.data:
                print(f"  ⚠️  {i+1}/{len(SEED_USERS)} — {u['name']} already exists, skipping")
                continue

            # Insert user
            user_result = supabase.table("users").insert({
                "name": u["name"],
                "email": u["email"],
                "target_role": u["target_role"],
                "gap_reason": u["gap_reason"]
            }).execute()
            user_id = user_result.data[0]["id"]

            # Insert skills
            skills_data = [{"user_id": user_id, **s} for s in u["skills"]]
            supabase.table("skills").insert(skills_data).execute()

            # Generate and store embedding
            vector = generate_vector(u["skills"])
            supabase.table("user_embeddings").insert({
                "user_id": user_id,
                "embedding": vector
            }).execute()

            print(f"  ✅ {i+1}/{len(SEED_USERS)} — {u['name']} ({u['target_role']})")

        except Exception as e:
            print(f"  ❌ {i+1}/{len(SEED_USERS)} — {u['name']} failed: {e}")

    print("\nDone. Seed users created.")

if __name__ == "__main__":
    seed()