import React, { useEffect, useMemo, memo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
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
  PERFORMANCE_SLICE_COLORS as SLICE_COLORS,
  DONUT_PIE_PROPS,
  DONUT_CELL_STROKE,
} from "../officerUtils/chartColors.js";

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

function sumLabelMap(obj, labelMap) {
  if (!obj) return 0;
  return Object.keys(labelMap).reduce(
    (s, k) => s + (Number(obj[k]) || 0),
    0,
  );
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
      pctSection: cTot > 0 ? (value / cTot) * 100 : 0,
      pctGrand: (value / g) * 100,
    });
  }
  return { rows, sessionsTotal: sTot, civilTotal: cTot, grandTotal: grand };
}

const tableTh =
  "border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-600 whitespace-nowrap";
const tableTd =
  "border-b border-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-800 tabular-nums";

function BreakdownTable({ type2, type1, caption }) {
  const { rows, sessionsTotal, civilTotal, grandTotal } = buildTabularRows(
    type2,
    type1,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-teal-200/50 bg-white shadow-[0_12px_40px_-20px_rgba(13,148,136,0.2)] ring-1 ring-teal-100/40">
      {caption ? (
        <div className="border-b border-teal-100/80 bg-gradient-to-r from-teal-50 via-cyan-50/80 to-teal-50/40 px-4 py-3">
          <h3 className="text-sm font-black text-slate-900">{caption}</h3>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5">
            Sessions total: {sessionsTotal} · Civil total: {civilTotal} ·
            Combined: {grandTotal}
          </p>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className={tableTh}>Section</th>
              <th className={tableTh}>Category</th>
              <th className={tableTh}>Count</th>
              <th className={tableTh}>% of section</th>
              <th className={tableTh}>% of combined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-slate-50/80">
                <td className={tableTd}>{r.section}</td>
                <td className={`${tableTd} font-bold text-slate-900`}>
                  {r.label}
                </td>
                <td className={tableTd}>{r.value}</td>
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
    glow: "shadow-[0_22px_60px_-18px_rgba(245,158,11,0.35)]",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25",
    blob: "bg-amber-400/30",
    blob2: "bg-orange-400/20",
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
  yearKey,
  activeSlice,
  combinedTotal,
  loading,
}) {
  const bundle = useMemo(() => {
    if (!consolidated || !activeSlice) return null;
    const scopeLabel =
      yearKey === "all" ? "All years (consolidated)" : `Year ${yearKey}`;
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
    return { scopeLabel, scoped, allTime };
  }, [payload, consolidated, yearKey, activeSlice]);

  if (loading && !bundle) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-teal-200/50 bg-gradient-to-br from-teal-50/90 via-white to-violet-50/80 px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,0.2),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(167,139,250,0.18),transparent_45%)]" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 to-violet-500 opacity-40 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full border-[3px] border-teal-200/80 border-t-teal-600 border-l-violet-500 animate-spin" />
            <Zap className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-teal-600" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-teal-800/80">
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

  const { scopeLabel, scoped, allTime } = bundle;
  const top = scoped.topCategory;
  const peak = allTime.peakYear;

  const rankRing = [
    "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.45)]",
    "bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-md",
    "bg-gradient-to-br from-amber-800 via-orange-700 to-amber-900 text-amber-100 shadow-md",
  ];

  return (
    <div className="relative space-y-6 overflow-hidden rounded-3xl border border-teal-200/40 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4 sm:p-6 shadow-[0_25px_80px_-30px_rgba(13,148,136,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,rgba(45,212,191,0.12),transparent),radial-gradient(ellipse_80%_60%_at_100%_100%,rgba(139,92,246,0.1),transparent)]" />
      <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-gradient-to-br from-teal-400/15 to-cyan-300/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 text-white shadow-lg shadow-teal-500/35">
            <Sparkles className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-800 via-emerald-700 to-violet-700 sm:text-xl">
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
          {yearKey !== "all" && peak ? (
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
              <p className="text-4xl font-black tabular-nums tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 sm:text-5xl">
                {peak.year}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/80 px-2.5 py-0.5 text-xs font-black text-teal-900">
                  <Zap className="h-3.5 w-3.5" />
                  {peak.total.toLocaleString()} disposals
                </span>
                {allTime.grand > 0 ? (
                  <span className="text-xs font-bold text-teal-700/90">
                    {((peak.total / allTime.grand) * 100).toFixed(1)}% of
                    all-time
                  </span>
                ) : null}
              </p>
              {allTime.peakYearTopCategory ? (
                <div className="mt-4 rounded-2xl border border-teal-100/80 bg-gradient-to-r from-teal-50/90 to-cyan-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-teal-700/80">
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
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-400 shadow-sm transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, scoped.sessionsPct))}%` }}
                title="Sessions"
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 shadow-sm transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, scoped.civilPct))}%` }}
                title="Civil"
              />
            </div>
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
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
                <Calendar className="h-5 w-5 text-amber-600" />
                <p className="text-lg font-black text-slate-900">
                  {allTime.yearSpan.min}
                  <span className="mx-1 text-amber-500">→</span>
                  {allTime.yearSpan.max}
                </p>
                <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-black text-amber-900">
                  {allTime.yearStats.length} rows
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Avg per active year:{" "}
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-600 tabular-nums text-lg">
                  {allTime.avgPerYear.toLocaleString()}
                </span>
              </p>
              {allTime.quietYear &&
              allTime.peakYear &&
              allTime.quietYear.total < allTime.peakYear.total ? (
                <p className="mt-3 rounded-xl border border-amber-100/90 bg-amber-50/50 px-3 py-2 text-xs font-semibold text-amber-900/90">
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

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-[1px] shadow-[0_16px_40px_-12px_rgba(13,148,136,0.5)]">
        <div className="flex flex-col items-center justify-center gap-1 rounded-[14px] bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 px-6 py-5 text-center sm:flex-row sm:gap-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(45,212,191,0.15),transparent_55%)]" />
          <p className="relative text-[10px] font-black uppercase tracking-[0.25em] text-teal-300/90">
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
    <div className="overflow-hidden rounded-2xl border border-indigo-200/50 bg-white shadow-[0_12px_40px_-20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-100/40">
      <div className="border-b border-indigo-100/80 bg-gradient-to-r from-indigo-50 via-violet-50/70 to-indigo-50/30 px-4 py-3">
        <h3 className="text-sm font-black text-slate-900">Year-wise totals</h3>
        <p className="mt-0.5 text-[11px] font-bold text-slate-500">
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
              <tr key={r.year} className="hover:bg-slate-50/80">
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
        <p className="mt-2 text-2xl font-black tabular-nums text-teal-800">
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
              <div className="h-10 w-10 rounded-full border-[3px] border-teal-500/30 border-t-teal-600 animate-spin" />
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
    <div className="rounded-3xl border border-teal-200/50 bg-gradient-to-br from-white via-teal-50/20 to-slate-50/40 p-4 shadow-[0_20px_50px_-28px_rgba(13,148,136,0.18)] ring-1 ring-teal-100/30 sm:p-5">
      {rowTitle ? (
        <div className="mb-4 pb-3 border-b border-teal-100">
          <h3 className="text-base font-black text-slate-900">{rowTitle}</h3>
        </div>
      ) : null}

      {empty ? (
        <p className="text-sm font-semibold text-slate-400 text-center py-8">
          No session or civil disposals for this period.
        </p>
      ) : (
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
          accent="ring-1 ring-cyan-200/80 border-cyan-100"
          labelMap={CIVIL_LABELS}
          dataObj={type1}
          loading={loading}
        />
      </div>
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

export default function PerformanceTab({ pfNoFromProfile }) {
  const [personalNo, setPersonalNo] = useState("");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [yearKey, setYearKey] = useState("all");
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
          setYearKey("all");
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

  const activeSlice = useMemo(() => {
    if (!payload || !consolidated) return null;
    if (yearKey === "all") return consolidated;
    const y = payload.byYear?.[String(yearKey)];
    if (!y) return consolidated;
    return {
      type2_sessions: y.type2_sessions,
      type1_civil: y.type1_civil,
    };
  }, [payload, yearKey, consolidated]);

  const yearOptions = useMemo(
    () =>
      payload?.years?.length
        ? [...payload.years].sort((a, b) => b - a)
        : [],
    [payload],
  );

  const combinedTotal = useMemo(() => {
    if (!activeSlice) return 0;
    return (
      sumLabelMap(activeSlice.type2_sessions, SESSIONS_LABELS) +
      sumLabelMap(activeSlice.type1_civil, CIVIL_LABELS)
    );
  }, [activeSlice]);

  const viewBtnBase =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all duration-200";
  const viewBtnInactive =
    "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-sm";
  const viewBtnActive =
    "bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-[0_10px_28px_-8px_rgba(13,148,136,0.55)] ring-2 ring-teal-300/50";

  return (
    <div className="space-y-8 min-w-[320px]">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-100/90 via-white to-teal-50/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_40px_-24px_rgba(15,118,110,0.25)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pl-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            View
          </span>
          <div className="flex flex-wrap gap-1 sm:ml-1">
            <button
              type="button"
              onClick={() => setViewMode("charts")}
              className={[
                viewBtnBase,
                viewMode === "charts" ? viewBtnActive : viewBtnInactive,
              ].join(" ")}
            >
              <PieChartIcon className="h-4 w-4 opacity-90" strokeWidth={2.25} />
              Charts
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tabular")}
              className={[
                viewBtnBase,
                viewMode === "tabular" ? viewBtnActive : viewBtnInactive,
              ].join(" ")}
            >
              <LayoutGrid className="h-4 w-4 opacity-90" strokeWidth={2.25} />
              Tabular
            </button>
            <button
              type="button"
              onClick={() => setViewMode("insights")}
              className={[
                viewBtnBase,
                viewMode === "insights" ? viewBtnActive : viewBtnInactive,
              ].join(" ")}
            >
              <Sparkles className="h-4 w-4 opacity-90" strokeWidth={2.25} />
              Insights
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/40 px-3 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <span className="flex items-center gap-2 pl-1 text-[10px] font-black uppercase tracking-widest text-indigo-800/70">
          <Calendar className="h-3.5 w-3.5" />
          Year
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setYearKey("all")}
            disabled={!payload || loading}
            className={[
              "rounded-xl px-4 py-2 text-xs font-black transition-all duration-200",
              yearKey === "all"
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-[0_8px_24px_-8px_rgba(13,148,136,0.45)] ring-2 ring-teal-200/70"
                : "border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm hover:border-teal-200 hover:bg-teal-50/50",
            ].join(" ")}
          >
            All years
          </button>
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYearKey(String(y))}
              disabled={!payload || loading}
              className={[
                "rounded-xl px-4 py-2 text-xs font-black transition-all duration-200",
                yearKey === String(y)
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.45)] ring-2 ring-violet-200/70"
                  : "border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm hover:border-violet-200 hover:bg-violet-50/40",
              ].join(" ")}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50 to-orange-50/50 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(225,29,72,0.25)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-300/20 blur-2xl" />
          <p className="relative text-sm font-bold text-rose-900">{error}</p>
        </div>
      ) : null}

      {viewMode === "insights" ? (
        <PerformanceInsightsPanel
          payload={payload}
          consolidated={consolidated}
          yearKey={yearKey}
          activeSlice={activeSlice}
          combinedTotal={combinedTotal}
          loading={loading}
        />
      ) : viewMode === "charts" ? (
        <>
          {yearKey === "all" && consolidated ? (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-teal-200/50 bg-gradient-to-br from-white via-teal-50/40 to-cyan-50/30 px-6 py-8 text-center shadow-[0_20px_50px_-28px_rgba(13,148,136,0.35)]">
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-teal-400/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
                <p className="relative text-[11px] font-black uppercase tracking-[0.28em] text-teal-800/75">
                  Total disposals
                </p>
                <p className="relative mt-2 text-4xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-emerald-600 to-indigo-600 drop-shadow-sm sm:text-5xl sm:leading-none">
                  {loading ? "…" : combinedTotal}
                </p>
              </div>

              <section className="space-y-2">
                <h2 className="inline-flex items-center gap-3 px-1 text-sm font-black uppercase tracking-widest text-slate-500">
                  <span className="h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-teal-400 to-teal-500/80" />
                  Consolidated — all years
                  <span className="h-0.5 w-8 rounded-full bg-gradient-to-l from-transparent via-teal-400 to-teal-500/80" />
                </h2>
                <SessionsCivilRow
                  type2={consolidated.type2_sessions}
                  type1={consolidated.type1_civil}
                  loading={loading}
                  rowTitle={null}
                />
              </section>

              {yearOptions.length > 0 ? (
                <section className="space-y-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">
                    Year-wise
                  </h2>
                  <div className="flex flex-col gap-6">
                    {yearOptions.map((y) => {
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
          ) : activeSlice ? (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-indigo-50/30 px-6 py-8 text-center shadow-[0_20px_50px_-28px_rgba(99,102,241,0.3)]">
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl" />
                <p className="relative text-[11px] font-black uppercase tracking-[0.28em] text-indigo-800/75">
                  Total for {yearKey}
                </p>
                <p className="relative mt-2 text-4xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 sm:text-5xl sm:leading-none">
                  {loading ? "…" : combinedTotal}
                </p>
              </div>
              <SessionsCivilRow
                type2={activeSlice.type2_sessions}
                type1={activeSlice.type1_civil}
                loading={loading}
                rowTitle={`Year ${yearKey}`}
              />
            </>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <div className="h-12 w-12 rounded-full border-[3px] border-teal-500/30 border-t-teal-600 animate-spin" />
            </div>
          ) : null}
        </>
      ) : viewMode === "tabular" ? (
        <div className="space-y-6 px-1">
          {loading && !consolidated && !activeSlice ? (
            <div className="flex justify-center py-16">
              <div className="h-12 w-12 rounded-full border-[3px] border-teal-500/30 border-t-teal-600 animate-spin" />
            </div>
          ) : null}

          {yearKey === "all" && consolidated ? (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-teal-200/50 bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/40 py-6 text-center shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(45,212,191,0.12),transparent_60%)]" />
                <p className="relative text-[11px] font-black uppercase tracking-[0.25em] text-teal-800/75">
                  Combined total (all years)
                </p>
                <p className="relative mt-1 text-3xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 sm:text-4xl">
                  {loading ? "…" : combinedTotal}
                </p>
              </div>
              <BreakdownTable
                type2={consolidated.type2_sessions}
                type1={consolidated.type1_civil}
                caption="Consolidated — all years (detail)"
              />
              {yearOptions.length > 0 ? (
                <YearTotalsTable payload={payload} loading={loading} />
              ) : null}
              {yearOptions.length > 0 ? (
                <section className="space-y-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
                    Per-year breakdown
                  </h2>
                  <div className="flex flex-col gap-4">
                    {yearOptions.map((y) => {
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
          ) : activeSlice ? (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/40 py-6 text-center shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(167,139,250,0.12),transparent_60%)]" />
                <p className="relative text-[11px] font-black uppercase tracking-[0.25em] text-indigo-800/75">
                  Total for {yearKey}
                </p>
                <p className="relative mt-1 text-3xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 sm:text-4xl">
                  {loading ? "…" : combinedTotal}
                </p>
              </div>
              <BreakdownTable
                type2={activeSlice.type2_sessions}
                type1={activeSlice.type1_civil}
                caption={`Year ${yearKey} (detail)`}
              />
            </>
          ) : !loading ? (
            <p className="text-center text-sm font-semibold text-slate-400 py-10">
              No performance data for tabular view.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
