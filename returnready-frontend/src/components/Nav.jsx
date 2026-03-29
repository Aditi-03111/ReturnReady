import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const LINKS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Mirror", path: "/dashboard/mirror" },
  { label: "Move", path: "/dashboard/move" },
  { label: "Witness", path: "/dashboard/witness" },
];

export default function Nav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Don't show on landing or onboarding
  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <nav className="sticky top-0 z-50 bg-sand/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <span
          onClick={() => nav("/dashboard")}
          className="font-display text-xl text-ink cursor-pointer"
        >
          Return<span className="text-terra">Ready</span>
        </span>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {LINKS.map((l) => (
            <button
              key={l.path}
              onClick={() => nav(l.path)}
              className={`text-sm font-medium transition ${
                pathname === l.path
                  ? "text-terra"
                  : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((p) => !p)}
          className="sm:hidden flex flex-col gap-1.5 p-1"
        >
          <span className={`block w-5 h-0.5 bg-ink transition-all ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-ink transition-all ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-ink transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-stone-200 bg-sand">
          {LINKS.map((l) => (
            <button
              key={l.path}
              onClick={() => { nav(l.path); setOpen(false); }}
              className={`w-full text-left px-6 py-3 text-sm font-medium border-b border-stone-100 transition ${
                pathname === l.path ? "text-terra" : "text-ink hover:text-terra"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}