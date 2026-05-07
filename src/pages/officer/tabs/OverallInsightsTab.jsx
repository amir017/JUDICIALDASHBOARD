import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  MapPin,
  Layers,
  TrendingUp,
  BadgeCheck,
  AlertTriangle,
  Compass,
  Target,
  Crown,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import Api from "../../../API/Api";
import { PERFORMANCE_SLICE_COLORS, DONUT_PIE_PROPS, DONUT_CELL_STROKE } from "../officerUtils/chartColors.js";
import { safeText, parseDateSafe, fmtYMDLong } from "../officerUtils/officerFormat.js";
import { normalizePostingRows, DivisionTenurePieChart } from "./PostingTransfersTab.jsx";
import { PerformanceDisposalYearTrend, PerformanceCategoryYearTrend } from "./PerformanceTab.jsx";
import { AcrRatingTrendChart } from "./ACRTab.jsx";

const SLICE = PERFORMANCE_SLICE_COLORS;

// Performance labels (match PerformanceTab so we can derive “disposal signature”).
const SESSIONS_LABELS = {
  MURDERCASES: "Murder",
  NARCOTICSCASES: "Narcotics",
  CRIMINALAPPEAL: "Criminal appeal",
  CRIMINALRIVISION: "Criminal revision",
  CIVILAPPEAL: "Civil appeal",
  CIVILRIVISION: "Civil revision",
  CIVILSUITS: "Civil suits",
};

const CIVIL_LABELS = {
  CIVILSUITS: "Civil suits",
  FAMILYCASES: "Family cases",
  APPLICATIONFORSUCCESSION: "Succession",
  CRIMINALCASESSECTION30: "Criminal (S.30)",
};

const PUNJAB_DIVISIONS = [
  "Lahore",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Gujrat",
  "Sargodha",
  "Bahawalpur",
  "Dera Ghazi Khan",
  "Sahiwal",
];

// Approximate HQ coordinates for distance estimates (km). Not GIS-accurate boundaries.
const DIVISION_CENTROIDS = {
  Lahore: { lat: 31.5204, lon: 74.3587 },
  Rawalpindi: { lat: 33.6844, lon: 73.0479 },
  Faisalabad: { lat: 31.4187, lon: 73.0791 },
  Multan: { lat: 30.1575, lon: 71.5249 },
  Gujranwala: { lat: 32.1877, lon: 74.1945 },
  Gujrat: { lat: 32.5736, lon: 74.0789 },
  Sargodha: { lat: 32.0836, lon: 72.6711 },
  Bahawalpur: { lat: 29.3956, lon: 71.6836 },
  "Dera Ghazi Khan": { lat: 30.0561, lon: 70.6348 },
  Sahiwal: { lat: 30.664, lon: 73.1076 },
};

function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Schematic “map-like” layout positions (not geographic).
const DIVISION_MAP_LAYOUT = [
  { name: "Rawalpindi", x: 64, y: 10 },
  { name: "Gujrat", x: 46, y: 22 },
  { name: "Gujranwala", x: 30, y: 30 },
  { name: "Lahore", x: 28, y: 48 },
  { name: "Sargodha", x: 56, y: 38 },
  { name: "Faisalabad", x: 46, y: 54 },
  { name: "Sahiwal", x: 46, y: 70 },
  { name: "Multan", x: 62, y: 72 },
  { name: "Dera Ghazi Khan", x: 78, y: 78 },
  { name: "Bahawalpur", x: 74, y: 92 },
];

function PunjabDivisionsSchematicMap({ divisionCounts = {}, currentDivision }) {
  const max = Math.max(1, ...Object.values(divisionCounts).map((n) => Number(n) || 0));
  const servedSet = new Set(
    Object.entries(divisionCounts)
      .filter(([, v]) => (Number(v) || 0) > 0)
      .map(([k]) => k),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-7">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-black text-slate-900">
                Punjab divisions (schematic)
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-slate-500">
                Color intensity reflects posting count per division.
              </div>
            </div>
            {currentDivision ? (
              <span className="rounded-full border border-teal-200/70 bg-teal-50/80 px-3 py-1 text-[11px] font-black text-teal-950">
                Current: {currentDivision}
              </span>
            ) : null}
          </div>

          <svg viewBox="0 0 100 110" className="w-full h-[340px]">
            <defs>
              <linearGradient id="mapBg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#ecfeff" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="110" rx="8" fill="url(#mapBg)" />

            {DIVISION_MAP_LAYOUT.map((d, idx) => {
              const c = Number(divisionCounts[d.name]) || 0;
              const pct = Math.max(0, Math.min(1, c / max));
              const base = SLICE[idx % SLICE.length];
              const fill = c > 0 ? base : "#e2e8f0";
              const stroke =
                d.name === currentDivision ? "#0f766e" : "rgba(15,23,42,0.18)";
              const strokeW = d.name === currentDivision ? 2.2 : 1.2;
              const opacity = c > 0 ? 0.35 + 0.6 * pct : 0.7;

              return (
                <g key={d.name}>
                  <rect
                    x={d.x - 16}
                    y={d.y - 8}
                    width="32"
                    height="16"
                    rx="6"
                    fill={fill}
                    opacity={opacity}
                    stroke={stroke}
                    strokeWidth={strokeW}
                  />
                  <text
                    x={d.x}
                    y={d.y + 1.5}
                    textAnchor="middle"
                    fontSize="3.6"
                    fontWeight="800"
                    fill={c > 0 ? "#0b1220" : "#475569"}
                  >
                    {d.name}
                  </text>
                  <text
                    x={d.x}
                    y={d.y + 6.5}
                    textAnchor="middle"
                    fontSize="3.2"
                    fontWeight="900"
                    fill={c > 0 ? "#0b1220" : "#64748b"}
                  >
                    {c > 0 ? c : "—"}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="h-3 w-3 rounded-sm bg-slate-200 ring-1 ring-black/10" />
              Not served
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="h-3 w-3 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: SLICE[0] }} />
              Served (higher count = deeper color)
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50/80 px-3 py-1.5 text-teal-950">
              <span className="h-3 w-3 rounded-sm bg-teal-600 ring-1 ring-black/10" />
              Current division border
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Division coverage
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {servedSet.size} / {PUNJAB_DIVISIONS.length}
          </div>
          <div className="mt-2 text-[11px] font-bold text-slate-600">
            Served divisions are computed from posting history rows that include `DIVISIONNAME`.
          </div>
        </div>
      </div>
    </div>
  );
}

function sumLabelMap(obj, labelMap) {
  if (!obj) return 0;
  return Object.keys(labelMap).reduce((s, k) => s + (Number(obj?.[k]) || 0), 0);
}

function getPerfConsolidatedSlice(payload) {
  if (!payload) return null;
  return (
    payload.consolidated ||
    (payload.type2_sessions || payload.type1_civil
      ? {
          type2_sessions: payload.type2_sessions || {},
          type1_civil: payload.type1_civil || {},
        }
      : null)
  );
}

function buildTopDisposals(payload, topN = 5) {
  const c = getPerfConsolidatedSlice(payload);
  if (!c) return [];
  const rows = [];
  for (const [k, label] of Object.entries(SESSIONS_LABELS)) {
    const v = Number(c.type2_sessions?.[k]) || 0;
    rows.push({ key: `s-${k}`, section: "Sessions", label, value: v });
  }
  for (const [k, label] of Object.entries(CIVIL_LABELS)) {
    const v = Number(c.type1_civil?.[k]) || 0;
    rows.push({ key: `c-${k}`, section: "Civil", label, value: v });
  }
  return rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value).slice(0, topN);
}

function interestFromTopCategory(label, section) {
  const s = String(label || "").toLowerCase();
  const sec = String(section || "").toLowerCase();
  if (sec.includes("civil") && (s.includes("family") || s.includes("succession"))) {
    return { title: "Family & succession", subtitle: "Strong signal toward family / succession workload." };
  }
  if (s.includes("murder") || s.includes("narcotics") || s.includes("criminal")) {
    return { title: "Criminal jurisprudence", subtitle: "Strong signal toward criminal appellate / trial workload." };
  }
  if (s.includes("civil")) {
    return { title: "Civil litigation", subtitle: "Strong signal toward civil appellate / suits workload." };
  }
  return { title: "Balanced docket", subtitle: "Top category is mixed; no single dominance detected." };
}

function getLatestPosting(historyRows) {
  const list = Array.isArray(historyRows) ? historyRows : [];
  let best = null;
  let bestT = -Infinity;
  for (const r of list) {
    const d =
      parseDateSafe(r.TO_DATE) ||
      parseDateSafe(r.TODATE) ||
      parseDateSafe(r.TO) ||
      parseDateSafe(r.FROM_DATE) ||
      parseDateSafe(r.FROMDATE) ||
      parseDateSafe(r.DATEOFPOSTING) ||
      null;
    const t = d ? d.getTime() : 0;
    if (t > bestT) {
      bestT = t;
      best = r;
    }
  }
  return best;
}

function Pill({ children, tone = "light" }) {
  const cls =
    tone === "dark"
      ? "bg-white/15 border-white/25 text-white"
      : "bg-white/90 border-slate-200/80 text-slate-800";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-sm backdrop-blur ${cls}`}>
      {children}
    </span>
  );
}

function Section({ title, subtitle, icon: Icon, children, right }) {
  return (
    <div className="rounded-3xl border border-teal-200/45 bg-white shadow-[0_22px_60px_-28px_rgba(13,148,136,0.16)] ring-1 ring-teal-100/35 overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 p-4 text-white sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(45,212,191,0.22),transparent_50%),radial-gradient(ellipse_70%_55%_at_0%_110%,rgba(167,139,250,0.09),transparent_50%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-md">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </div>
            ) : null}
            <div className="min-w-0">
              <div className="text-[15px] font-black tracking-tight drop-shadow-sm sm:text-[17px]">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-[11px] font-semibold text-teal-100/95">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="bg-gradient-to-b from-slate-50/50 via-white to-white p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, accent = "teal" }) {
  const accentRing =
    accent === "violet"
      ? "ring-violet-200/60"
      : accent === "amber"
        ? "ring-amber-200/60"
        : "ring-teal-200/60";
  const accentGrad =
    accent === "violet"
      ? "from-violet-600 to-indigo-600"
      : accent === "amber"
        ? "from-amber-600 to-orange-600"
        : "from-emerald-700 to-sky-600";
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm ring-1 ${accentRing}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-black tabular-nums leading-none text-transparent bg-clip-text bg-gradient-to-r ${accentGrad}`}>
        {value}
      </div>
      {sub ? <div className="mt-2 text-[11px] font-bold text-slate-600">{sub}</div> : null}
    </div>
  );
}

function InsightCard({ title, icon: Icon, children, tone = "teal" }) {
  const toneGrad =
    tone === "violet"
      ? "from-violet-600 via-fuchsia-600 to-indigo-700"
      : tone === "amber"
        ? "from-amber-600 via-orange-600 to-rose-600"
        : "from-emerald-600 via-teal-600 to-sky-600";
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${toneGrad} p-[1px] shadow-[0_20px_50px_-22px_rgba(15,118,110,0.35)]`}>
      <div className="relative overflow-hidden rounded-[22px] bg-white/90 p-5 ring-1 ring-white/60">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex items-start gap-3">
          {Icon ? (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900/5 ring-1 ring-slate-900/10">
              <Icon className="h-5 w-5 text-slate-900" strokeWidth={2.25} />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              {title}
            </div>
            <div className="mt-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostingScopeDonut({ items }) {
  const data = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const inField = list.filter((r) => r._bucket === "In Field").length;
    const exCadre = list.filter((r) => r._bucket === "Ex-Cadre").length;
    const rows = [];
    if (inField) rows.push({ name: "In Field", value: inField });
    if (exCadre) rows.push({ name: "Ex-Cadre", value: exCadre });
    return rows;
  }, [items]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (!total) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm font-semibold text-slate-500">
        No posting scope data available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
      <div className="md:col-span-6 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              {...DONUT_PIE_PROPS}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={SLICE[i % SLICE.length]}
                  {...DONUT_CELL_STROKE}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${Number(v).toLocaleString()}`, "Postings"]}
              contentStyle={{ borderRadius: 12, fontWeight: 800, fontSize: 12 }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="md:col-span-6 space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Total posting records
          </div>
          <div className="mt-2 text-3xl font-black tabular-nums text-slate-900">
            {total.toLocaleString()}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            {data.map((d, i) => (
              <span key={d.name} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="h-3 w-3 rounded-sm ring-1 ring-black/15" style={{ backgroundColor: SLICE[i % SLICE.length] }} />
                {d.name}: {d.value.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverallInsightsTab({
  profile,
  historyRows,
  historyLoading,
  acrRows,
  acrLoading,
}) {
  const pfNo = safeText(profile?.PFNO);
  const [perfPayload, setPerfPayload] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState(null);
  const perfReqSeq = useRef(0);

  const postingItems = useMemo(
    () => normalizePostingRows(historyRows),
    [historyRows],
  );

  const latestPosting = useMemo(
    () => getLatestPosting(historyRows),
    [historyRows],
  );

  useEffect(() => {
    const pn = String(pfNo || "").trim();
    if (!pn || pn === "—") {
      setPerfPayload(null);
      setPerfError(null);
      setPerfLoading(false);
      return;
    }
    const reqId = (perfReqSeq.current += 1);
    let cancelled = false;
    (async () => {
      try {
        setPerfLoading(true);
        setPerfError(null);
        const data = await Api.getComplaintPerformanceSummary({ personalNo: pn });
        if (cancelled) return;
        if (reqId !== perfReqSeq.current) return;
        setPerfPayload(data ?? null);
      } catch (e) {
        if (cancelled) return;
        if (reqId !== perfReqSeq.current) return;
        setPerfPayload(null);
        setPerfError(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Failed to load performance summary.",
        );
      } finally {
        if (!cancelled && reqId === perfReqSeq.current) setPerfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pfNo]);

  const topDisposals = useMemo(
    () => buildTopDisposals(perfPayload, 5),
    [perfPayload],
  );

  const interest = useMemo(() => {
    const top = topDisposals[0];
    return interestFromTopCategory(top?.label, top?.section);
  }, [topDisposals]);

  const perfTotals = useMemo(() => {
    const c = getPerfConsolidatedSlice(perfPayload);
    const sessions = sumLabelMap(c?.type2_sessions, SESSIONS_LABELS);
    const civil = sumLabelMap(c?.type1_civil, CIVIL_LABELS);
    const total = sessions + civil;
    return { sessions, civil, total };
  }, [perfPayload]);

  const proposedDivisions = useMemo(() => {
    const bad = new Set(["NONE", "N/A", "NA", "NULL", "UNKNOWN", "-", "—"]);
    const norm = (v) => {
      const s = String(v ?? "").trim();
      if (!s) return "";
      const u = s.toUpperCase();
      if (bad.has(u)) return "";
      return s;
    };
    const served = new Set(
      postingItems
        .map((r) => norm(r?._division || r?.DIVISIONNAME || r?.divisionname))
        .filter(Boolean),
    );
    const missing = PUNJAB_DIVISIONS.filter((d) => !served.has(d));
    return { servedSet: served, servedCount: served.size, missing };
  }, [postingItems]);

  const divisionCounts = useMemo(() => {
    const counts = {};
    for (const r of postingItems) {
      const name = String(r?._division || r?.DIVISIONNAME || r?.divisionname || "").trim();
      if (!name) continue;
      const u = name.toUpperCase();
      if (["NONE", "N/A", "NA", "NULL", "UNKNOWN", "-", "—"].includes(u)) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    return counts;
  }, [postingItems]);

  const currentDivision = useMemo(() => {
    const n = String(latestPosting?.DIVISIONNAME || latestPosting?.divisionname || "").trim();
    if (!n) return null;
    const u = n.toUpperCase();
    if (["NONE", "N/A", "NA", "NULL", "UNKNOWN", "-", "—"].includes(u)) return null;
    return n;
  }, [latestPosting]);

  const proposedWithDistance = useMemo(() => {
    const from = currentDivision ? DIVISION_CENTROIDS[currentDivision] : null;
    return proposedDivisions.missing.map((d) => {
      const to = DIVISION_CENTROIDS[d];
      const km = from && to ? haversineKm(from, to) : null;
      return { division: d, km };
    });
  }, [proposedDivisions.missing, currentDivision]);

  return (
    <div className="space-y-6 min-w-[320px]">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-teal-200/45 bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/25 p-5 shadow-[0_28px_80px_-38px_rgba(13,148,136,0.3)] ring-1 ring-teal-100/35 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white shadow-[0_16px_40px_-12px_rgba(13,148,136,0.5)] ring-2 ring-white/40">
              <Sparkles className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Overall insights
              </h2>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600 sm:text-sm">
                Posting footprint + performance + ACR trends — one executive view.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill>
                  <Layers className="h-4 w-4 text-teal-700" />
                  PF: {pfNo}
                </Pill>
                <Pill>
                  <TrendingUp className="h-4 w-4 text-indigo-700" />
                  Posting rows: {postingItems.length.toLocaleString()}
                </Pill>
                <Pill>
                  <Target className="h-4 w-4 text-amber-700" />
                  Disposals: {perfLoading ? "…" : perfTotals.total.toLocaleString()}
                </Pill>
              </div>
            </div>
          </div>

          {latestPosting ? (
            <div className="sm:text-right">
              <Pill tone="dark">
                <BadgeCheck className="h-4 w-4" />
                Current / Latest posting
              </Pill>
              <div className="mt-2 text-sm font-black text-slate-900">
                {safeText(latestPosting?.DIVISIONNAME || latestPosting?.DISTRICTNAME)}
                {" "}
                <span className="text-slate-500 font-extrabold">·</span>{" "}
                {safeText(latestPosting?.SUBDIVNAME)}
              </div>
              <div className="mt-1 text-[11px] font-bold text-slate-600">
                {safeText(latestPosting?.DESIGNATIONDESC || latestPosting?.DESIGNATION)}
              </div>
            </div>
          ) : (
            <div className="sm:text-right">
              <Pill tone="dark">
                <AlertTriangle className="h-4 w-4" />
                No posting rows
              </Pill>
            </div>
          )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Disposals (sessions)"
              value={perfLoading ? "…" : perfTotals.sessions.toLocaleString()}
              sub="Consolidated"
              accent="teal"
            />
            <KpiTile
              label="Disposals (civil)"
              value={perfLoading ? "…" : perfTotals.civil.toLocaleString()}
              sub="Consolidated"
              accent="violet"
            />
            <KpiTile
              label="ACR reports"
              value={acrLoading ? "…" : String(acrRows?.length || 0)}
              sub="Rows returned"
              accent="amber"
            />
            <KpiTile
              label="Divisions served"
              value={proposedDivisions.servedCount.toLocaleString()}
              sub={`Proposed: ${Math.min(5, proposedDivisions.missing.length)} new`}
              accent="teal"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <InsightCard title="Disposal signature" icon={Crown} tone="violet">
            {perfError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
                {perfError}
              </div>
            ) : topDisposals.length ? (
              <>
                <div className="text-lg font-black text-slate-900">
                  Top category:{" "}
                  <span className="text-violet-700">{topDisposals[0].label}</span>
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-600">
                  Section: <span className="font-black">{topDisposals[0].section}</span> ·{" "}
                  {topDisposals[0].value.toLocaleString()} disposals
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Interest area
                  </div>
                  <div className="mt-2 text-base font-black text-slate-900">
                    {interest.title}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-600">
                    {interest.subtitle}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Next top categories
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topDisposals.slice(1, 5).map((r, i) => (
                      <span
                        key={r.key}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-800"
                      >
                        <span
                          className="h-3 w-3 rounded-sm ring-1 ring-black/15"
                          style={{ backgroundColor: SLICE[(i + 3) % SLICE.length] }}
                        />
                        {r.label} · {r.value.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-slate-600">
                No performance categories found yet.
              </div>
            )}
          </InsightCard>
        </div>

        <div className="lg:col-span-5">
          <InsightCard title="Proposed posting (new exposure)" icon={Compass} tone="teal">
            <div className="text-sm font-semibold text-slate-600">
              Suggested divisions not present in posting history.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {proposedWithDistance.length ? (
                proposedWithDistance
                  .slice()
                  .sort((a, b) => {
                    if (a.km == null && b.km == null) return 0;
                    if (a.km == null) return 1;
                    if (b.km == null) return -1;
                    return a.km - b.km;
                  })
                  .slice(0, 6)
                  .map((x, i) => (
                  <span
                    key={x.division}
                    className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-gradient-to-r from-teal-50/90 to-cyan-50/40 px-3 py-1.5 text-[11px] font-black text-teal-950 shadow-sm"
                  >
                    <span
                      className="h-3 w-3 rounded-sm ring-1 ring-black/15"
                      style={{ backgroundColor: SLICE[(i + 5) % SLICE.length] }}
                    />
                    {x.division}
                    {typeof x.km === "number" ? (
                      <span className="ml-1 rounded-full border border-teal-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-black text-teal-900">
                        ~{Math.round(x.km)} km
                      </span>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-bold text-slate-600">
                  No missing division detected from current posting history.
                </span>
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-bold text-slate-600">
              Tip: add/verify `DIVISIONNAME` in posting history rows for more accurate recommendations.
            </div>
          </InsightCard>
        </div>
      </div>

      <Section
        title="Posting map & distances"
        subtitle="Schematic Punjab divisions map + estimated inter-division distances (HQ-to-HQ)"
        icon={MapPin}
        right={
          <Pill tone="dark">
            {currentDivision ? `From ${currentDivision}` : "Distance: unavailable"}
          </Pill>
        }
      >
        {historyLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 animate-pulse">
            Loading posting history…
          </div>
        ) : (
          <PunjabDivisionsSchematicMap
            divisionCounts={divisionCounts}
            currentDivision={currentDivision}
          />
        )}
      </Section>

      <Section
        title="In Field vs Ex-Cadre"
        subtitle="Overall mix of posting records"
        icon={Layers}
        right={
          <Pill tone="dark">
            <MapPin className="h-4 w-4" />
            {historyLoading ? "Loading…" : `${postingItems.length} postings`}
          </Pill>
        }
      >
        {historyLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 animate-pulse">
            Loading posting analytics…
          </div>
        ) : (
          <PostingScopeDonut items={postingItems} />
        )}
      </Section>

      <DivisionTenurePieChart rows={postingItems} />

      <Section
        title="Performance trends"
        subtitle="Disposals trend and top categories over time (complaint schema)"
        icon={TrendingUp}
        right={<Pill tone="dark">PF: {pfNo}</Pill>}
      >
        {perfError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
            {perfError}
          </div>
        ) : null}
        <div className="space-y-4">
          <PerformanceDisposalYearTrend payload={perfPayload} loading={perfLoading} />
          <PerformanceCategoryYearTrend payload={perfPayload} loading={perfLoading} />
        </div>
      </Section>

      <Section
        title="ACR trend"
        subtitle="Average Parts II–IV band by year (A1 at top)"
        icon={TrendingUp}
        right={<Pill tone="dark">{acrLoading ? "Loading…" : `${acrRows?.length || 0} ACR rows`}</Pill>}
      >
        {acrLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 animate-pulse">
            Loading ACR…
          </div>
        ) : (
          <AcrRatingTrendChart acrRows={acrRows} />
        )}
      </Section>
    </div>
  );
}

