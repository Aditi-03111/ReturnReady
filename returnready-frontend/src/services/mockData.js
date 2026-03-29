export const mockAnalysis = {
  user_id: "mock-001",
  target_role: "Product Manager",
  gap_analysis: {
    strong_skills: ["Stakeholder Management", "Communication"],
    decayed_skills: [
      { skill_name: "Python", months_since_used: 57, refresh_priority: "high" },
      { skill_name: "SQL", months_since_used: 74, refresh_priority: "high" },
      { skill_name: "Team Leadership", months_since_used: 60, refresh_priority: "medium" },
    ],
    missing_skills: ["Agile/Scrum", "Product Roadmapping", "Data Analysis", "A/B Testing"],
    summary:
      "Your communication and leadership foundation is strong — refreshing your technical skills and adding core PM competencies will complete your return.",
    scored_skills: [
      { skill_name: "Stakeholder Management", domain: "communication", decay_score: 0.72, strength_label: "strong" },
      { skill_name: "Team Leadership", domain: "leadership", decay_score: 0.40, strength_label: "needs_refresh" },
      { skill_name: "Python", domain: "tech", decay_score: 0.11, strength_label: "heavily_decayed" },
      { skill_name: "SQL", domain: "tech", decay_score: 0.08, strength_label: "heavily_decayed" },
      { skill_name: "Product Strategy", domain: "domain_knowledge", decay_score: 0.22, strength_label: "heavily_decayed" },
    ],
  },
  weekly_actions: [
    {
      id: "a1",
      title: "Watch SQL Window Functions Tutorial",
      description: "Watch a focused YouTube tutorial on SQL window functions and practice 3 queries.",
      skill_targeted: "SQL",
      duration_minutes: 30,
      resource_type: "video",
      resource_url_placeholder: "SQL window functions tutorial YouTube 2024",
      priority: "high",
      completed: false,
    },
    {
      id: "a2",
      title: "Read Agile Sprint Guide",
      description: "Read an introductory article on Agile methodology and sprint ceremonies.",
      skill_targeted: "Agile/Scrum",
      duration_minutes: 25,
      resource_type: "article",
      resource_url_placeholder: "Agile methodology basics product managers",
      priority: "high",
      completed: false,
    },
    {
      id: "a3",
      title: "Map a Product Roadmap Example",
      description: "Find a public product roadmap and sketch your own version for a product you use daily.",
      skill_targeted: "Product Roadmapping",
      duration_minutes: 45,
      resource_type: "practice",
      resource_url_placeholder: "product roadmap template example free",
      priority: "medium",
      completed: false,
    },
  ],
};

export const mockPeers = [
  {
    id: "p1",
    initials: "AR",
    domain: "Product Management",
    gap_duration: "3 years",
    gap_reason: "Caregiving",
    match_reason: "Similar background in tech and leadership, both returning to PM roles",
    match_percent: 91,
  },
  {
    id: "p2",
    initials: "SM",
    domain: "Data & Analytics",
    gap_duration: "4 years",
    gap_reason: "Relocation",
    match_reason: "Strong SQL and Python overlap, targeting data-adjacent roles",
    match_percent: 78,
  },
  {
    id: "p3",
    initials: "KP",
    domain: "Product Management",
    gap_duration: "2 years",
    gap_reason: "Health",
    match_reason: "Shared leadership background and communication strengths",
    match_percent: 74,
  },
];

export const mockInterviewPrep = {
  reframe: "My time away from the workforce gave me deep expertise in project management, prioritization under pressure, and stakeholder communication — skills that directly translate to product management. I returned more focused and with a clearer sense of the impact I want to create.",
  questions: [
    {
      question: "Can you walk me through your career gap and what you did during that time?",
      tip: "Lead with what you gained, not what you missed. Frame it as a deliberate chapter.",
      category: "gap"
    },
    {
      question: "How have you stayed current with industry trends during your break?",
      tip: "Mention specific things — courses, projects, communities — even small ones count.",
      category: "gap"
    },
    {
      question: "Your SQL and Python skills have a gap — how would you get back up to speed?",
      tip: "Show you already have a plan. Mention the actions you're already taking.",
      category: "skills"
    },
    {
      question: "Why are you returning to product management specifically now?",
      tip: "Connect your personal journey to a genuine motivation. Authenticity wins here.",
      category: "motivation"
    }
  ]
};

export const mockReframes = [
  "During my career break, I managed complex caregiving logistics across multiple stakeholders — the same skill set that makes a great product manager.",
  "I took intentional time to step back and gain perspective on what kind of work creates real impact, which has sharpened my product thinking significantly.",
  "My gap gave me firsthand experience as a user navigating broken systems — I now bring that empathy directly into how I think about product decisions."
];
