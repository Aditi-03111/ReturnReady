import { useNavigate } from "react-router-dom";

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-sand">
      <p className="text-muted text-sm tracking-widest uppercase mb-4">
        Your return starts here
      </p>
      <h1 className="font-display text-7xl text-ink mb-2">
        Return<span className="text-terra">Ready</span>
      </h1>
      <p className="text-muted text-xl max-w-md mt-4 mb-10 leading-relaxed">
        Your career didn't pause.<br />It took a different path.
      </p>
      <button
        onClick={() => nav("/onboarding")}
        className="bg-terra text-sand font-semibold px-10 py-4 rounded-full hover:bg-orange-800 transition text-lg"
      >
        Begin Your Return
      </button>
      <div className="mt-16 flex gap-12 text-muted text-sm">
        <span>✦ Mirror your skills</span>
        <span>✦ Move with actions</span>
        <span>✦ Witness your peers</span>
      </div>
    </div>
  );
}