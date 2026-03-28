import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { onboardUser } from "../services/api";

const DOMAINS = ["tech", "leadership", "communication", "domain_knowledge", "other"];
const GAP_REASONS = ["Caregiving", "Health", "Relocation", "Education", "Other"];

const empty_skill = () => ({
  skill_name: "",
  domain: "tech",
  proficiency: 3,
  years_experience: 1,
  last_used_date: "2022-01-01",
});

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    target_role: "",
    gap_reason: "Caregiving",
    skills: [empty_skill()],
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateSkill = (i, field, value) => {
    const skills = [...form.skills];
    skills[i] = { ...skills[i], [field]: value };
    setForm((f) => ({ ...f, skills }));
  };

  const addSkill = () =>
    setForm((f) => ({ ...f, skills: [...f.skills, empty_skill()] }));

  const removeSkill = (i) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await onboardUser(form);
      const user_id = res.data.user_id;
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("user_name", form.name);
      nav("/dashboard");
    } catch (e) {
      setError(e?.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-stone-300 rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-terra transition";
  const labelClass = "block text-sm font-medium text-muted mb-1";

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <p
            className="text-terra text-sm font-semibold cursor-pointer mb-2"
            onClick={() => nav("/")}
          >
            ← ReturnReady
          </p>
          <h2 className="font-display text-4xl text-ink">
            {step === 1 && "Who are you?"}
            {step === 2 && "Your skills"}
            {step === 3 && "Your gap"}
          </h2>
          <p className="text-muted mt-1 text-sm">Step {step} of 3</p>

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-stone-200 rounded-full">
            <div
              className="h-1 bg-terra rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 — Personal info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Your name</label>
              <input
                className={inputClass}
                placeholder="Priya Sharma"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                type="email"
                placeholder="priya@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Target role</label>
              <input
                className={inputClass}
                placeholder="Product Manager at a tech company"
                value={form.target_role}
                onChange={(e) => update("target_role", e.target.value)}
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.email || !form.target_role}
              className="w-full bg-terra text-sand py-3 rounded-xl font-semibold hover:bg-orange-800 transition disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Skills */}
        {step === 2 && (
          <div className="space-y-6">
            {form.skills.map((skill, i) => (
              <div key={i} className="bg-surface rounded-2xl p-5 border border-stone-200 relative">
                {form.skills.length > 1 && (
                  <button
                    onClick={() => removeSkill(i)}
                    className="absolute top-3 right-3 text-muted hover:text-terra text-lg"
                  >
                    ×
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Skill name</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Python, Team Leadership"
                      value={skill.skill_name}
                      onChange={(e) => updateSkill(i, "skill_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Domain</label>
                    <select
                      className={inputClass}
                      value={skill.domain}
                      onChange={(e) => updateSkill(i, "domain", e.target.value)}
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Proficiency (1–5)</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={5}
                      value={skill.proficiency}
                      onChange={(e) => updateSkill(i, "proficiency", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Years experience</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={skill.years_experience}
                      onChange={(e) => updateSkill(i, "years_experience", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last used date</label>
                    <input
                      className={inputClass}
                      type="date"
                      value={skill.last_used_date}
                      onChange={(e) => updateSkill(i, "last_used_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addSkill}
              className="w-full border-2 border-dashed border-stone-300 text-muted py-3 rounded-xl hover:border-terra hover:text-terra transition text-sm font-medium"
            >
              + Add another skill
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-stone-300 text-ink py-3 rounded-xl hover:border-terra transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={form.skills.some((s) => !s.skill_name)}
                className="flex-1 bg-terra text-sand py-3 rounded-xl font-semibold hover:bg-orange-800 transition disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Gap context */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Why did you take a break?</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {GAP_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => update("gap_reason", r)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition ${
                      form.gap_reason === r
                        ? "bg-terra text-sand border-terra"
                        : "bg-surface border-stone-300 text-ink hover:border-terra"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-stone-300 text-ink py-3 rounded-xl hover:border-terra transition"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-terra text-sand py-3 rounded-xl font-semibold hover:bg-orange-800 transition disabled:opacity-40"
              >
                {loading ? "Analyzing your profile..." : "Begin My Return →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}