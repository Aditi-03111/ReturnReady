import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockAnalysis, mockReframes } from "../services/mockData";
import { completeAction, getGapReframe } from "../services/api";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const REENTRY_STORIES = [
  {
    quote: "I was terrified my 4-year gap would define me. Instead, it taught me to advocate for myself in every interview.",
    name: "Meera R.", role: "Engineering Manager", gap: "4 year career gap"
  },
  {
    quote: "Returning felt impossible until I stopped trying to hide the gap and started leading with what I'd learned during it.",
    name: "Divya S.", role: "Senior Product Manager", gap: "3 year career gap"
  },
  {
    quote: "The skills didn't disappear. They just needed dusting off. Six months later I got promoted.",
    name: "Ananya K.", role: "Data Analyst", gap: "2 year career gap"
  }
];

const RESOURCE_ICONS = {
  video: "▶", article: "📄", course: "🎓", practice: "⚡", networking: "🤝"
};

export default function Move() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [completed, setCompleted] = useState({});
  const [relatedRoles, setRelatedRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [week, setWeek] = useState(1);
  const [reframes, setReframes] = useState([]);
  const [story, setStory] = useState(
    () => REENTRY_STORIES[Math.floor(Math.random() * REENTRY_STORIES.length)]
  );

  useEffect(() => {
    const cached = localStorage.getItem("analysis");
    const d = cached ? JSON.parse(cached) : mockAnalysis;
    setData(d);

    if (d?.target_role) {
      axios.post(`${BASE}/api/related-roles`, { target_role: d.target_role })
        .then((res) => setRelatedRoles(res.data.roles))
        .catch(() => setRelatedRoles([d.target_role]))
        .finally(() => setLoadingRoles(false));
    } else {
      setLoadingRoles(false);
    }

    const user_id = localStorage.getItem("user_id");
    if (user_id) {
      axios.get(`${BASE}/api/stories/${user_id}`)
        .then((res) => {
          if (res.data.story) {
            setStory({
              quote: res.data.story.quote,
              name: res.data.story.name,
              role: res.data.story.role,
              gap: res.data.story.gap_duration + " gap"
            });
          }
        })
        .catch(() => {});
    }

    // Gap reframes
    const gap_months = d?.gap_analysis?.scored_skills?.length
      ? Math.max(...(d.gap_analysis.scored_skills.map(s => s.months_since_used || 0)))
      : 12;
    getGapReframe({
      gap_reason: localStorage.getItem("gap_reason") || "career break",
      gap_months,
      target_role: d?.target_role || ""
    })
      .then((res) => setReframes(res.data.reframes))
      .catch(() => setReframes(mockReframes));
  }, []);

  const handleComplete = async (action, idx) => {
    setCompleted((prev) => ({ ...prev, [idx]: !prev[idx] }));
    if (action.id) {
      try { await completeAction(action.id, localStorage.getItem("user_id")); } catch (_) {}
    }
  };

  const handleNextWeek = async () => {
    const user_id = localStorage.getItem("user_id");
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/api/next-week`, { user_id, week_number: week + 1 });
      setData(prev => ({ ...prev, weekly_actions: res.data.weekly_actions, current_week: week + 1 }));
      setWeek(w => w + 1);
      setCompleted({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSearch = () => {
    const role = relatedRoles?.[0] || data?.target_role || "Software Engineer";
    const query = encodeURIComponent(`${role} jobs India 2025`);
    window.open(`https://www.linkedin.com/jobs/search/?keywords=${query}`, "_blank");
  };

  if (!data) return null;

  const { weekly_actions, target_role, total_weeks } = data;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const displayRoles = relatedRoles.length > 0 ? relatedRoles : target_role ? [target_role] : ["Loading roles..."];

  return (
    <div className="min-h-screen bg-sand px-6 py-10 max-w-3xl mx-auto relative">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-terra/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-ember/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <p className="text-terra text-sm font-semibold cursor-pointer mb-2"
          onClick={() => nav("/dashboard")}>← Dashboard</p>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">Move</p>
        <h1 className="font-display text-5xl text-star">This Week's Actions</h1>
        <p className="text-muted mt-2 text-sm">Small steps. Real progress.</p>
      </div>

      {/* Progress bar */}
      <div className="bg-nebula border border-purple-900/40 rounded-2xl p-4 mb-8 relative z-10">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink font-medium">
            {completedCount} of {weekly_actions.length} completed this week
          </span>
          <span className="text-muted">Week {week} of {total_weeks || 12}</span>
        </div>
        <div className="h-2 bg-purple-900/40 rounded-full">
          <div className="h-2 bg-terra rounded-full transition-all duration-700"
            style={{ width: `${(completedCount / weekly_actions.length) * 100}%` }} />
        </div>
        <div className="mt-3 h-1 bg-purple-900/20 rounded-full">
          <div className="h-1 bg-terra/40 rounded-full"
            style={{ width: `${(week / (total_weeks || 12)) * 100}%` }} />
        </div>
        <p className="text-muted text-xs mt-1">
          Overall return journey: Week {week} of {total_weeks || 12}
        </p>
        {completedCount === weekly_actions.length && (
          <p className="text-terra text-sm font-medium mt-2 text-center">
            ✦ Week complete — you showed up.
          </p>
        )}
        {completedCount === weekly_actions.length && week < (total_weeks || 12) && (
          <button onClick={handleNextWeek} disabled={loading}
            className="w-full mt-3 bg-terra text-star py-3 rounded-xl font-semibold hover:bg-purple-400 transition disabled:opacity-40">
            {loading ? "Loading next week..." : `Start Week ${week + 1} →`}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4 mb-10 relative z-10">
        {weekly_actions.map((action, idx) => (
          <div key={idx}
            className={`border rounded-2xl p-5 transition-all ${
              completed[idx]
                ? "border-terra/30 bg-terra/5 opacity-80"
                : "bg-nebula border-purple-900/40 hover:border-terra"
            }`}>
            <div className="flex items-start gap-4">
              <button onClick={() => handleComplete(action, idx)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  completed[idx] ? "bg-terra border-terra text-star" : "border-purple-700"
                }`}>
                {completed[idx] && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <h3 className={`font-display text-xl ${completed[idx] ? "line-through text-muted" : "text-star"}`}>
                  {action.title}
                </h3>
                <p className="text-muted text-sm mt-1">{action.description}</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
                  <span className="bg-terra/10 text-terra px-2 py-1 rounded border border-terra/20">{action.skill_targeted}</span>
                  <span>{RESOURCE_ICONS[action.resource_type] || "📌"} {action.resource_type}</span>
                  <span>⏱ {action.duration_minutes} mins</span>
                  {action.resource_url_placeholder && (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(action.resource_url_placeholder)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-terra underline hover:text-ember ml-auto">
                      Find resource →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Related roles */}
      <div className="bg-nebula border border-purple-900/40 rounded-2xl p-6 mb-6 relative z-10">
        <p className="text-xs text-muted mb-3 uppercase tracking-wider">You're preparing for roles like</p>
        <div className="space-y-2 mb-4">
          {displayRoles.map((role) => (
            <div key={role} className="flex gap-2">
              <span className="text-terra">✦</span>
              <span className="text-ink">{loadingRoles ? "Loading..." : role}</span>
            </div>
          ))}
        </div>
        <button onClick={handleRoleSearch} disabled={loadingRoles}
          className="w-full bg-surface text-star py-3 rounded-xl disabled:opacity-50 font-semibold hover:bg-nebula border border-purple-900/40 hover:border-terra transition">
          {loadingRoles ? "Loading roles..." : "👉 View open roles on LinkedIn"}
        </button>
      </div>

      {/* Story */}
      <div className="bg-terra/10 border border-terra/20 p-6 rounded-2xl mb-8 relative z-10">
        <p className="text-sm text-muted mb-2">✦ From someone who returned</p>
        <p className="font-display text-lg italic mb-3 text-star">"{story.quote}"</p>
        <p className="text-sm text-muted">{story.name} · {story.role}</p>
      </div>

      {/* Gap reframes */}
      {reframes.length > 0 && (
        <div className="bg-nebula border border-purple-900/40 rounded-2xl p-6 mb-8 relative z-10">
          <p className="text-terra text-xs font-semibold uppercase tracking-widest mb-4">
            ✦ How to reframe your gap
          </p>
          <div className="space-y-3">
            {reframes.map((r, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-terra mt-0.5 flex-shrink-0">"{i + 1}"</span>
                <p className="text-ink leading-relaxed italic">"{r}"</p>
              </div>
            ))}
          </div>
          <p className="text-muted text-xs mt-4">Use these when asked about your career break in interviews.</p>
        </div>
      )}

      <button onClick={() => nav("/dashboard/witness")}
        className="w-full bg-terra text-star py-4 rounded-2xl font-semibold text-lg hover:bg-purple-400 transition shadow-lg shadow-terra/20 relative z-10">
        Meet your peers →
      </button>

    </div>
  );
}
