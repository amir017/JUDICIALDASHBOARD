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
  Route,
  Lightbulb,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Api from "../../../API/Api";
import { PERFORMANCE_SLICE_COLORS, DONUT_PIE_PROPS, DONUT_CELL_STROKE } from "../officerUtils/chartColors.js";
import { safeText, parseDateSafe, fmtYMDLong, daysBetween } from "../officerUtils/officerFormat.js";
import { normalizePostingRows } from "./PostingTransfersTab.jsx";
import PunjabDivisionsMapTab from "./PunjabDivisionsMapTab.jsx";
import { livingDivisionCanonFromProfile } from "./punjabMapGeo.js";
import { PerformanceDisposalYearTrend, PerformanceCategoryYearTrend } from "./PerformanceTab.jsx";
import { AcrRatingTrendChart } from "./ACRTab.jsx";

const SLICE = PERFORMANCE_SLICE_COLORS;

/** Leave type labels aligned with `LeavesTab` numeric codes. */
const LEAVE_TYPE_NUM_LABELS = {
  0: "Casual Leave",
  1: "Earned Leave",
  2: "Special Leave",
  3: "Extra-Ordinary Leave",
  4: "Ex-Pakistan Leave",
  5: "Paternity Leave",
  6: "Maternity Leave",
};

function leaveCategoryLabel(r) {
  const raw = r?.leave_type_desc ?? r?.LEAVE_TYPE_DESC;
  const s = String(raw ?? "").trim();
  if (s) return s;
  const t = Number(r?.leave_type ?? r?.LEAVE_TYPE);
  if (Number.isFinite(t) && LEAVE_TYPE_NUM_LABELS[t] != null) return LEAVE_TYPE_NUM_LABELS[t];
  return "Other";
}

/**
 * Top leave categories by total days; per-year days for multi-line chart (same idea as
 * `buildCategoryYearTrend` in PerformanceTab).
 */
function buildLeaveTypeYearTrend(leaveYearRows, leaveRows, topN = 7) {
  const byYearLabel = new Map();
  const typeTotals = new Map();

  const ingest = (year, label, days) => {
    const d = Number(days) || 0;
    if (d <= 0) return;
    typeTotals.set(label, (typeTotals.get(label) || 0) + d);
    if (!byYearLabel.has(year)) byYearLabel.set(year, new Map());
    const m = byYearLabel.get(year);
    m.set(label, (m.get(label) || 0) + d);
  };

  const yRows = Array.isArray(leaveYearRows) ? leaveYearRows : [];
  if (yRows.length) {
    for (const r of yRows) {
      const y = Number(r?.yr ?? r?.YR);
      if (!Number.isFinite(y) || y < 1980 || y > 2100) continue;
      const days = Number(r?.total_days ?? r?.TOTAL_DAYS ?? 0) || 0;
      ingest(y, leaveCategoryLabel(r), days);
    }
  }

  if (!typeTotals.size) {
    const lRows = Array.isArray(leaveRows) ? leaveRows : [];
    for (const r of lRows) {
      const f = parseDateSafe(r?.from_date ?? r?.FROM_DATE);
      if (!f) continue;
      const y = f.getFullYear();
      const t = parseDateSafe(r?.to_date ?? r?.TO_DATE) || new Date();
      const days = Math.max(1, daysBetween(f, t) + 1);
      ingest(y, leaveCategoryLabel(r), days);
    }
  }

  const topLabels = [...typeTotals.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([lbl]) => lbl);

  if (!topLabels.length) {
    return { data: [], series: [], totalDays: 0 };
  }

  const yearKeys = [...byYearLabel.keys()].filter((y) => Number.isFinite(y)).sort((a, b) => a - b);
  if (!yearKeys.length) {
    return { data: [], series: [], totalDays: 0 };
  }
  const y0 = yearKeys[0];
  const y1 = yearKeys[yearKeys.length - 1];
  const years = [];
  for (let y = y0; y <= y1; y += 1) years.push(y);

  const data = years.map((year) => {
    const row = { year };
    const m = byYearLabel.get(year) || new Map();
    topLabels.forEach((label, i) => {
      row[`lv${i}`] = Number(m.get(label)) || 0;
    });
    return row;
  });

  const series = topLabels.map((label, i) => ({
    dataKey: `lv${i}`,
    name: `${label} · days`,
    color: SLICE[i % SLICE.length],
  }));

  const totalDays = [...typeTotals.values()].reduce((s, v) => s + v, 0);

  return { data, series, totalDays };
}

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

/** Approximate division HQ (km distances vs other divisions; not boundary-accurate). */
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

function InsightCard({ title, subtitle, icon: Icon, children, tone = "teal" }) {
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
            {subtitle ? (
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-600 sm:text-[13px]">
                {subtitle}
              </p>
            ) : null}
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
  leaveRows = [],
  leaveYearRows = [],
  leaveLoading = false,
  leaveYearLoading = false,
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

  const proposedList = useMemo(() => {
    const miss = new Set(proposedDivisions.missing);
    return PUNJAB_DIVISIONS.filter((d) => miss.has(d));
  }, [proposedDivisions.missing]);

  const livingDivisionCanon = useMemo(
    () => livingDivisionCanonFromProfile(profile),
    [profile],
  );

  const proposedWithDistance = useMemo(() => {
    const from = livingDivisionCanon ? DIVISION_CENTROIDS[livingDivisionCanon] : null;
    return proposedList.map((division) => {
      const to = DIVISION_CENTROIDS[division];
      const km = from && to ? haversineKm(from, to) : null;
      return { division, km };
    });
  }, [proposedList, livingDivisionCanon]);

  const proposedRanked = useMemo(
    () =>
      proposedWithDistance
        .slice()
        .sort((a, b) => {
          if (a.km == null && b.km == null) return 0;
          if (a.km == null) return 1;
          if (b.km == null) return -1;
          return a.km - b.km;
        })
        .slice(0, 8),
    [proposedWithDistance],
  );

  const punjabDivisionModelCount = PUNJAB_DIVISIONS.length;
  const footprintCoveragePct = useMemo(() => {
    if (!punjabDivisionModelCount) return 0;
    return Math.min(100, Math.round((proposedDivisions.servedCount / punjabDivisionModelCount) * 100));
  }, [proposedDivisions.servedCount, punjabDivisionModelCount]);

  const { data: leaveYearTrendData, series: leaveYearTrendSeries, totalDays: leaveTrendTotalDays } =
    useMemo(() => buildLeaveTypeYearTrend(leaveYearRows, leaveRows, 7), [leaveYearRows, leaveRows]);

  const leavesDataLoading = leaveLoading || leaveYearLoading;

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

      <Section title="Posting map" icon={MapPin}>
        {historyLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 animate-pulse">
            Loading posting history…
          </div>
        ) : (
          <PunjabDivisionsMapTab historyRows={historyRows} profile={profile} />
        )}
      </Section>

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
          <InsightCard title="Proposed posting" icon={Compass} tone="teal">
            {proposedRanked.length ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/50 p-4 shadow-sm ring-1 ring-teal-100/40">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-400/20 blur-2xl" />
                  <div className="relative flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-teal-900 shadow-sm">
                      <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Suggestion lens
                    </span>
                  </div>
                  <div className="relative mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-white/80 bg-white/70 px-2.5 py-2 text-center shadow-sm ring-1 ring-slate-900/5 sm:px-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Uncovered</div>
                      <div className="mt-0.5 text-lg font-black tabular-nums text-teal-950 sm:text-xl">
                        {proposedDivisions.missing.length}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">of {punjabDivisionModelCount}</div>
                    </div>
                    <div className="rounded-xl border border-white/80 bg-white/70 px-2.5 py-2 text-center shadow-sm ring-1 ring-slate-900/5 sm:px-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Footprint</div>
                      <div className="mt-0.5 text-lg font-black tabular-nums text-slate-900 sm:text-xl">
                        {footprintCoveragePct}%
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">divisions touched</div>
                    </div>
                    <div className="rounded-xl border border-white/80 bg-white/70 px-2.5 py-2 text-center shadow-sm ring-1 ring-slate-900/5 sm:px-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Distance</div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] font-black leading-tight text-slate-900 sm:text-sm">
                        {livingDivisionCanon ? (
                          <>From {livingDivisionCanon}</>
                        ) : (
                          <span className="text-slate-500">Residence n/a</span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">HQ approx.</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Ranked candidates
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <Route className="h-3.5 w-3.5 text-teal-600" strokeWidth={2.4} />
                      Nearest first
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {proposedRanked.map((row, i) => (
                      <li
                        key={row.division}
                        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-teal-100/90 bg-gradient-to-r from-white via-teal-50/30 to-cyan-50/20 px-3 py-2.5 shadow-sm ring-1 ring-teal-900/5 transition-[box-shadow,transform] hover:shadow-md sm:px-4 sm:py-3"
                      >
                        <span
                          className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-teal-500 to-cyan-500 opacity-90"
                          aria-hidden
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-[11px] font-black text-white shadow-sm ring-2 ring-white/50 sm:h-10 sm:w-10 sm:text-xs">
                            #{i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
                                {row.division}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700/90">
                                Not in history
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {typeof row.km === "number" ? (
                            <div className="rounded-xl border border-teal-200/80 bg-white/95 px-2.5 py-1.5 shadow-sm">
                              <div className="text-[9px] font-black uppercase tracking-widest text-teal-700">
                                Approx.
                              </div>
                              <div className="text-sm font-black tabular-nums text-teal-950 sm:text-base">
                                ~{Math.round(row.km)} km
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Km</div>
                              <div className="text-xs font-black text-slate-600">n/a</div>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-5 text-center shadow-sm ring-1 ring-emerald-100/50">
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-300/25 blur-2xl" />
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg ring-4 ring-white/80">
                  <BadgeCheck className="h-7 w-7" strokeWidth={2.2} />
                </div>
                <div className="relative mt-3 text-base font-black text-slate-900">Full division footprint</div>
                <p className="relative mx-auto mt-2 max-w-sm text-sm font-semibold leading-relaxed text-slate-600">
                  Every division in this Punjab model already appears in your posting history — there is nothing left to
                  surface as a “new exposure” suggestion here.
                </p>
                <div className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-emerald-900 shadow-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  Served {proposedDivisions.servedCount} of {punjabDivisionModelCount} divisions
                </div>
              </div>
            )}
          </InsightCard>
        </div>
      </div>

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

      <Section
        title="Leaves trend"
        subtitle="Leave types over calendar years — same layout as performance category trend (one line per top type, days on Y)"
        icon={Calendar}
        right={
          <Pill tone="dark">
            {leavesDataLoading
              ? "Loading…"
              : `${Math.round(leaveTrendTotalDays).toLocaleString()} days · ${leaveYearTrendSeries.length} type${
                  leaveYearTrendSeries.length === 1 ? "" : "s"
                }`}
          </Pill>
        }
      >
        {leavesDataLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 animate-pulse">
            Loading leave data…
          </div>
        ) : !leaveYearTrendData.length || !leaveYearTrendSeries.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm font-bold text-slate-600">
            No leave rows yet to build a category trend by year.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-26px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/80 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200/70 pb-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-600 to-sky-700 text-white shadow-lg shadow-indigo-500/25">
                <BarChart3 className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Leave type trend by year</h3>
                <p className="text-[11px] font-bold text-slate-500">
                  Top leave categories by total days — one line per category (year-wise API when available; else from
                  leave records)
                </p>
              </div>
            </div>
            <div className="h-[320px] w-full min-w-0 sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leaveYearTrendData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 800 }} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    formatter={(value, name) => [`${Number(value).toLocaleString()} days`, name]}
                    labelFormatter={(y) => `Year ${y}`}
                    contentStyle={{ borderRadius: 12, fontWeight: 700, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 4, fontSize: 11 }} />
                  {leaveYearTrendSeries.map((s) => (
                    <Line
                      key={s.dataKey}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

