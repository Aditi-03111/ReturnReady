import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockAnalysis } from "../services/mockData";
import { completeAction } from "../services/api";
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
}, []);

  const handleComplete = async (action, idx) => {
    setCompleted((prev) => ({ ...prev, [idx]: !prev[idx] }));
    if (action.id) {
      try {
        await completeAction(action.id, localStorage.getItem("user_id"));
      } catch (_) {}
    }
  };

  const handleNextWeek = async () => {
    const user_id = localStorage.getItem("user_id");
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/api/next-week`, {
        user_id,
        week_number: week + 1
      });
      setData(prev => ({
        ...prev,
        weekly_actions: res.data.weekly_actions,
        current_week: week + 1
      }));
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

  const { weekly_actions, target_role, total_weeks, current_week } = data;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const displayRoles = relatedRoles.length > 0 ? relatedRoles : target_role ? [target_role] : ["Loading roles..."];

  return (
    <div className="min-h-screen bg-sand px-6 py-10 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-terra text-sm font-semibold cursor-pointer mb-2"
          onClick={() => nav("/dashboard")}>← Dashboard</p>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">Move</p>
        <h1 className="font-display text-5xl text-ink">This Week's Actions</h1>
        <p className="text-muted mt-2 text-sm">Small steps. Real progress.</p>
      </div>

      {/* Progress bar */}
      <div className="bg-surface border border-stone-200 rounded-2xl p-4 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink font-medium">
            {completedCount} of {weekly_actions.length} completed this week
          </span>
          <span className="text-muted">Week {week} of {total_weeks || 12}</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full">
          <div className="h-2 bg-terra rounded-full transition-all duration-700"
            style={{ width: `${(completedCount / weekly_actions.length) * 100}%` }} />
        </div>
        <div className="mt-3 h-1 bg-stone-100 rounded-full">
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
            className="w-full mt-3 bg-terra text-sand py-3 rounded-xl font-semibold hover:bg-orange-800 transition disabled:opacity-40">
            {loading ? "Loading next week..." : `Start Week ${week + 1} →`}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4 mb-10">
        {weekly_actions.map((action, idx) => (
          <div key={idx}
            className={`bg-surface border rounded-2xl p-5 transition-all ${
              completed[idx] ? "border-green-300 bg-green-50 opacity-80" : "border-stone-200 hover:border-terra"
            }`}>
            <div className="flex items-start gap-4">
              <button onClick={() => handleComplete(action, idx)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  completed[idx] ? "bg-terra border-terra text-sand" : "border-stone-300"
                }`}>
                {completed[idx] && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <h3 className={`font-display text-xl ${completed[idx] ? "line-through text-muted" : "text-ink"}`}>
                  {action.title}
                </h3>
                <p className="text-muted text-sm mt-1">{action.description}</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
                  <span className="bg-terra/10 text-terra px-2 py-1 rounded">{action.skill_targeted}</span>
                  <span>{RESOURCE_ICONS[action.resource_type] || "📌"} {action.resource_type}</span>
                  <span>⏱ {action.duration_minutes} mins</span>
                  {action.resource_url_placeholder && (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(action.resource_url_placeholder)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-terra underline hover:text-orange-800 ml-auto">
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
      <div className="bg-surface border border-stone-200 rounded-2xl p-6 mb-6">
        <p className="text-xs text-muted mb-3 uppercase">You're preparing for roles like</p>
        <div className="space-y-2 mb-4">
          {displayRoles.map((role) => (
            <div key={role} className="flex gap-2">
              <span className="text-terra">✦</span>
              <span className="text-ink">{loadingRoles ? "Loading..." : role}</span>
            </div>
          ))}
        </div>
        <button onClick={handleRoleSearch} disabled={loadingRoles}
          className="w-full bg-ink text-sand py-3 rounded-xl disabled:opacity-50 font-semibold hover:bg-stone-800 transition">
          {loadingRoles ? "Loading roles..." : "👉 View open roles on LinkedIn"}
        </button>
      </div>

      {/* Story */}
      <div className="bg-terra/10 p-6 rounded-2xl mb-8">
        <p className="text-sm text-muted mb-2">✦ From someone who returned</p>
        <p className="font-display text-lg italic mb-3">"{story.quote}"</p>
        <p className="text-sm text-muted">{story.name} · {story.role}</p>
      </div>

      {/* Next */}
      <button onClick={() => nav("/dashboard/witness")}
        className="w-full bg-terra text-sand py-4 rounded-2xl font-semibold text-lg hover:bg-orange-800 transition">
        Meet your peers →
      </button>

    </div>
  );
}