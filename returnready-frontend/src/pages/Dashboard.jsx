import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeUser } from "../services/api";
import { mockAnalysis } from "../services/mockData";

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user_id = localStorage.getItem("user_id");
  const user_name = localStorage.getItem("user_name") || "there";

  useEffect(() => {
    if (!user_id) { nav("/onboarding"); return; }

    const cached = localStorage.getItem("analysis");
    const cacheTime = localStorage.getItem("analysis_time");
    const cacheAge = cacheTime ? (Date.now() - parseInt(cacheTime)) / 1000 / 60 : 999;

    if (cached && cacheAge < 30) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    analyzeUser(user_id)
      .then((res) => {
        localStorage.setItem("analysis", JSON.stringify(res.data));
        localStorage.setItem("analysis_time", Date.now().toString());
        setData(res.data);
      })
      .catch(() => setData(mockAnalysis))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terra border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted font-medium">Analyzing your profile...</p>
      </div>
    </div>
  );

  const { gap_analysis, weekly_actions } = data;
  const strongCount = gap_analysis.strong_skills.length;
  const decayedCount = gap_analysis.decayed_skills.length;
  const missingCount = gap_analysis.missing_skills.length;
  const completedActions = weekly_actions.filter((a) => a.completed).length;

  return (
    <div className="min-h-screen bg-sand px-6 py-10 max-w-3xl mx-auto relative">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-terra/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-ember/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-10 relative z-10">
        <p className="text-muted text-sm tracking-widest uppercase mb-1">Your return journey</p>
        <h1 className="font-display text-5xl text-star">
          Hi, {user_name.split(" ")[0]} ✦
        </h1>
        <p className="text-muted mt-2">
          Returning as <span className="text-terra font-medium">{data.target_role}</span>
        </p>
        <button
          onClick={() => { localStorage.removeItem("analysis"); window.location.reload(); }}
          className="text-xs text-muted underline mt-1 hover:text-terra"
        >
          Refresh analysis
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
        <div className="bg-nebula rounded-2xl p-4 text-center border border-purple-900/40">
          <p className="font-display text-3xl text-terra">{strongCount}</p>
          <p className="text-muted text-xs mt-1">Strong skills</p>
        </div>
        <div className="bg-nebula rounded-2xl p-4 text-center border border-purple-900/40">
          <p className="font-display text-3xl text-ember">{decayedCount}</p>
          <p className="text-muted text-xs mt-1">Need refresh</p>
        </div>
        <div className="bg-nebula rounded-2xl p-4 text-center border border-purple-900/40">
          <p className="font-display text-3xl text-star">{missingCount}</p>
          <p className="text-muted text-xs mt-1">To learn</p>
        </div>
      </div>

      {/* Three pillars */}
      <div className="space-y-5 relative z-10">

        {/* Mirror */}
        <div
          onClick={() => nav("/dashboard/mirror")}
          className="bg-nebula border border-purple-900/40 rounded-2xl p-6 cursor-pointer hover:border-terra transition group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-terra text-xs font-semibold tracking-widest uppercase mb-1">Mirror</p>
              <h2 className="font-display text-2xl text-star mb-2">Your Skills Constellation</h2>
              <p className="text-muted text-sm leading-relaxed">
                See where your skills stand today — what's still strong, what's faded, what's missing.
              </p>
            </div>
            <span className="text-purple-800 group-hover:text-terra text-2xl transition ml-4">→</span>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {gap_analysis.strong_skills.slice(0, 3).map((s) => (
              <span key={s} className="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full">{s}</span>
            ))}
            {gap_analysis.decayed_skills.slice(0, 2).map((s) => (
              <span key={s.skill_name} className="bg-ember/10 text-ember text-xs px-3 py-1 rounded-full">{s.skill_name}</span>
            ))}
          </div>
        </div>

        {/* Move */}
        <div
          onClick={() => nav("/dashboard/move")}
          className="bg-nebula border border-purple-900/40 rounded-2xl p-6 cursor-pointer hover:border-terra transition group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-terra text-xs font-semibold tracking-widest uppercase mb-1">Move</p>
              <h2 className="font-display text-2xl text-star mb-2">This Week's Actions</h2>
              <p className="text-muted text-sm leading-relaxed">
                Three micro-actions tailored to your gap. Small steps, real progress.
              </p>
            </div>
            <span className="text-purple-800 group-hover:text-terra text-2xl transition ml-4">→</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{completedActions} of {weekly_actions.length} completed</span>
              <span>Week 1</span>
            </div>
            <div className="h-1.5 bg-purple-900/40 rounded-full">
              <div
                className="h-1.5 bg-terra rounded-full transition-all"
                style={{ width: `${(completedActions / weekly_actions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Witness */}
        <div
          onClick={() => nav("/dashboard/witness")}
          className="bg-nebula border border-purple-900/40 rounded-2xl p-6 cursor-pointer hover:border-terra transition group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-terra text-xs font-semibold tracking-widest uppercase mb-1">Witness</p>
              <h2 className="font-display text-2xl text-star mb-2">Your Silent Peers</h2>
              <p className="text-muted text-sm leading-relaxed">
                People on the same path. You're not doing this alone.
              </p>
            </div>
            <span className="text-purple-800 group-hover:text-terra text-2xl transition ml-4">→</span>
          </div>
          <div className="mt-4 flex gap-2">
            {["AR", "SM", "KP"].map((initials) => (
              <div key={initials} className="w-8 h-8 rounded-full bg-terra/80 text-star text-xs font-semibold flex items-center justify-center">
                {initials}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-purple-900/40 text-muted text-xs flex items-center justify-center">
              +2
            </div>
          </div>
        </div>

      </div>

      {/* Summary quote */}
      <div className="mt-10 bg-terra/10 border border-terra/20 rounded-2xl p-6 relative z-10">
        <p className="font-display text-lg text-star italic leading-relaxed">
          "{gap_analysis.summary}"
        </p>
      </div>

    </div>
  );
}
