import os
import json
from dotenv import load_dotenv
from supabase import create_client
from fastembed import TextEmbedding

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

STORIES = [
    {
        "name": "Priya M.", "role": "Senior Data Analyst", "domain": "data",
        "gap_duration": "3 years", "gap_reason": "Caregiving",
        "quote": "I came back after 3 years caring for my mother. My SQL was rusty but my ability to think through problems hadn't gone anywhere. I got hired within 2 months of starting my search.",
        "full_story": "Priya took a 3-year break from her data analyst role to care for her ailing mother. She spent her last month before returning doing SQL practice problems daily and refreshing her Excel skills. She was transparent about her gap in interviews and found that most hiring managers respected her honesty. She landed a senior role at a fintech startup."
    },
    {
        "name": "Ananya K.", "role": "DevOps Engineer", "domain": "devops",
        "gap_duration": "2 years", "gap_reason": "Health",
        "quote": "The skills didn't disappear. They just needed dusting off. Six months of focused upskilling and I was back, this time at a better company.",
        "full_story": "Ananya left her DevOps role due to burnout and health issues. She used her recovery time to get AWS certified and learn Kubernetes properly. When she returned, she found the market had shifted toward cloud-native tools — skills she had just learned. She joined a Series B startup as a DevOps engineer."
    },
    {
        "name": "Meera R.", "role": "Engineering Manager", "domain": "engineering",
        "gap_duration": "4 years", "gap_reason": "Caregiving",
        "quote": "I was terrified my 4-year gap would define me. Instead, it taught me to advocate for myself in every interview.",
        "full_story": "Meera left her engineering manager role after her second child. She worried constantly about being out of touch. When she returned, she focused on her leadership experience rather than technical depth. She joined a mid-size product company and was managing a team of 6 within 6 months."
    },
    {
        "name": "Divya S.", "role": "Product Manager", "domain": "product",
        "gap_duration": "3 years", "gap_reason": "Relocation",
        "quote": "Returning felt impossible until I stopped trying to hide the gap and started leading with what I had learned during it.",
        "full_story": "Divya relocated internationally for her spouse's job and had to leave her PM role. She spent her time abroad doing freelance product consulting and building her network online. When she moved back, she had a stronger portfolio than when she left. She joined a SaaS company as a Senior PM."
    },
    {
        "name": "Kavitha L.", "role": "Cloud Architect", "domain": "cloud",
        "gap_duration": "2 years", "gap_reason": "Education",
        "quote": "I used my break to get certified. I came back overqualified for my old role and got a better one.",
        "full_story": "Kavitha took time off to pursue an advanced degree in cloud computing. She came back with AWS Solutions Architect and GCP Professional certifications. Companies competed for her. She joined a large enterprise as a cloud architect at a salary 40% higher than her pre-break role."
    },
    {
        "name": "Reshma P.", "role": "Scrum Master", "domain": "agile",
        "gap_duration": "5 years", "gap_reason": "Caregiving",
        "quote": "Five years felt like forever. But agile is about people, and I had spent 5 years managing the most complex project of my life.",
        "full_story": "Reshma left her Scrum Master role to raise her children. When she returned, she reframed her gap as project management at scale. She got her PSM certification refreshed and joined a product company's agile transformation team."
    },
    {
        "name": "Sunita B.", "role": "Backend Engineer", "domain": "engineering",
        "gap_duration": "2 years", "gap_reason": "Health",
        "quote": "I rebuilt my Python skills in 6 weeks. The fundamentals never leave you — you just need to remind yourself.",
        "full_story": "Sunita took a break due to a chronic illness. During recovery she did small coding projects from home. When she felt ready, she did a 6-week intensive refresh and applied. She got 3 offers in her first month of searching."
    },
    {
        "name": "Nithya V.", "role": "UX Designer", "domain": "design",
        "gap_duration": "3 years", "gap_reason": "Caregiving",
        "quote": "My portfolio was outdated but my eye for design wasn't. I rebuilt 3 case studies during my gap and they were my best work yet.",
        "full_story": "Nithya left her UX role after her first child. She kept her skills sharp by redesigning apps she used daily and documenting her thinking. When she returned, her portfolio showed growth, not stagnation. She joined a product design team at a fintech company."
    },
    {
        "name": "Lakshmi R.", "role": "Data Scientist", "domain": "data",
        "gap_duration": "4 years", "gap_reason": "Caregiving",
        "quote": "I thought machine learning had moved on without me. It had, but so had I. My perspective as someone who had lived outside tech was exactly what my team needed.",
        "full_story": "Lakshmi took 4 years off as a data scientist to care for elderly parents. She returned during the AI boom and found that her statistical fundamentals were more valuable than ever. She spent 2 months on Kaggle competitions to rebuild confidence and joined an AI startup."
    },
    {
        "name": "Smitha D.", "role": "Security Engineer", "domain": "security",
        "gap_duration": "2 years", "gap_reason": "Relocation",
        "quote": "Cybersecurity never sleeps and I was worried I had missed too much. But the fundamentals are timeless — only the attacks change.",
        "full_story": "Smitha relocated internationally and had to leave her security engineer role. She kept up with the field through online communities and CTF competitions. When she returned to the job market, her continuous learning impressed interviewers more than her gap concerned them."
    },
    {
        "name": "Pooja N.", "role": "Mobile Developer", "domain": "mobile",
        "gap_duration": "3 years", "gap_reason": "Health",
        "quote": "Swift had changed. Kotlin had changed. But problem-solving hadn't. I rebuilt my first app in a weekend.",
        "full_story": "Pooja left her mobile development role due to a serious illness. During recovery she built small apps for fun. When she returned, she updated her portfolio with modern Swift and Kotlin projects. She got a role at a mobile-first startup within 6 weeks."
    },
    {
        "name": "Aruna T.", "role": "Product Analyst", "domain": "product",
        "gap_duration": "2 years", "gap_reason": "Education",
        "quote": "I came back with an MBA and more confidence. The gap wasn't a hole in my resume — it was a chapter.",
        "full_story": "Aruna took 2 years off for an MBA. She returned with stronger business acumen and a clearer sense of direction. She moved from pure analytics into product strategy and found the transition natural. She joined a growth-stage startup as a product analyst with a clear path to PM."
    },
    {
        "name": "Geetha M.", "role": "DevOps Engineer", "domain": "devops",
        "gap_duration": "3 years", "gap_reason": "Caregiving",
        "quote": "CI/CD pipelines are logic. Logic doesn't expire. I was writing Jenkins scripts within a week of returning.",
        "full_story": "Geetha left her DevOps role to care for her newborn and then her mother. She returned to find the market had shifted to GitHub Actions and ArgoCD. She spent 3 weeks learning the new tools and joined a cloud-native company as a DevOps engineer."
    },
    {
        "name": "Bharathi S.", "role": "ML Engineer", "domain": "ml",
        "gap_duration": "2 years", "gap_reason": "Caregiving",
        "quote": "I thought 2 years in ML meant I was obsolete. Then I realized I had 6 years of experience and 2 years of perspective. That's rare.",
        "full_story": "Bharathi left her ML engineering role after her twins were born. She returned during the generative AI explosion and found that her deep learning fundamentals were gold. She spent a month on Hugging Face projects and joined an AI startup building RAG applications."
    },
    {
        "name": "Chitra P.", "role": "Cloud Engineer", "domain": "cloud",
        "gap_duration": "4 years", "gap_reason": "Relocation",
        "quote": "AWS certifications don't expire for 3 years. I renewed mine during my break and came back more credentialed than when I left.",
        "full_story": "Chitra relocated and spent 4 years away from formal employment. She used the time to earn multiple AWS certifications and contribute to open source cloud projects. When she returned to the job market she had certifications, projects, and a gap that told a story of growth."
    },
]

def embed_story(story: dict) -> list[float]:
    text = f"{story['role']} {story['domain']} {story['gap_reason']} {story['quote']} {story['full_story']}"
    vector = list(model.embed([text]))[0]
    return vector.tolist()

def seed():
    print(f"Seeding {len(STORIES)} stories...")
    
    # Check if table exists — create if not
    for i, story in enumerate(STORIES):
        vector = embed_story(story)
        supabase.table("stories").insert({
            "name": story["name"],
            "role": story["role"],
            "domain": story["domain"],
            "gap_duration": story["gap_duration"],
            "gap_reason": story["gap_reason"],
            "quote": story["quote"],
            "full_story": story["full_story"],
            "embedding": vector
        }).execute()
        print(f"  ✅ {i+1}/{len(STORIES)} — {story['name']}")

    print("\nDone. Stories seeded.")

if __name__ == "__main__":
    seed()