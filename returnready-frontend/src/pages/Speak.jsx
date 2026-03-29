import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInterviewPrep } from "../services/api";
import { mockAnalysis, mockInterviewPrep } from "../services/mockData";

const CATEGORY_COLORS = {
  gap: "bg-purple-900/30 text-purple-300 border-purple-700/30",
  skills: "bg-ember/10 text-ember border-ember/20",
  motivation: "bg-terra/10 text-terra border-terra/20",
};

export default function Speak() {
  const nav = useNavigate();
  const [prep, setPrep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const cached = localStorage.getItem("analysis");
    const data = cached ? JSON.parse(cached) : mockAnalysis;
    const { gap_analysis, target_role } = data;

    const gap_months = gap_analysis.scored_skills?.length
      ? Math.max(...gap_analysis.scored_skills.map(s => s.months_since_used || 0))
      : 12;

    getInterviewPrep({
      target_role,
      gap_reason: localStorage.getItem("gap_reason") || "career break",
      gap_months,
      decayed_skills: gap_analysis.decayed_skills || [],
      missing_skills: gap_analysis.missing_skills || [],
    })
      .then((res) => setPrep(res.data))
      .catch(() => setPrep(mockInterviewPrep))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terra border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm">Preparing your interview coach...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand px-6 py-10 max-w-3xl mx-auto relative">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-terra/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-ember/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <p className="text-terra text-sm font-semibold cursor-pointer mb-2"
          onClick={() => nav("/dashboard")}>← Dashboard</p>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">Speak</p>
        <h1 className="font-display text-5xl text-star">Interview Prep</h1>
        <p className="text-muted mt-2 text-sm">
          Questions tailored to your gap and target role. Practice until it feels natural.
        </p>
      </div>

      {/* Gap reframe */}
      <div className="bg-terra/10 border border-terra/20 rounded-2xl p-6 mb-8 relative z-10">
        <p className="text-terra text-xs font-semibold uppercase tracking-widest mb-3">
          ✦ How to frame your gap
        </p>
        <p className="text-star font-display text-lg italic leading-relaxed">
          "{prep.reframe}"
        </p>
        <p className="text-muted text-xs mt-3">Use this as your opening when asked about your career break.</p>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-10 relative z-10">
        <p className="text-muted text-xs uppercase tracking-widest mb-2">Practice questions</p>
        {prep.questions.map((q, i) => (
          <div key={i}
            className={`bg-nebula border rounded-2xl p-5 cursor-pointer transition-all ${
              expanded[i] ? "border-terra" : "border-purple-900/40 hover:border-terra/50"
            }`}
            onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[q.category]}`}>
                    {q.category}
                  </span>
                </div>
                <p className="text-star font-medium leading-relaxed">{q.question}</p>
              </div>
              <span className={`text-muted text-lg transition-transform ${expanded[i] ? "rotate-180" : ""}`}>
                ↓
              </span>
            </div>

            {expanded[i] && (
              <div className="mt-4 pt-4 border-t border-purple-900/30">
                <p className="text-terra text-xs font-semibold uppercase tracking-wider mb-1">Coach tip</p>
                <p className="text-muted text-sm leading-relaxed">{q.tip}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reminder */}
      <div className="bg-nebula border border-purple-900/40 rounded-2xl p-5 mb-8 relative z-10">
        <p className="text-xs text-muted uppercase tracking-wider mb-2">Remember</p>
        <div className="space-y-2">
          {[
            "Your gap is not a liability — it's a chapter with transferable lessons.",
            "Interviewers respect self-awareness more than a perfect timeline.",
            "Practice your reframe out loud at least 5 times before the interview."
          ].map((tip, i) => (
            <div key={i} className="flex gap-2 text-sm text-ink">
              <span className="text-terra mt-0.5">✦</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => nav("/dashboard")}
        className="w-full bg-terra text-star py-4 rounded-2xl font-semibold text-lg hover:bg-purple-400 transition shadow-lg shadow-terra/20 relative z-10">
        Back to dashboard →
      </button>

    </div>
  );
}
