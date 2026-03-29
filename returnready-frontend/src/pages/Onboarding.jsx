import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { onboardUser } from "../services/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const DOMAINS = ["tech", "leadership", "communication", "domain_knowledge", "other"];
const GAP_REASONS = ["Caregiving", "Health", "Relocation", "Education", "Other"];

export default function Onboarding() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [form, setForm] = useState(null);

  const inputClass = "w-full bg-sand border border-purple-900/50 rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-terra transition text-sm";
  const labelClass = "block text-xs font-medium text-muted mb-1 uppercase tracking-wider";

  const handleUpload = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await axios.post(`${BASE}/api/parse-resume`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm(res.data);
      setStep(2);
    } catch (e) {
      setError("Failed to parse resume. Try again or use a different PDF.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateSkill = (i, field, value) => {
    const skills = [...form.skills];
    skills[i] = { ...skills[i], [field]: value };
    setForm((f) => ({ ...f, skills }));
  };

  const removeSkill = (i) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }));

  const addSkill = () =>
    setForm((f) => ({
      ...f,
      skills: [...f.skills, {
        skill_name: "", domain: "tech",
        proficiency: 3, years_experience: 1,
        last_used_date: "2022-01-01"
      }]
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await onboardUser(form);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("user_name", form.name);
      localStorage.removeItem("analysis");
      localStorage.removeItem("analysis_time");
      nav("/dashboard");
    } catch (e) {
      setError(e?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-terra/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-ember/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-terra text-sm font-semibold cursor-pointer mb-2"
            onClick={() => nav("/")}>← ReturnReady</p>
          <h2 className="font-display text-4xl text-star">
            {step === 1 && "Upload your resume"}
            {step === 2 && "Review your profile"}
            {step === 3 && "Confirm & begin"}
          </h2>
          <p className="text-muted mt-1 text-sm">Step {step} of 3</p>
          <div className="mt-4 h-1 bg-purple-900/40 rounded-full">
            <div className="h-1 bg-terra rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-purple-900/50 rounded-2xl p-12 text-center cursor-pointer hover:border-terra transition group"
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="text-ink font-medium group-hover:text-terra transition">
                {fileName || "Drop your resume PDF here"}
              </p>
              <p className="text-muted text-sm mt-1">or click to browse</p>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => handleUpload(e.target.files[0])} />
            </div>

            {loading && (
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-terra border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted text-sm">Claude is reading your resume...</p>
              </div>
            )}

            {error && <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

            <div className="bg-nebula border border-purple-900/40 rounded-2xl p-4">
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-2">What we extract</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-ink">
                <span>✦ Your skills</span>
                <span>✦ Experience levels</span>
                <span>✦ Career timeline</span>
                <span>✦ Gap duration</span>
                <span>✦ Target role</span>
                <span>✦ Last used dates</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && form && (
          <div className="space-y-5">
            <div className="bg-purple-900/20 border border-purple-700/40 rounded-2xl px-4 py-3 text-sm text-purple-300">
              ✅ Extracted {form.skills?.length} skills from your resume
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={form.name || ""}
                  onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={form.email || ""}
                  onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Target role</label>
                <input className={inputClass} value={form.target_role || ""}
                  onChange={(e) => updateField("target_role", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Why did you take a break?</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {GAP_REASONS.map((r) => (
                    <button key={r} onClick={() => updateField("gap_reason", r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                        form.gap_reason === r
                          ? "bg-terra text-star border-terra"
                          : "bg-nebula border-purple-900/50 text-ink hover:border-terra"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-ink">Extracted skills</p>
              <button onClick={addSkill} className="text-xs text-terra underline">+ Add skill</button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {form.skills?.map((skill, i) => (
                <div key={i} className="bg-nebula border border-purple-900/40 rounded-xl p-3 relative">
                  <button onClick={() => removeSkill(i)}
                    className="absolute top-2 right-3 text-muted hover:text-terra">×</button>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <input className={inputClass} placeholder="Skill name"
                        value={skill.skill_name}
                        onChange={(e) => updateSkill(i, "skill_name", e.target.value)} />
                    </div>
                    <select className={inputClass} value={skill.domain}
                      onChange={(e) => updateSkill(i, "domain", e.target.value)}>
                      {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input className={inputClass} type="number" min={1} max={5}
                      placeholder="Proficiency 1-5" value={skill.proficiency}
                      onChange={(e) => updateSkill(i, "proficiency", parseInt(e.target.value) || 1)} />
                    <input className={inputClass} type="number" min={0}
                      placeholder="Years exp" value={skill.years_experience}
                      onChange={(e) => updateSkill(i, "years_experience", parseInt(e.target.value) || 0)} />
                    <input className={inputClass} type="date" value={skill.last_used_date}
                      onChange={(e) => updateSkill(i, "last_used_date", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-purple-900/50 text-ink py-3 rounded-xl hover:border-terra transition text-sm">
                ← Re-upload
              </button>
              <button onClick={() => setStep(3)} disabled={!form.name || !form.email}
                className="flex-1 bg-terra text-star py-3 rounded-xl font-semibold hover:bg-purple-400 transition disabled:opacity-40 text-sm">
                Looks good →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && form && (
          <div className="space-y-5">
            <div className="bg-nebula border border-purple-900/40 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Name</span>
                <span className="text-ink font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Target role</span>
                <span className="text-ink font-medium">{form.target_role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Skills extracted</span>
                <span className="text-terra font-medium">{form.skills?.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Gap reason</span>
                <span className="text-ink font-medium">{form.gap_reason}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.skills?.map((s) => (
                <span key={s.skill_name}
                  className="bg-terra/10 text-terra text-xs px-3 py-1 rounded-full font-medium border border-terra/20">
                  {s.skill_name}
                </span>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-purple-900/50 text-ink py-3 rounded-xl hover:border-terra transition text-sm">
                ← Edit
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-terra text-star py-3 rounded-xl font-semibold hover:bg-purple-400 transition disabled:opacity-40">
                {loading ? "Analyzing..." : "Begin My Return →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
