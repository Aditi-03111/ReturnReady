import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Witness() {
  const nav = useNavigate();
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nopeers, setNoPeers] = useState(false);
  const [waved, setWaved] = useState({});

  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) { nav("/onboarding"); return; }

    axios.get(`${BASE}/api/peers/${user_id}`)
      .then((res) => {
        if (res.data.peers.length === 0) setNoPeers(true);
        setPeers(res.data.peers);
      })
      .catch(() => setNoPeers(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terra border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm">Finding your peers...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand px-6 py-10 max-w-3xl mx-auto relative">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-terra/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-ember/5 rounded-full blur-3xl" />
      </div>

      <div className="mb-8 relative z-10">
        <p className="text-terra text-sm font-semibold cursor-pointer mb-2"
          onClick={() => nav("/dashboard")}>← Dashboard</p>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">Witness</p>
        <h1 className="font-display text-5xl text-star">You're not alone</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          People on a similar return journey. Matched by skill profile and target domain.
        </p>
      </div>

      {nopeers ? (
        <div className="bg-nebula border border-purple-900/40 rounded-2xl p-8 text-center mb-8 relative z-10">
          <p className="font-display text-2xl text-star mb-2">No peers yet</p>
          <p className="text-muted text-sm">
            You're one of the first returners here. As more people join,
            you'll be matched with people on the same path.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-10 relative z-10">
          {peers.map((peer) => (
            <div key={peer.id}
              className="bg-nebula border border-purple-900/40 rounded-2xl p-6 hover:border-terra transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-terra/80 text-star font-semibold flex items-center justify-center text-sm flex-shrink-0 shadow-lg shadow-terra/20">
                  {peer.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-ink font-medium text-sm">{peer.domain}</p>
                      <p className="text-muted text-xs">{peer.gap_reason}</p>
                    </div>
                    <span className="bg-terra/10 text-terra text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 border border-terra/20">
                      {peer.match_percent}% match
                    </span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed mt-2">
                    {peer.match_reason}
                  </p>
                  <button
                    onClick={() => setWaved(prev => ({ ...prev, [peer.id]: true }))}
                    disabled={waved[peer.id]}
                    className={`mt-4 text-xs px-4 py-2 rounded-xl font-medium transition ${
                      waved[peer.id]
                        ? "bg-terra/10 text-terra border border-terra/30 cursor-default"
                        : "border border-terra text-terra hover:bg-terra hover:text-star"
                    }`}
                  >
                    {waved[peer.id] ? "✦ Wave sent — they'll feel it" : "Send a silent wave →"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-terra/10 border border-terra/20 rounded-2xl p-6 mb-8 relative z-10">
        <p className="text-terra text-xs font-semibold uppercase tracking-widest mb-2">
          What "silent" means
        </p>
        <p className="text-ink text-sm leading-relaxed">
          Witness is not a chat platform. It's a mirror — showing you that others
          are on this path too. Matching uses your actual skill embedding vector.
        </p>
      </div>

      <button
        onClick={() => nav("/dashboard")}
        className="w-full bg-terra text-star py-4 rounded-2xl font-semibold text-lg hover:bg-purple-400 transition shadow-lg shadow-terra/20 relative z-10"
      >
        Back to dashboard →
      </button>

    </div>
  );
}
