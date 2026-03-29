import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { mockAnalysis } from "../services/mockData";


const DOMAIN_COLORS = {
  tech: "#C2410C",
  leadership: "#92400E",
  communication: "#D97706",
  domain_knowledge: "#B45309",
  other: "#78716C",
};

const STRENGTH_OPACITY = {
  strong: 1,
  needs_refresh: 0.65,
  heavily_decayed: 0.3,
};

function SkillsConstellation({ skills }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!skills?.length) return;
    const el = svgRef.current;
    const W = el.clientWidth || 600;
    const H = 420;

    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Soft radial background
    const defs = svg.append("defs");
    const radial = defs.append("radialGradient").attr("id", "bg-grad");
    radial.append("stop").attr("offset", "0%").attr("stop-color", "#F0EBE5");
    radial.append("stop").attr("offset", "100%").attr("stop-color", "#F8F5F2");
    svg.append("rect").attr("width", W).attr("height", H)
      .attr("fill", "url(#bg-grad)").attr("rx", 16);

    // Node size scale based on decay score
    const sizeScale = d3.scaleSqrt()
      .domain([0, 1])
      .range([18, 52]);

    const nodes = skills.map((s) => ({
      ...s,
      r: sizeScale(s.decay_score),
    }));

    // Force simulation
    const sim = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-60))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide((d) => d.r + 10))
      .force("x", d3.forceX(W / 2).strength(0.05))
      .force("y", d3.forceY(H / 2).strength(0.05))
      .stop();

    // Run simulation ahead of render
    for (let i = 0; i < 200; i++) sim.tick();

    // Connector lines between nodes (subtle)
    const pairs = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++)
        if (nodes[i].domain === nodes[j].domain) pairs.push([nodes[i], nodes[j]]);

    svg.selectAll("line")
      .data(pairs)
      .enter().append("line")
      .attr("x1", (d) => d[0].x).attr("y1", (d) => d[0].y)
      .attr("x2", (d) => d[1].x).attr("y2", (d) => d[1].y)
      .attr("stroke", "#D6C9BF")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);

    // Node groups
    const nodeG = svg.selectAll("g.node")
      .data(nodes).enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Glow filter for strong skills
    const glow = defs.append("filter").attr("id", "glow");
    glow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Circles
    nodeG.append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => DOMAIN_COLORS[d.domain] || "#78716C")
      .attr("opacity", (d) => STRENGTH_OPACITY[d.strength_label])
      .attr("filter", (d) => d.strength_label === "strong" ? "url(#glow)" : null)
      .attr("stroke", "#F8F5F2")
      .attr("stroke-width", 2);

    // Skill name labels
    nodeG.append("text")
      .text((d) => d.skill_name.length > 10 ? d.skill_name.slice(0, 9) + "…" : d.skill_name)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#F8F5F2")
      .attr("font-size", (d) => d.r > 30 ? "11px" : "9px")
      .attr("font-family", "DM Sans, sans-serif")
      .attr("font-weight", "500")
      .attr("pointer-events", "none");

    // Score label below name for larger nodes
    nodeG.filter((d) => d.r > 28)
      .append("text")
      .text((d) => Math.round(d.decay_score * 100) + "%")
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .attr("fill", "#F8F5F2")
      .attr("opacity", 0.7)
      .attr("font-size", "8px")
      .attr("font-family", "DM Sans, sans-serif")
      .attr("pointer-events", "none");

    // Tooltip on hover
    const tooltip = d3.select("body").append("div")
      .style("position", "fixed")
      .style("background", "#1C1917")
      .style("color", "#F8F5F2")
      .style("padding", "8px 14px")
      .style("border-radius", "10px")
      .style("font-size", "13px")
      .style("font-family", "DM Sans, sans-serif")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 999)
      .style("max-width", "200px");

    nodeG
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(
          `<strong>${d.skill_name}</strong><br/>
           Domain: ${d.domain}<br/>
           Score: ${Math.round(d.decay_score * 100)}%<br/>
           Unused: ${d.months_since_used} months<br/>
           <span style="color:#FDBA74">${d.strength_label.replace("_", " ")}</span>`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.clientX + 14 + "px")
          .style("top", event.clientY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(150).style("opacity", 0);
      });

    // Animate nodes in
    nodeG.attr("opacity", 0)
      .transition()
      .duration(600)
      .delay((_, i) => i * 80)
      .attr("opacity", 1);

    return () => tooltip.remove();
  }, [skills]);

  return (
    <svg
      ref={svgRef}
      className="w-full rounded-2xl border border-stone-200"
      style={{ height: "420px", background: "#F0EBE5" }}
    />
  );
}

export default function Mirror() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [showAllMissing, setShowAllMissing] = useState(false);
  useEffect(() => {
    const cached = localStorage.getItem("analysis");
    setData(cached ? JSON.parse(cached) : mockAnalysis);
  }, []);

  if (!data) return null;

  const { gap_analysis } = data;
  const { strong_skills, decayed_skills, missing_skills, scored_skills } = gap_analysis;

  return (
    <div className="min-h-screen bg-sand px-6 py-10 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p
          className="text-terra text-sm font-semibold cursor-pointer mb-2"
          onClick={() => nav("/dashboard")}
        >
          ← Dashboard
        </p>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">Mirror</p>
        <h1 className="font-display text-5xl text-ink">Your Skills Constellation</h1>
        <p className="text-muted mt-2 text-sm">
          Node size = current strength. Hover to inspect each skill.
        </p>
      </div>

      {/* D3 Constellation */}
      <SkillsConstellation skills={scored_skills} />

      {/* Legend */}
      <div className="flex gap-6 mt-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-terra opacity-100" />
          <span className="text-muted text-xs">Strong (60%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-terra opacity-60" />
          <span className="text-muted text-xs">Needs refresh (30–60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-terra opacity-30" />
          <span className="text-muted text-xs">Heavily decayed (&lt;30%)</span>
        </div>
      </div>

      {/* Three columns gap analysis */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Strong */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-green-700 text-xs font-semibold uppercase tracking-wider mb-3">
            ✅ Strong
          </p>
          {strong_skills.length === 0 ? (
            <p className="text-muted text-xs italic">None yet — keep going</p>
          ) : (
            strong_skills.map((s) => (
              <p key={s} className="text-ink text-sm mb-1 font-medium">{s}</p>
            ))
          )}
        </div>

        {/* Needs refresh */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider mb-3">
            ⚠️ Refresh
          </p>
          {decayed_skills.map((s) => (
            <p key={s.skill_name} className="text-ink text-sm mb-1 font-medium">
              {s.skill_name}
              <span className="text-muted text-xs ml-1">({s.refresh_priority})</span>
            </p>
          ))}
        </div>

        {/* Missing */}
<div className="bg-red-50 border border-red-200 rounded-2xl p-4">
  <p className="text-red-700 text-xs font-semibold uppercase tracking-wider mb-3">
    ❌ Missing
  </p>

  {(showAllMissing ? missing_skills : missing_skills.slice(0, 6)).map((s) => (
    <p key={s} className="text-ink text-sm mb-1 font-medium">
      {s}
    </p>
  ))}

  {missing_skills.length > 6 && (
    <p
      className="text-muted text-xs mt-2 cursor-pointer hover:underline"
      onClick={() => setShowAllMissing(!showAllMissing)}
    >
      {showAllMissing
        ? "Show less"
        : `+${missing_skills.length - 6} more`}
    </p>
  )}
</div>
      </div>

      {/* CTA */}
      <button
        onClick={() => nav("/dashboard/move")}
        className="w-full bg-terra text-sand py-4 rounded-2xl font-semibold text-lg hover:bg-orange-800 transition"
      >
        See this week's actions →
      </button>

    </div>
  );
}