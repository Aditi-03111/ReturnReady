import { useNavigate } from "react-router-dom";

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-sand relative overflow-hidden">

      {/* Galaxy background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-terra/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ember/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-900/20 rounded-full blur-2xl" />
      </div>

      <p className="text-muted text-sm tracking-widest uppercase mb-4 relative z-10">
        Your return starts here
      </p>
      <h1 className="font-display text-7xl text-star mb-2 relative z-10">
        Return<span className="text-terra">Ready</span>
      </h1>
      <p className="text-muted text-xl max-w-md mt-4 mb-10 leading-relaxed relative z-10">
        Your career didn't pause.<br />It took a different path.
      </p>
      <button
        onClick={() => nav("/onboarding")}
        className="bg-terra text-star font-semibold px-10 py-4 rounded-full hover:bg-purple-400 transition text-lg relative z-10 shadow-lg shadow-terra/30"
      >
        Begin Your Return
      </button>
      <div className="mt-16 flex gap-12 text-muted text-sm relative z-10">
        <span>✦ Mirror your skills</span>
        <span>✦ Move with actions</span>
        <span>✦ Witness your peers</span>
      </div>
    </div>
  );
}
