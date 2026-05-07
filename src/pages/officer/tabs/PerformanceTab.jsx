import React, { useEffect, useMemo, memo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Sparkles,
  Trophy,
  Target,
  Scale,
  TrendingUp,
  Calendar,
  BarChart3,
  LayoutGrid,
  PieChart as PieChartIcon,
  Zap,
} from "lucide-react";
import Api from "../../../API/Api";
import {
  PERFORMANCE_SLICE_COLORS,
  DONUT_PIE_PROPS,
  DONUT_CELL_STROKE,
} from "../officerUtils/chartColors.js";

/** Same slice palette as division-wise posting / PostingTransfersTab charts. */
const SLICE_COLORS = PERFORMANCE_SLICE_COLORS;
const CU_SPLIT_COLORS = [
  PERFORMANCE_SLICE_COLORS[0],
  PERFORMANCE_SLICE_COLORS[1],
];

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

/** Matches ERP performance aggregates: sessions = type_id 2, civil = type_id 1. */
const PERFORMANCE_TYPE_SESSIONS = 2;
const PERFORMANCE_TYPE_CIVIL = 1;

function sumLabelMap(obj, labelMap) {
  if (!obj) return 0;
  return Object.keys(labelMap).reduce(
    (s, k) => s + (Number(obj[k]) || 0),
    0,
  );
}

/** Contested / uncontested totals across every sessions + civil metric in scope. */
function sumAllContestedUncontested(type2, type1) {
  let contested = 0;
  let uncontested = 0;
  for (const key of Object.keys(SESSIONS_LABELS)) {
    contested += Number(type2?.[`${key}_con`]) || 0;
    uncontested += Number(type2?.[`${key}_uncon`]) || 0;
  }
  for (const key of Object.keys(CIVIL_LABELS)) {
    contested += Number(type1?.[`${key}_con`]) || 0;
    uncontested += Number(type1?.[`${key}_uncon`]) || 0;
  }
  return { contested, uncontested };
}

function toPieData(obj, labelMap) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(labelMap)
    .map(([key, name]) => ({ name, value: Number(obj[key]) || 0 }))
    .filter((d) => d.value > 0);
}

function toStatItems(obj, labelMap, typeTotal) {
  const t = typeTotal || 1;
  return Object.entries(labelMap).map(([key, label]) => {
    const value = Number(obj?.[key]) || 0;
    return {
      key,
      label,
      value,
      pct: typeTotal ? (value / t) * 100 : 0,
    };
  });
}

/** Rows for tabular view: every metric with section % and grand total %. */
function buildTabularRows(type2, type1) {
  const sTot = sumLabelMap(type2, SESSIONS_LABELS);
  const cTot = sumLabelMap(type1, CIVIL_LABELS);
  const grand = sTot + cTot;
  const g = grand > 0 ? grand : 1;
  const rows = [];
  for (const [key, label] of Object.entries(SESSIONS_LABELS)) {
    const value = Number(type2?.[key]) || 0;
    rows.push({
      key: `s-${key}`,
      section: "Sessions",
      label,
      value,
      construed: Number(type2?.[`${key}_con`]) || 0,
      unconstrued: Number(type2?.[`${key}_uncon`]) || 0,
      pctSection: sTot > 0 ? (value / sTot) * 100 : 0,
      pctGrand: (value / g) * 100,
    });
  }
  for (const [key, label] of Object.entries(CIVIL_LABELS)) {
    const value = Number(type1?.[key]) || 0;
    rows.push({
      key: `c-${key}`,
      section: "Civil",
      label,
      value,
      construed: Number(type1?.[`${key}_con`]) || 0,
      unconstrued: Number(type1?.[`${key}_uncon`]) || 0,
      pctSection: cTot > 0 ? (value / cTot) * 100 : 0,
      pctGrand: (value / g) * 100,
    });
  }
  return { rows, sessionsTotal: sTot, civilTotal: cTot, grandTotal: grand };
}

const tableTh =
  "border-b border-teal-800/40 bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-teal-100 whitespace-nowrap";
const tableTd =
  "border-b border-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-800 tabular-nums";

function BreakdownTable({ type2, type1, caption }) {
  const { rows, sessionsTotal, civilTotal, grandTotal } = buildTabularRows(
    type2,
    type1,
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-teal-200/45 bg-white shadow-[0_22px_60px_-28px_rgba(13,148,136,0.2)] ring-1 ring-teal-100/35">
      {caption ? (
        <div className="relative overflow-hidden border-b border-teal-900/20 bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 px-4 py-3 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_100%_-20%,rgba(45,212,191,0.18),transparent_50%)]" />
          <h3 className="relative text-sm font-black tracking-tight drop-shadow-sm">
            {caption}
          </h3>
          <p className="relative mt-0.5 text-[11px] font-bold text-teal-100/95">
            Sessions total: {sessionsTotal} · Civil total: {civilTotal} · Combined:{" "}
            {grandTotal}
          </p>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className={tableTh}>Section</th>
              <th className={tableTh}>Category</th>
              <th className={tableTh}>Total</th>
              <th className={tableTh}>Contested</th>
              <th className={tableTh}>Uncontested</th>
              <th className={tableTh}>% of section</th>
              <th className={tableTh}>% of combined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
              key={r.key}
              className="transition-colors hover:bg-teal-50/60"
            >
                <td className={tableTd}>{r.section}</td>
                <td className={`${tableTd} font-bold text-slate-900`}>
                  {r.label}
                </td>
                <td className={tableTd}>{r.value}</td>
                <td className={tableTd}>{r.construed}</td>
                <td className={tableTd}>{r.unconstrued}</td>
                <td className={tableTd}>{r.pctSection.toFixed(1)}%</td>
                <td className={tableTd}>{r.pctGrand.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function flatCategoriesWithTotals(type2, type1) {
  const rows = [];
  for (const [key, label] of Object.entries(SESSIONS_LABELS)) {
    rows.push({
      key: `s-${key}`,
      rawKey: key,
      label,
      section: "Sessions",
      value: Number(type2?.[key]) || 0,
    });
  }
  for (const [key, label] of Object.entries(CIVIL_LABELS)) {
    rows.push({
      key: `c-${key}`,
      rawKey: key,
      label,
      section: "Civil",
      value: Number(type1?.[key]) || 0,
    });
  }
  return rows;
}

function buildYearStats(payload) {
  if (!payload?.years?.length) return [];
  return [...payload.years]
    .map((y) => {
      const b = payload.byYear?.[String(y)];
      if (!b) return null;
      const sessions = sumLabelMap(b.type2_sessions, SESSIONS_LABELS);
      const civil = sumLabelMap(b.type1_civil, CIVIL_LABELS);
      return {
        year: y,
        sessions,
        civil,
        total: sessions + civil,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.total - a.total);
}

/** Highlights: peak year, top categories, balance — scoped to type2/type1 slice. */
function buildInsightBundle(type2, type1, payload) {
  const grand =
    sumLabelMap(type2, SESSIONS_LABELS) + sumLabelMap(type1, CIVIL_LABELS);
  const sessionsTot = sumLabelMap(type2, SESSIONS_LABELS);
  const civilTot = sumLabelMap(type1, CIVIL_LABELS);

  const categories = flatCategoriesWithTotals(type2, type1);
  const sorted = [...categories].sort((a, b) => b.value - a.value);
  const topCategory = sorted[0] || null;
  const topThree = sorted.filter((x) => x.value > 0).slice(0, 3);

  const yearStats = buildYearStats(payload);
  const peakYear =
    yearStats.length > 0
      ? [...yearStats].sort((a, b) => b.total - a.total || b.year - a.year)[0]
      : null;
  const quietYear =
    yearStats.length > 1
      ? [...yearStats].sort((a, b) => a.total - b.total || a.year - b.year)[0]
      : null;
  const yearsWithData = yearStats.filter((y) => y.total > 0).length;
  const withDataTotals = yearStats.filter((y) => y.total > 0);
  const avgPerYear =
    withDataTotals.length > 0
      ? Math.round(
          withDataTotals.reduce((s, y) => s + y.total, 0) /
            withDataTotals.length,
        )
      : 0;

  let peakYearTopCategory = null;
  if (peakYear && payload?.byYear?.[String(peakYear.year)]) {
    const b = payload.byYear[String(peakYear.year)];
    const sub = flatCategoriesWithTotals(
      b.type2_sessions,
      b.type1_civil,
    ).sort((a, b) => b.value - a.value)[0];
    peakYearTopCategory = sub?.value > 0 ? sub : null;
  }

  return {
    grand,
    sessionsTot,
    civilTot,
    sessionsPct: grand > 0 ? (sessionsTot / grand) * 100 : 0,
    civilPct: grand > 0 ? (civilTot / grand) * 100 : 0,
    topCategory,
    topThree,
    peakYear,
    quietYear,
    yearStats,
    yearsWithData,
    avgPerYear,
    peakYearTopCategory,
    yearSpan:
      yearStats.length > 0
        ? {
            min: Math.min(...yearStats.map((y) => y.year)),
            max: Math.max(...yearStats.map((y) => y.year)),
          }
        : null,
  };
}

/** Chronological year rows for disposal trend (sessions + civil). */
function buildDisposalYearTrendAsc(payload) {
  if (!payload?.years?.length) return [];
  return [...payload.years]
    .map((y) => Number(y))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b)
    .map((year) => {
      const b = payload.byYear?.[String(year)];
      if (!b) return { year, sessions: 0, civil: 0, total: 0 };
      const s = sumLabelMap(b.type2_sessions, SESSIONS_LABELS);
      const c = sumLabelMap(b.type1_civil, CIVIL_LABELS);
      return { year, sessions: s, civil: c, total: s + c };
    });
}

/** Top categories by all-year volume; per-year counts for multi-line trend. */
function buildCategoryYearTrend(payload, topN = 7) {
  if (!payload?.years?.length) return { data: [], series: [] };
  const years = [...payload.years]
    .map((y) => Number(y))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b);

  const totals = new Map();
  for (const y of years) {
    const b = payload.byYear?.[String(y)];
    if (!b) continue;
    for (const key of Object.keys(SESSIONS_LABELS)) {
      const id = `s:${key}`;
      totals.set(
        id,
        (totals.get(id) || 0) + (Number(b.type2_sessions?.[key]) || 0),
      );
    }
    for (const key of Object.keys(CIVIL_LABELS)) {
      const id = `c:${key}`;
      totals.set(
        id,
        (totals.get(id) || 0) + (Number(b.type1_civil?.[key]) || 0),
      );
    }
  }

  const topIds = [...totals.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => id);

  const series = topIds.map((id, i) => {
    const [sec, key] = id.split(":");
    const label =
      sec === "s" ? SESSIONS_LABELS[key] : CIVIL_LABELS[key];
    const section = sec === "s" ? "Sessions" : "Civil";
    return {
      dataKey: `c${i}`,
      name: `${label} · ${section}`,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    };
  });

  const data = years.map((year) => {
    const b = payload.byYear?.[String(year)];
    const row = { year };
    topIds.forEach((id, i) => {
      const [sec, key] = id.split(":");
      const dk = `c${i}`;
      if (!b) {
        row[dk] = 0;
        return;
      }
      row[dk] =
        sec === "s"
          ? Number(b.type2_sessions?.[key]) || 0
          : Number(b.type1_civil?.[key]) || 0;
    });
    return row;
  });

  return { data, series };
}

export const PerformanceDisposalYearTrend = memo(function PerformanceDisposalYearTrend({
  payload,
  loading,
}) {
  const data = useMemo(
    () => buildDisposalYearTrendAsc(payload),
    [payload],
  );

  if (!loading && !data.length) return null;

  return (
    <div className="rounded-3xl border border-teal-200/45 bg-white p-4 shadow-[0_22px_60px_-28px_rgba(13,148,136,0.2)] ring-1 ring-teal-100/35 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-teal-100/70 pb-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white shadow-lg shadow-teal-600/25">
          <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <h3 className="text-[14px] font-black text-slate-900">
            Disposals trend by year
          </h3>
          <p className="text-[11px] font-bold text-slate-500">
            Aggregated sessions, civil, and combined totals across all calendar
            years
          </p>
        </div>
      </div>
      <div className="h-[300px] w-full">
        {loading && !data.length ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-teal-50/40">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-teal-200/70 border-t-teal-700" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fontWeight: 800 }}
              />
              <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke={SLICE_COLORS[0]}
                strokeWidth={2.75}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="civil"
                name="Civil"
                stroke={SLICE_COLORS[4]}
                strokeWidth={2.75}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Combined"
                stroke={SLICE_COLORS[1]}
                strokeWidth={3.25}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export const PerformanceCategoryYearTrend = memo(function PerformanceCategoryYearTrend({
  payload,
  loading,
}) {
  const { data, series } = useMemo(
    () => buildCategoryYearTrend(payload, 7),
    [payload],
  );

  if (!loading && (!data.length || !series.length)) return null;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-26px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/80 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200/70 pb-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-600 to-sky-700 text-white shadow-lg shadow-indigo-500/25">
          <BarChart3 className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <h3 className="text-[14px] font-black text-slate-900">
            Category trend by year
          </h3>
          <p className="text-[11px] font-bold text-slate-500">
            Top disposal categories (sessions + civil) — one line per category
          </p>
        </div>
      </div>
      <div className="h-[340px] w-full">
        {loading && !data.length ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50/80">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-200/70 border-t-indigo-700" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fontWeight: 800 }}
              />
              <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 4, fontSize: 11 }} />
              {series.map((s) => (
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
        )}
      </div>
    </div>
  );
});

const insightTone = {
  teal: {
    border: "from-emerald-400 via-teal-500 to-cyan-400",
    glow: "shadow-[0_22px_60px_-18px_rgba(20,184,166,0.42)]",
    iconBg: "bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-teal-500/30",
    blob: "bg-teal-400/35",
    blob2: "bg-cyan-400/20",
    accent: "text-teal-600",
  },
  violet: {
    border: "from-violet-400 via-fuchsia-500 to-purple-500",
    glow: "shadow-[0_22px_60px_-18px_rgba(139,92,246,0.38)]",
    iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30",
    blob: "bg-violet-400/30",
    blob2: "bg-fuchsia-400/20",
    accent: "text-violet-600",
  },
  amber: {
    border: "from-amber-400 via-orange-500 to-rose-500",
    glow: "shadow-[0_22px_60px_-18px_rgba(251,146,60,0.42)]",
    iconBg:
      "bg-gradient-to-br from-amber-500 to-rose-600 shadow-lg shadow-amber-500/35",
    blob: "bg-amber-400/35",
    blob2: "bg-rose-400/22",
    accent: "text-amber-700",
  },
};

function InsightGlowCard({ title, subtitle, children, tone = "teal", icon: Icon }) {
  const t = insightTone[tone] || insightTone.teal;
  return (
    <div
      className={`group relative rounded-3xl bg-gradient-to-br ${t.border} p-[1.5px] ${t.glow} transition-transform duration-300 ease-out hover:scale-[1.015] hover:-translate-y-0.5`}
    >
      <div className="relative h-full overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-white to-slate-50/95 ring-1 ring-white/60">
        <div
          className={`pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full ${t.blob} blur-3xl`}
        />
        <div
          className={`pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full ${t.blob2} blur-3xl`}
        />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {Icon ? (
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${t.iconBg}`}
              >
                <Icon className="h-6 w-6" strokeWidth={2.25} />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1.5 text-xs font-semibold leading-snug text-slate-600">
                  {subtitle}
                </p>
              ) : null}
              <div className="mt-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceInsightsPanel({
  payload,
  consolidated,
  scopeLabel,
  narrowYearScope,
  activeSlice,
  combinedTotal,
  loading,
}) {
  const bundle = useMemo(() => {
    if (!consolidated || !activeSlice) return null;
    const slice = activeSlice;
    const scoped = buildInsightBundle(
      slice.type2_sessions,
      slice.type1_civil,
      payload,
    );
    const allTime = buildInsightBundle(
      consolidated.type2_sessions,
      consolidated.type1_civil,
      payload,
    );
    return { scoped, allTime };
  }, [payload, consolidated, activeSlice]);

  if (loading && !bundle) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-teal-200/50 bg-gradient-to-br from-teal-50/90 via-white to-sky-50/70 px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,0.18),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(14,116,144,0.12),transparent_45%)]" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 to-sky-500 opacity-40 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 animate-spin rounded-full border-[3px] border-teal-200/80 border-t-teal-700 border-l-sky-600" />
            <Zap className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-teal-600" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-teal-800">
            Shaping insights…
          </p>
        </div>
      </div>
    );
  }

  if (!bundle || bundle.scoped.grand === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-6 py-16 text-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-slate-200/40 blur-3xl" />
        <BarChart3 className="mx-auto h-14 w-14 text-slate-300" strokeWidth={1.25} />
        <p className="mt-4 text-base font-bold text-slate-500">
          No disposal figures to highlight yet.
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Data will appear here once performance records load.
        </p>
      </div>
    );
  }

  const { scoped, allTime } = bundle;
  const top = scoped.topCategory;
  const peak = allTime.peakYear;

  const rankRing = [
    "bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)]",
    "bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-md",
    "bg-gradient-to-br from-indigo-800 via-purple-900 to-violet-950 text-violet-100 shadow-md",
  ];

  return (
    <div className="relative space-y-6 overflow-hidden rounded-3xl border border-teal-200/45 bg-white p-4 shadow-[0_22px_60px_-28px_rgba(13,148,136,0.22)] ring-1 ring-teal-100/35 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,rgba(45,212,191,0.08),transparent),radial-gradient(ellipse_80%_60%_at_100%_100%,rgba(167,139,250,0.06),transparent)]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white shadow-lg shadow-teal-600/30">
            <Sparkles className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
              Performance insights
            </h2>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              At-a-glance highlights from your disposals
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm backdrop-blur-md">
            Scope · {scopeLabel}
          </span>
          {narrowYearScope && peak ? (
            <span className="max-w-xs text-right text-[10px] font-semibold leading-snug text-slate-400">
              Peak year cards use full history for context.
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2">
        <InsightGlowCard
          title="Highest disposal year"
          subtitle="Calendar year with the most total disposals"
          tone="teal"
          icon={Trophy}
        >
          {peak && peak.total > 0 ? (
            <>
              <p className="bg-gradient-to-r from-emerald-700 to-sky-600 bg-clip-text text-4xl font-black tabular-nums tracking-tight text-transparent sm:text-5xl">
                {peak.year}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/90 px-2.5 py-0.5 text-xs font-black text-teal-950 ring-1 ring-teal-200/60">
                  <Zap className="h-3.5 w-3.5" />
                  {peak.total.toLocaleString()} disposals
                </span>
                {allTime.grand > 0 ? (
                  <span className="text-xs font-bold text-teal-800/90">
                    {((peak.total / allTime.grand) * 100).toFixed(1)}% of
                    all-time
                  </span>
                ) : null}
              </p>
              {allTime.peakYearTopCategory ? (
                <div className="mt-4 rounded-2xl border border-teal-100/80 bg-gradient-to-r from-teal-50/90 to-sky-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-teal-800/85">
                    Top driver that year
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {allTime.peakYearTopCategory.label}
                    <span className="ml-2 text-xs font-bold text-violet-600">
                      {allTime.peakYearTopCategory.section}
                    </span>
                  </p>
                  <p className="text-xs font-bold tabular-nums text-slate-600">
                    {allTime.peakYearTopCategory.value.toLocaleString()} cases
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              No year breakdown returned.
            </p>
          )}
        </InsightGlowCard>

        <InsightGlowCard
          title="Top disposal category"
          subtitle="Largest single bucket in the current scope"
          tone="violet"
          icon={Target}
        >
          {top && top.value > 0 ? (
            <>
              <p className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">
                {top.label}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-800 ring-1 ring-violet-200/60">
                {top.section}
              </span>
              <p className="mt-4 text-4xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600">
                {top.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {scoped.grand > 0
                  ? `${((top.value / scoped.grand) * 100).toFixed(1)}% of this scope`
                  : null}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500">—</p>
          )}
        </InsightGlowCard>

        <InsightGlowCard
          title="Sessions vs civil"
          subtitle="Visual mix of workload in the current scope"
          tone="teal"
          icon={Scale}
        >
          <div className="space-y-3">
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-200/90 p-0.5 shadow-inner ring-1 ring-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 shadow-sm transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, scoped.sessionsPct))}%` }}
                title="Sessions"
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-600 shadow-sm transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, scoped.civilPct))}%` }}
                title="Civil"
              />
            </div>
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Sessions
                </p>
                <p className="text-xl font-black tabular-nums text-slate-900">
                  {scoped.sessionsTot.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {scoped.sessionsPct.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  Civil
                </p>
                <p className="text-xl font-black tabular-nums text-slate-900">
                  {scoped.civilTot.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {scoped.civilPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </InsightGlowCard>

        <InsightGlowCard
          title="Year spread & pace"
          subtitle="Timeline and average intensity"
          tone="amber"
          icon={TrendingUp}
        >
          {allTime.yearSpan && allTime.yearsWithData > 0 ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2">
                <Calendar className="h-5 w-5 text-violet-600" />
                <p className="text-lg font-black text-slate-900">
                  {allTime.yearSpan.min}
                  <span className="mx-1 text-violet-500">→</span>
                  {allTime.yearSpan.max}
                </p>
                <span className="rounded-full bg-violet-100/90 px-2 py-0.5 text-[10px] font-black text-violet-900">
                  {allTime.yearStats.length} rows
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Avg per active year:{" "}
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-purple-600 tabular-nums text-lg">
                  {allTime.avgPerYear.toLocaleString()}
                </span>
              </p>
              {allTime.quietYear &&
              allTime.peakYear &&
              allTime.quietYear.total < allTime.peakYear.total ? (
                <p className="mt-3 rounded-xl border border-violet-100/90 bg-violet-50/50 px-3 py-2 text-xs font-semibold text-violet-900/90">
                  Lightest:{" "}
                  <span className="font-black">{allTime.quietYear.year}</span> (
                  {allTime.quietYear.total.toLocaleString()}) · Peak:{" "}
                  <span className="font-black">
                    {allTime.peakYear.total.toLocaleString()}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              Single summary only.
            </p>
          )}
        </InsightGlowCard>
      </div>

      <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 p-[1.5px] shadow-[0_20px_50px_-15px_rgba(124,58,237,0.45)]">
        <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-violet-50/30 to-white px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
              <BarChart3 className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-800">
                Top three categories
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                This scope · ranked by count
              </p>
            </div>
          </div>
          <ol className="space-y-3">
            {scoped.topThree.length ? (
              scoped.topThree.map((row, i) => (
                <li
                  key={row.key}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 bg-gradient-to-r from-white to-slate-50/80 px-4 py-3 shadow-sm ring-1 ring-white/80 transition hover:shadow-md"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${rankRing[i] ?? rankRing[2]}`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-900">
                      {row.label}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                      {row.section}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600">
                      {row.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {scoped.grand > 0
                        ? `${((row.value / scoped.grand) * 100).toFixed(0)}% of scope`
                        : ""}
                    </span>
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm font-semibold text-slate-500">
                No positive counts.
              </li>
            )}
          </ol>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-[1px] shadow-[0_18px_44px_-12px_rgba(13,148,136,0.45)]">
        <div className="relative flex flex-col items-center justify-center gap-1 rounded-[14px] bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 px-6 py-5 text-center sm:flex-row sm:gap-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(45,212,191,0.15),transparent_55%)]" />
          <p className="relative text-[10px] font-black uppercase tracking-[0.25em] text-teal-300/95">
            Total · current scope
          </p>
          <p className="relative text-3xl font-black tabular-nums text-white drop-shadow-sm sm:text-4xl">
            {combinedTotal.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function YearTotalsTable({ payload, loading }) {
  const yearRows = useMemo(() => {
    if (!payload?.years?.length) return [];
    return [...payload.years]
      .sort((a, b) => b - a)
      .map((y) => {
        const b = payload.byYear?.[String(y)];
        if (!b) return null;
        const s = sumLabelMap(b.type2_sessions, SESSIONS_LABELS);
        const c = sumLabelMap(b.type1_civil, CIVIL_LABELS);
        return { year: y, sessions: s, civil: c, total: s + c };
      })
      .filter(Boolean);
  }, [payload]);

  if (!yearRows.length) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-teal-200/45 bg-white shadow-[0_22px_60px_-28px_rgba(13,148,136,0.18)] ring-1 ring-teal-100/35">
      <div className="relative overflow-hidden border-b border-teal-900/20 bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 px-4 py-3 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_100%_-20%,rgba(45,212,191,0.18),transparent_50%)]" />
        <h3 className="relative text-sm font-black tracking-tight drop-shadow-sm">
          Year-wise totals
        </h3>
        <p className="relative mt-0.5 text-[11px] font-bold text-teal-100/95">
          Sessions + civil counts per calendar year
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr>
              <th className={tableTh}>Year</th>
              <th className={tableTh}>Sessions total</th>
              <th className={tableTh}>Civil total</th>
              <th className={tableTh}>Combined</th>
            </tr>
          </thead>
          <tbody>
            {yearRows.map((r) => (
              <tr
                key={r.year}
                className="transition-colors hover:bg-teal-50/55"
              >
                <td className={`${tableTd} font-black`}>{r.year}</td>
                <td className={tableTd}>{loading ? "…" : r.sessions}</td>
                <td className={tableTd}>{loading ? "…" : r.civil}</td>
                <td className={tableTd}>{loading ? "…" : r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Donut beside total disposals: contested vs uncontested (shared slice colors). */
const ContestedUncontestedPie = memo(function ContestedUncontestedPie({
  contested,
  uncontested,
  loading,
}) {
  const data = useMemo(() => {
    const c = Number(contested) || 0;
    const u = Number(uncontested) || 0;
    const rows = [];
    if (c > 0) rows.push({ name: "Contested", value: c });
    if (u > 0) rows.push({ name: "Uncontested", value: u });
    return rows;
  }, [contested, uncontested]);

  const sliceTotal = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data],
  );

  if (loading) {
    return (
      <div className="flex h-[200px] w-full max-w-[260px] items-center justify-center">
        <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-teal-200/70 border-t-teal-700" />
      </div>
    );
  }

  if (sliceTotal <= 0) {
    return (
      <div className="flex min-h-[140px] w-full max-w-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/50 px-3 py-4 text-center">
        <p className="text-[11px] font-bold leading-snug text-slate-400">
          No split totals returned for this scope.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[280px] mx-auto md:mx-0">
      <div className="h-[220px] w-full">
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
              label={renderPieLabel}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CU_SPLIT_COLORS[i % CU_SPLIT_COLORS.length]}
                  {...DONUT_CELL_STROKE}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${Number(v).toLocaleString()}`, "Cases"]}
              contentStyle={{
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-black">
        <span className="flex items-center gap-2 text-slate-800">
          <span
            className="h-3 w-3 shrink-0 rounded-sm shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: CU_SPLIT_COLORS[0] }}
          />
          Contested · {(Number(contested) || 0).toLocaleString()}
        </span>
        <span className="flex items-center gap-2 text-slate-800">
          <span
            className="h-3 w-3 shrink-0 rounded-sm shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: CU_SPLIT_COLORS[1] }}
          />
          Uncontested · {(Number(uncontested) || 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
});

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px] sm:text-[11px] font-black"
      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function StatList({ items, typeTotal }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-col gap-2 w-full min-w-0">
      {items.map((row, i) => (
        <li
          key={row.key}
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white to-slate-50/90 px-3 py-2.5 shadow-sm"
        >
          <span className="text-sm font-bold text-slate-800 leading-tight">
            {row.label}
          </span>
          <span className="shrink-0 text-right tabular-nums">
            <span className="text-base font-black text-slate-900">
              {row.value}
            </span>
            <span className="text-xs font-bold text-slate-500 ml-2">
              {typeTotal ? `${row.pct.toFixed(1)}%` : "—"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function buildCuSplitRows(labelMap, dataObj) {
  return Object.entries(labelMap)
    .map(([key, label]) => {
      const contested = Number(dataObj?.[`${key}_con`]) || 0;
      const uncontested = Number(dataObj?.[`${key}_uncon`]) || 0;
      const total = Number(dataObj?.[key]) || 0;
      const denom = Math.max(contested + uncontested, total, 1);
      const pctContested = (contested / denom) * 100;
      const pctUncontested = (uncontested / denom) * 100;
      return {
        rowKey: key,
        label,
        contested,
        uncontested,
        total,
        pctContested,
        pctUncontested,
      };
    })
    .filter((r) => r.total > 0 || r.contested > 0 || r.uncontested > 0);
}

/** Contested/uncontested cards for one performance type only (`type2_sessions` vs `type1_civil`). */
const WorkloadCuSplitPanel = memo(function WorkloadCuSplitPanel({
  typeId,
  labelMap,
  dataObj,
  title,
  variant,
  loading,
}) {
  const rows = useMemo(
    () => buildCuSplitRows(labelMap, dataObj),
    [labelMap, dataObj],
  );

  const sums = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        contested: acc.contested + r.contested,
        uncontested: acc.uncontested + r.uncontested,
      }),
      { contested: 0, uncontested: 0 },
    );
  }, [rows]);

  const isSessions = variant === "sessions";

  if (loading) {
    return (
      <div
        className={`mt-5 rounded-2xl border bg-white/90 p-8 flex justify-center ${
          isSessions
            ? "border-teal-200/70"
            : "border-violet-200/70"
        }`}
      >
        <div
          className={`h-10 w-10 rounded-full border-[3px] animate-spin ${
            isSessions
              ? "border-teal-300/45 border-t-teal-600 border-l-teal-400"
              : "border-violet-300/45 border-t-violet-700 border-l-violet-500"
          }`}
        />
      </div>
    );
  }

  if (rows.length === 0) return null;

  const shell = isSessions
    ? "border-teal-200/65 bg-gradient-to-b from-white via-teal-50/38 to-teal-50/25 shadow-[0_18px_48px_-28px_rgba(13,148,136,0.26)] ring-1 ring-teal-100/85"
    : "border-violet-200/65 bg-gradient-to-b from-white via-violet-50/38 to-violet-50/22 shadow-[0_18px_48px_-28px_rgba(139,92,246,0.22)] ring-1 ring-violet-100/85";

  const headerBorder = isSessions ? "border-teal-200/45" : "border-violet-200/45";

  const iconBg = isSessions
    ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 shadow-lg shadow-teal-600/28"
    : "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 shadow-lg shadow-violet-600/30";

  const cardRing = isSessions
    ? "shadow-teal-500/12 ring-1 ring-teal-100/90"
    : "shadow-violet-500/14 ring-1 ring-violet-100/90";

  return (
    <div className={`mt-5 rounded-2xl border p-4 sm:p-5 ${shell}`}>
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 ${headerBorder}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white ring-2 ring-white/80 ${iconBg}`}
          >
            <Scale className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-slate-900">
              {title}
            </h4>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Performance type · {typeId}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-violet-400 bg-gradient-to-r from-violet-100 via-purple-50 to-indigo-50 px-3 py-1.5 text-[11px] font-black tabular-nums text-violet-950 shadow-sm">
            Contested · {sums.contested.toLocaleString()}
          </span>
          <span className="rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-100 via-teal-50 to-teal-100/90 px-3 py-1.5 text-[11px] font-black tabular-nums text-teal-950 shadow-sm">
            Uncontested · {sums.uncontested.toLocaleString()}
          </span>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.rowKey}
            className={`rounded-xl border border-white/80 bg-white/95 p-3.5 shadow-md ${cardRing}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-black leading-snug text-slate-900">
                {r.label}
              </span>
              <span className="shrink-0 rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-black tabular-nums text-white">
                Total {r.total.toLocaleString()}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 px-2.5 py-2.5 text-center text-white shadow-inner shadow-black/15 ring-1 ring-white/40">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/95">
                  Contested
                </div>
                <div className="mt-0.5 text-lg font-black tabular-nums leading-none drop-shadow-sm">
                  {r.contested.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 px-2.5 py-2.5 text-center text-white shadow-inner shadow-black/15 ring-1 ring-white/40">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/95">
                  Uncontested
                </div>
                <div className="mt-0.5 text-lg font-black tabular-nums leading-none drop-shadow-sm">
                  {r.uncontested.toLocaleString()}
                </div>
              </div>
            </div>

            <div
              className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-900/10 ring-1 ring-slate-900/15"
              role="img"
              aria-label={`${r.label}: ${r.pctContested.toFixed(0)}% contested`}
            >
              {r.contested > 0 ? (
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-[width] duration-300 ease-out"
                  style={{ width: `${r.pctContested}%` }}
                />
              ) : null}
              {r.uncontested > 0 ? (
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-teal-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-[width] duration-300 ease-out"
                  style={{ width: `${r.pctUncontested}%` }}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

/** One type: pie + vertical stat list (flex row on sm+). */
const TypePerformanceBlock = memo(function TypePerformanceBlock({
  title,
  accent,
  labelMap,
  dataObj,
  loading,
}) {
  const total = sumLabelMap(dataObj, labelMap);
  const pieData = useMemo(
    () => toPieData(dataObj, labelMap),
    [dataObj, labelMap],
  );
  const statItems = useMemo(
    () => toStatItems(dataObj, labelMap, total),
    [dataObj, labelMap, total],
  );

  if (!loading && total === 0) return null;

  return (
    <div
      className={`rounded-2xl border bg-white/95 p-4 shadow-[0_16px_44px_-22px_rgba(15,118,110,0.14)] min-w-0 flex-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-20px_rgba(15,118,110,0.22)] ${accent}`}
    >
      <div className="mb-3">
        <h4 className="text-sm font-black text-slate-900">{title}</h4>
        <p
          className={`mt-2 text-2xl font-black tabular-nums ${
            title === "Civil" ? "text-violet-900" : "text-teal-800"
          }`}
        >
          {loading ? "…" : total}{" "}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            total
          </span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div
          className="w-full sm:w-[min(100%,260px)] shrink-0 mx-auto sm:mx-0"
          style={{ height: 240 }}
        >
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-teal-200/65 border-t-teal-700" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 text-center px-2">
              No breakdown
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  {...DONUT_PIE_PROPS}
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                      {...DONUT_CELL_STROKE}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    const p = total ? ((value / total) * 100).toFixed(1) : 0;
                    return [`${value} (${p}%)`, "Count"];
                  }}
                  contentStyle={{
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Count
          </p>
          <StatList items={statItems} typeTotal={total} />
        </div>
      </div>
    </div>
  );
});

/** Sessions first, then Civil — two blocks in one row on large screens (not CSS grid). */
const SessionsCivilRow = memo(function SessionsCivilRow({
  type2,
  type1,
  loading,
  rowTitle,
}) {
  const sTot = sumLabelMap(type2, SESSIONS_LABELS);
  const cTot = sumLabelMap(type1, CIVIL_LABELS);
  const empty = !loading && sTot === 0 && cTot === 0;

  return (
    <div className="rounded-3xl border border-teal-200/45 bg-gradient-to-b from-slate-50/40 via-white to-white p-4 shadow-[0_22px_60px_-28px_rgba(13,148,136,0.16)] ring-1 ring-teal-100/35 sm:p-5">
      {rowTitle ? (
        <div className="mb-4 border-b border-teal-100/80 pb-3">
          <h3 className="text-base font-black text-slate-900">{rowTitle}</h3>
        </div>
      ) : null}

      {empty ? (
        <p className="text-sm font-semibold text-slate-400 text-center py-8">
          No session or civil disposals for this period.
        </p>
      ) : (
      <>
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
          <TypePerformanceBlock
            title="Sessions"
            accent="ring-1 ring-teal-200/80 border-teal-100"
            labelMap={SESSIONS_LABELS}
            dataObj={type2}
            loading={loading}
          />
          <TypePerformanceBlock
            title="Civil"
            accent="ring-1 ring-violet-200/85 border-violet-100"
            labelMap={CIVIL_LABELS}
            dataObj={type1}
            loading={loading}
          />
        </div>
        <WorkloadCuSplitPanel
          typeId={PERFORMANCE_TYPE_SESSIONS}
          labelMap={SESSIONS_LABELS}
          dataObj={type2}
          title="Sessions workload split"
          variant="sessions"
          loading={loading}
        />
        <WorkloadCuSplitPanel
          typeId={PERFORMANCE_TYPE_CIVIL}
          labelMap={CIVIL_LABELS}
          dataObj={type1}
          title="Civil workload split"
          variant="civil"
          loading={loading}
        />
      </>
      )}
    </div>
  );
});

function getConsolidated(payload) {
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

/** Merge multiple by-year buckets (sessions + civil + contested splits). */
function mergePerformanceBuckets(buckets) {
  if (!buckets?.length) return null;
  const fold = (labelMap, pick) => {
    const acc = {};
    for (const key of Object.keys(labelMap)) {
      acc[key] = 0;
      acc[`${key}_con`] = 0;
      acc[`${key}_uncon`] = 0;
    }
    for (const b of buckets) {
      const src = pick(b);
      if (!src) continue;
      for (const key of Object.keys(labelMap)) {
        acc[key] += Number(src[key]) || 0;
        acc[`${key}_con`] += Number(src[`${key}_con`]) || 0;
        acc[`${key}_uncon`] += Number(src[`${key}_uncon`]) || 0;
      }
    }
    return acc;
  };
  return {
    type2_sessions: fold(SESSIONS_LABELS, (b) => b.type2_sessions),
    type1_civil: fold(CIVIL_LABELS, (b) => b.type1_civil),
  };
}

function filterPayloadByYears(payload, yearsAsc) {
  if (!payload?.years?.length) return payload;
  const list = [...yearsAsc]
    .map((y) => Number(y))
    .filter((y) => Number.isFinite(y) && payload.byYear?.[String(y)]);
  if (!list.length) return payload;
  const sorted = [...new Set(list)].sort((a, b) => a - b);
  const byYear = {};
  for (const y of sorted) {
    byYear[String(y)] = payload.byYear[String(y)];
  }
  const buckets = sorted.map((y) => payload.byYear[String(y)]);
  const consolidated = mergePerformanceBuckets(buckets);
  return {
    ...payload,
    years: sorted,
    byYear,
    consolidated,
  };
}

export default function PerformanceTab({ pfNoFromProfile }) {
  const [personalNo, setPersonalNo] = useState("");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /** all = API consolidated; single = one calendar year; range = merged inclusive years */
  const [yearMode, setYearMode] = useState("all");
  const [selectedYear, setSelectedYear] = useState(null);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [viewMode, setViewMode] = useState("charts");

  useEffect(() => {
    setPersonalNo(
      pfNoFromProfile != null ? String(pfNoFromProfile).trim() : "",
    );
  }, [pfNoFromProfile]);

  useEffect(() => {
    const pn = personalNo.trim();
    if (!pn) {
      setPayload(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await Api.getComplaintPerformanceSummary({
          personalNo: pn,
        });
        if (!cancelled) {
          setPayload(data);
          setYearMode("all");
          setSelectedYear(null);
          const ys = [...(data.years || [])].sort((a, b) => a - b);
          if (ys.length) {
            setRangeFrom(String(ys[0]));
            setRangeTo(String(ys[ys.length - 1]));
          } else {
            setRangeFrom("");
            setRangeTo("");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setPayload(null);
          setError(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              e?.message ||
              "Failed to load performance data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [personalNo]);

  const consolidated = useMemo(() => getConsolidated(payload), [payload]);

  const yearOptionsDesc = useMemo(
    () =>
      payload?.years?.length
        ? [...payload.years].sort((a, b) => b - a)
        : [],
    [payload],
  );

  const yearOptionsAsc = useMemo(
    () =>
      payload?.years?.length
        ? [...payload.years].sort((a, b) => a - b)
        : [],
    [payload],
  );

  const activeSlice = useMemo(() => {
    if (!payload || !consolidated) return null;
    if (yearMode === "all") return consolidated;
    if (yearMode === "single") {
      if (!selectedYear) return consolidated;
      const y = payload.byYear?.[String(selectedYear)];
      if (!y) return consolidated;
      return {
        type2_sessions: y.type2_sessions,
        type1_civil: y.type1_civil,
      };
    }
    if (yearMode === "range") {
      const low = Math.min(Number(rangeFrom), Number(rangeTo));
      const high = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(low) || !Number.isFinite(high)) return consolidated;
      const years = yearOptionsAsc.filter((y) => y >= low && y <= high);
      const buckets = years
        .map((y) => payload.byYear?.[String(y)])
        .filter(Boolean);
      if (!buckets.length) return consolidated;
      return mergePerformanceBuckets(buckets);
    }
    return consolidated;
  }, [
    payload,
    consolidated,
    yearMode,
    selectedYear,
    rangeFrom,
    rangeTo,
    yearOptionsAsc,
  ]);

  const trendPayload = useMemo(() => {
    if (!payload?.years?.length) return payload;
    if (yearMode === "all") return payload;
    if (yearMode === "single" && selectedYear) {
      const y = Number(selectedYear);
      if (!Number.isFinite(y)) return payload;
      return filterPayloadByYears(payload, [y]);
    }
    if (yearMode === "range") {
      const low = Math.min(Number(rangeFrom), Number(rangeTo));
      const high = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(low) || !Number.isFinite(high)) return payload;
      const ys = yearOptionsAsc.filter((y) => y >= low && y <= high);
      return filterPayloadByYears(payload, ys);
    }
    return payload;
  }, [payload, yearMode, selectedYear, rangeFrom, rangeTo, yearOptionsAsc]);

  const yearsForDetailSections = useMemo(() => {
    if (!payload?.years?.length) return [];
    const desc = [...payload.years].sort((a, b) => b - a);
    if (yearMode === "all") return desc;
    if (yearMode === "range") {
      const low = Math.min(Number(rangeFrom), Number(rangeTo));
      const high = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(low) || !Number.isFinite(high)) return desc;
      return desc.filter((y) => y >= low && y <= high);
    }
    return [];
  }, [payload, yearMode, rangeFrom, rangeTo]);

  const performanceScopeLabel = useMemo(() => {
    if (yearMode === "all") return "All years (consolidated)";
    if (yearMode === "single" && selectedYear) return `Year ${selectedYear}`;
    if (yearMode === "range") {
      const a = Math.min(Number(rangeFrom), Number(rangeTo));
      const b = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return "Custom range";
      return a === b ? `Year ${a}` : `Years ${a}–${b} (merged)`;
    }
    return "All years (consolidated)";
  }, [yearMode, selectedYear, rangeFrom, rangeTo]);

  const chartsHeroLabel = useMemo(() => {
    if (yearMode === "all") return "Total disposals";
    if (yearMode === "single" && selectedYear) return `Total for ${selectedYear}`;
    if (yearMode === "range") {
      const a = Math.min(Number(rangeFrom), Number(rangeTo));
      const b = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return "Total disposals";
      return a === b ? `Total for ${a}` : `Total · ${a}–${b}`;
    }
    return "Total disposals";
  }, [yearMode, selectedYear, rangeFrom, rangeTo]);

  const combinedTotal = useMemo(() => {
    if (!activeSlice) return 0;
    return (
      sumLabelMap(activeSlice.type2_sessions, SESSIONS_LABELS) +
      sumLabelMap(activeSlice.type1_civil, CIVIL_LABELS)
    );
  }, [activeSlice]);

  const contestedUncontestedGrand = useMemo(() => {
    if (!activeSlice) return { contested: 0, uncontested: 0 };
    return sumAllContestedUncontested(
      activeSlice.type2_sessions,
      activeSlice.type1_civil,
    );
  }, [activeSlice]);

  const viewBtnBase =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all duration-200";
  const viewBtnInactive =
    "text-slate-600 border border-slate-200/80 bg-white/90 shadow-sm hover:bg-emerald-50/80 hover:border-teal-200/80";
  const viewBtnChartsActive =
    "bg-gradient-to-r from-emerald-700 to-sky-600 text-white shadow-[0_12px_32px_-8px_rgba(15,118,110,0.45)] ring-2 ring-teal-300/55";
  const viewBtnTabularActive =
    "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white shadow-[0_12px_32px_-8px_rgba(109,40,217,0.4)] ring-2 ring-violet-200/60";
  const viewBtnInsightsActive =
    "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-[0_12px_32px_-8px_rgba(217,119,6,0.42)] ring-2 ring-amber-200/65";

  const periodChipActive =
    "bg-gradient-to-r from-emerald-700 to-sky-600 text-white shadow-[0_10px_28px_-8px_rgba(15,118,110,0.4)] ring-2 ring-teal-200/65";
  const periodChipInactive =
    "border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm hover:border-teal-200 hover:bg-teal-50/50";
  const yearChipActive =
    "bg-gradient-to-r from-violet-700 to-indigo-600 text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.38)] ring-2 ring-violet-200/65";

  const mainChartsSectionTitle = useMemo(() => {
    if (yearMode === "all") return "Consolidated — all years";
    if (yearMode === "range") {
      const a = Math.min(Number(rangeFrom), Number(rangeTo));
      const b = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return "Merged years";
      return a === b ? `Year ${a}` : `Merged · ${a}–${b}`;
    }
    return "";
  }, [yearMode, rangeFrom, rangeTo]);

  const tabularMergedCaption = useMemo(() => {
    if (yearMode === "all") return "Consolidated — all years (detail)";
    if (yearMode === "range") {
      const a = Math.min(Number(rangeFrom), Number(rangeTo));
      const b = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return "Merged (detail)";
      return a === b
        ? `Year ${a} (detail)`
        : `Years ${a}–${b} (merged detail)`;
    }
    return "Detail";
  }, [yearMode, rangeFrom, rangeTo]);

  const tabularHeroSubtitle = useMemo(() => {
    if (yearMode === "all") return "Combined total (all years)";
    if (yearMode === "range") {
      const a = Math.min(Number(rangeFrom), Number(rangeTo));
      const b = Math.max(Number(rangeFrom), Number(rangeTo));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return "Merged total";
      return a === b ? `Total for ${a}` : `Merged total · ${a}–${b}`;
    }
    return "";
  }, [yearMode, rangeFrom, rangeTo]);

  const yearTotalsPayload = yearMode === "all" ? payload : trendPayload;
  const narrowYearScope = yearMode !== "all";

  const selectYearClass =
    "min-w-[5.5rem] rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-[12px] font-bold text-slate-800 shadow-sm outline-none ring-1 ring-slate-100/80 focus:border-teal-300 focus:ring-2 focus:ring-teal-400/35";

  return (
    <div className="relative min-w-[320px] space-y-8 overflow-hidden rounded-3xl border border-teal-200/45 bg-white/85 px-3 py-6 shadow-[0_22px_60px_-28px_rgba(13,148,136,0.2)] ring-1 ring-teal-100/35 backdrop-blur-sm sm:px-5 sm:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/45 to-transparent" />
      <div className="relative z-10 space-y-8">
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/60 to-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pl-2 text-[10px] font-black uppercase tracking-widest text-teal-900/85">
              View
            </span>
            <div className="flex flex-wrap gap-1 sm:ml-1">
              <button
                type="button"
                onClick={() => setViewMode("charts")}
                className={[
                  viewBtnBase,
                  viewMode === "charts" ? viewBtnChartsActive : viewBtnInactive,
                ].join(" ")}
              >
                <PieChartIcon
                  className="h-4 w-4 opacity-90"
                  strokeWidth={2.25}
                />
                Charts
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tabular")}
                className={[
                  viewBtnBase,
                  viewMode === "tabular"
                    ? viewBtnTabularActive
                    : viewBtnInactive,
                ].join(" ")}
              >
                <LayoutGrid
                  className="h-4 w-4 opacity-90"
                  strokeWidth={2.25}
                />
                Tabular
              </button>
              <button
                type="button"
                onClick={() => setViewMode("insights")}
                className={[
                  viewBtnBase,
                  viewMode === "insights"
                    ? viewBtnInsightsActive
                    : viewBtnInactive,
                ].join(" ")}
              >
                <Sparkles
                  className="h-4 w-4 opacity-90"
                  strokeWidth={2.25}
                />
                Insights
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-teal-200/45 bg-gradient-to-b from-slate-50/50 via-white to-white px-3 py-3 shadow-sm ring-1 ring-teal-100/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 pl-1 text-[10px] font-black uppercase tracking-widest text-teal-900/80">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              Period
            </span>
            <button
              type="button"
              disabled={!payload || loading}
              onClick={() => {
                setYearMode("all");
                setSelectedYear(null);
              }}
              className={[
                "rounded-xl px-4 py-2 text-xs font-black transition-all duration-200",
                yearMode === "all" ? periodChipActive : periodChipInactive,
              ].join(" ")}
            >
              All years
            </button>
            <button
              type="button"
              disabled={!payload || loading || !yearOptionsAsc.length}
              onClick={() => setYearMode("range")}
              className={[
                "rounded-xl px-4 py-2 text-xs font-black transition-all duration-200",
                yearMode === "range" ? periodChipActive : periodChipInactive,
              ].join(" ")}
            >
              Year range
            </button>
          </div>

          {yearMode === "range" && yearOptionsAsc.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3">
              <span className="text-[11px] font-bold text-slate-600">From</span>
              <select
                className={selectYearClass}
                value={rangeFrom}
                disabled={!payload || loading}
                onChange={(e) => setRangeFrom(e.target.value)}
              >
                {yearOptionsAsc.map((y) => (
                  <option key={`f-${y}`} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-bold text-slate-600">to</span>
              <select
                className={selectYearClass}
                value={rangeTo}
                disabled={!payload || loading}
                onChange={(e) => setRangeTo(e.target.value)}
              >
                {yearOptionsAsc.map((y) => (
                  <option key={`t-${y}`} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {yearOptionsDesc.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-slate-200/60 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Single year
              </span>
              <div className="flex flex-wrap gap-2">
                {yearOptionsDesc.map((y) => (
                  <button
                    key={y}
                    type="button"
                    disabled={!payload || loading}
                    onClick={() => {
                      setYearMode("single");
                      setSelectedYear(String(y));
                    }}
                    className={[
                      "rounded-xl px-3 py-1.5 text-xs font-black transition-all duration-200",
                      yearMode === "single" && selectedYear === String(y)
                        ? yearChipActive
                        : periodChipInactive,
                    ].join(" ")}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50 to-orange-50/50 px-4 py-3 shadow-md">
            <p className="relative text-sm font-bold text-rose-900">{error}</p>
          </div>
        ) : null}

        {personalNo && (payload?.years?.length || loading) ? (
          <div className="space-y-6">
            <PerformanceDisposalYearTrend
              payload={trendPayload}
              loading={loading}
            />
            <PerformanceCategoryYearTrend
              payload={trendPayload}
              loading={loading}
            />
          </div>
        ) : null}

        {viewMode === "insights" ? (
          <PerformanceInsightsPanel
            payload={payload}
            consolidated={consolidated}
            scopeLabel={performanceScopeLabel}
            narrowYearScope={narrowYearScope}
            activeSlice={activeSlice}
            combinedTotal={combinedTotal}
            loading={loading}
          />
        ) : viewMode === "charts" ? (
          <>
            {(yearMode === "all" || yearMode === "range") && consolidated ? (
              <>
                <div className="group relative overflow-hidden rounded-3xl border border-teal-200/45 bg-white shadow-[0_22px_60px_-28px_rgba(13,148,136,0.22)] ring-1 ring-teal-100/35">
                  <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 px-4 py-8 text-white sm:px-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_100%_-20%,rgba(45,212,191,0.22),transparent_50%),radial-gradient(ellipse_80%_60%_at_0%_100%,rgba(167,139,250,0.1),transparent_45%)]" />
                    <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-10 md:text-left">
                      <div className="text-center md:min-w-0 md:flex-1 md:text-left">
                        <p className="inline-flex items-center rounded-full border border-white/20 bg-slate-950/25 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-white shadow-sm backdrop-blur">
                          {chartsHeroLabel}
                        </p>
                        <p className="mt-2 text-4xl font-black tabular-nums text-white drop-shadow-sm sm:text-5xl sm:leading-none">
                          {loading ? "…" : combinedTotal.toLocaleString()}
                        </p>
                      </div>
                      <ContestedUncontestedPie
                        contested={contestedUncontestedGrand.contested}
                        uncontested={contestedUncontestedGrand.uncontested}
                        loading={loading}
                      />
                    </div>
                  </div>
                </div>

                <section className="space-y-2">
                  <h2 className="inline-flex items-center gap-3 px-1 text-sm font-black uppercase tracking-widest text-teal-900/90">
                    <span className="h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-teal-400 to-emerald-500" />
                    {mainChartsSectionTitle}
                    <span className="h-0.5 w-8 rounded-full bg-gradient-to-l from-transparent via-teal-400 to-emerald-500" />
                  </h2>
                  <SessionsCivilRow
                    type2={activeSlice.type2_sessions}
                    type1={activeSlice.type1_civil}
                    loading={loading}
                    rowTitle={null}
                  />
                </section>

                {yearsForDetailSections.length > 0 ? (
                  <section className="space-y-4">
                    <h2 className="px-1 text-sm font-black uppercase tracking-widest text-slate-600">
                      Year-wise
                    </h2>
                    <div className="flex flex-col gap-6">
                      {yearsForDetailSections.map((y) => {
                        const bucket = payload?.byYear?.[String(y)];
                        if (!bucket) return null;
                        return (
                          <SessionsCivilRow
                            key={y}
                            type2={bucket.type2_sessions}
                            type1={bucket.type1_civil}
                            loading={loading}
                            rowTitle={`Year ${y}`}
                          />
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </>
            ) : yearMode === "single" && selectedYear && activeSlice ? (
              <>
                <div className="group relative overflow-hidden rounded-3xl border border-teal-200/45 bg-white shadow-[0_22px_60px_-28px_rgba(13,148,136,0.22)] ring-1 ring-teal-100/35">
                  <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 px-4 py-8 text-white sm:px-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_100%_-20%,rgba(45,212,191,0.2),transparent_50%)]" />
                    <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-10 md:text-left">
                      <div className="text-center md:min-w-0 md:flex-1 md:text-left">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-teal-100/95">
                          {chartsHeroLabel}
                        </p>
                        <p className="mt-2 text-4xl font-black tabular-nums text-white sm:text-5xl sm:leading-none">
                          {loading ? "…" : combinedTotal.toLocaleString()}
                        </p>
                      </div>
                      <ContestedUncontestedPie
                        contested={contestedUncontestedGrand.contested}
                        uncontested={contestedUncontestedGrand.uncontested}
                        loading={loading}
                      />
                    </div>
                  </div>
                </div>
                <SessionsCivilRow
                  type2={activeSlice.type2_sessions}
                  type1={activeSlice.type1_civil}
                  loading={loading}
                  rowTitle={`Year ${selectedYear}`}
                />
              </>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-teal-200/60 border-t-teal-700" />
              </div>
            ) : null}
          </>
        ) : viewMode === "tabular" ? (
          <div className="space-y-6 px-1">
            {loading && !consolidated && !activeSlice ? (
              <div className="flex justify-center py-16">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-teal-200/60 border-t-teal-700" />
              </div>
            ) : null}

            {(yearMode === "all" || yearMode === "range") && consolidated ? (
              <>
                <div className="rounded-3xl border border-teal-200/45 bg-gradient-to-b from-slate-50/60 to-white py-6 text-center shadow-sm ring-1 ring-teal-100/30">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-900/80">
                    {tabularHeroSubtitle}
                  </p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-slate-900 sm:text-4xl">
                    {loading ? "…" : combinedTotal}
                  </p>
                </div>
                <BreakdownTable
                  type2={activeSlice.type2_sessions}
                  type1={activeSlice.type1_civil}
                  caption={tabularMergedCaption}
                />
                {yearsForDetailSections.length > 0 ? (
                  <YearTotalsTable
                    payload={yearTotalsPayload}
                    loading={loading}
                  />
                ) : null}
                {yearsForDetailSections.length > 0 ? (
                  <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">
                      Per-year breakdown
                    </h2>
                    <div className="flex flex-col gap-4">
                      {yearsForDetailSections.map((y) => {
                        const bucket = payload?.byYear?.[String(y)];
                        if (!bucket) return null;
                        return (
                          <BreakdownTable
                            key={y}
                            type2={bucket.type2_sessions}
                            type1={bucket.type1_civil}
                            caption={`Year ${y}`}
                          />
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </>
            ) : yearMode === "single" && selectedYear && activeSlice ? (
              <>
                <div className="rounded-3xl border border-teal-200/45 bg-gradient-to-b from-slate-50/60 to-white py-6 text-center shadow-sm ring-1 ring-teal-100/30">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-900/80">
                    Total for {selectedYear}
                  </p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-slate-900 sm:text-4xl">
                    {loading ? "…" : combinedTotal}
                  </p>
                </div>
                <BreakdownTable
                  type2={activeSlice.type2_sessions}
                  type1={activeSlice.type1_civil}
                  caption={`Year ${selectedYear} (detail)`}
                />
              </>
            ) : !loading ? (
              <p className="py-10 text-center text-sm font-semibold text-slate-400">
                No performance data for tabular view.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
