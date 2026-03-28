import os
from fastembed import TextEmbedding
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def generate_user_vector(scored_skills: list[dict]) -> list[float]:
    """
    Takes scored skills (output of score_all_skills from decay.py).
    Builds a weighted text representation, embeds it.
    Returns a 384-dim vector as a list of floats.
    """
    parts = []
    for s in scored_skills:
        # Repeat skill name proportional to decay score so stronger skills
        # have more weight in the embedding
        weight = max(1, round(s["decay_score"] * 10))
        parts.extend([f"{s['skill_name']} {s['domain']}"] * weight)

    text = " ".join(parts)
    vector = list(model.embed([text]))[0]
    return vector.tolist()


def store_embedding(user_id: str, vector: list[float]) -> None:
    """
    Stores or updates the user's embedding in Supabase user_embeddings table.
    """
    # Check if embedding already exists
    existing = supabase.table("user_embeddings") \
        .select("id") \
        .eq("user_id", user_id) \
        .execute()

    if existing.data:
        supabase.table("user_embeddings") \
            .update({"embedding": vector}) \
            .eq("user_id", user_id) \
            .execute()
    else:
        supabase.table("user_embeddings") \
            .insert({"user_id": user_id, "embedding": vector}) \
            .execute()


def get_similar_users(user_id: str, limit: int = 3) -> list[dict]:
    """
    Finds similar users using pgvector cosine similarity.
    Returns top N matches excluding the current user.
    """
    # Get current user's embedding
    result = supabase.table("user_embeddings") \
        .select("embedding") \
        .eq("user_id", user_id) \
        .execute()

    if not result.data:
        return []

    user_vector = result.data[0]["embedding"]

    # Use Supabase RPC for vector similarity search
    matches = supabase.rpc("match_users", {
        "query_embedding": user_vector,
        "match_count": limit + 1,  # +1 to exclude self
        "exclude_user_id": user_id
    }).execute()

    return matches.data if matches.data else []


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    from decay import score_all_skills

    test_skills = [
        {"skill_name": "Python", "domain": "tech", "proficiency": 4,
         "years_experience": 3, "last_used_date": "2021-06-01"},
        {"skill_name": "Team Leadership", "domain": "leadership", "proficiency": 4,
         "years_experience": 4, "last_used_date": "2021-03-01"},
    ]

    scored = score_all_skills(test_skills)
    vector = generate_user_vector(scored)

    print(f"Vector dimensions: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")
    print("Embedding generated successfully.")