import React, { useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  ArrowRightLeft,
  Target,
  Scale,
  TrendingUp,
  Sparkles,
  Zap,
  Compass,
} from "lucide-react";
import {
  safeText,
  parseDateSafe,
  daysBetween,
  fmtYMDLong,
  fmtCalendarSpan,
} from "../officerUtils/officerFormat.js";
import {
  PERFORMANCE_SLICE_COLORS,
  DONUT_PIE_PROPS,
  DONUT_CELL_STROKE,
} from "../officerUtils/chartColors.js";

/** Extra space so slice labels are not clipped by the SVG viewBox */
const PIE_CHART_MARGIN = { top: 40, right: 68, bottom: 40, left: 68 };
/** Slightly smaller donut when designation titles are long */
const DONUT_LONG_NAME = {
  ...DONUT_PIE_PROPS,
  innerRadius: "44%",
  outerRadius: "62%",
};

function pieSliceLabel({ name, percent }) {
  const p = (percent * 100).toFixed(0);
  const s = String(name ?? "").trim();
  if (!s) return `${p}%`;
  const short = s.length > 14 ? `${s.slice(0, 12)}…` : s;
  return `${short} ${p}%`;
}
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/* -------------------------- small UI components --------------------------- */
const Chip = ({ children, tone = "light" }) => (
  <span
    className={[
      "px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-sm backdrop-blur-sm",
      tone === "dark"
        ? "bg-white/20 text-white border-white/25 shadow-white/10"
        : "bg-white/95 text-slate-800 border-slate-200/80 ring-1 ring-white/60 shadow-[0_4px_14px_-6px_rgba(15,118,110,0.12)]",
    ].join(" ")}
  >
    {children}
  </span>
);

const StatTile = ({
  title,
  value,
  subtitle,
  active = false,
  onClick,
  tone = "emerald",
}) => {
  const toneCls =
    tone === "violet"
      ? active
        ? "from-violet-700 to-fuchsia-600 text-white border-violet-300/30"
        : "from-violet-50 to-fuchsia-50 text-slate-900 border-violet-200/70"
      : tone === "amber"
        ? active
          ? "from-amber-600 to-orange-600 text-white border-amber-300/30"
          : "from-amber-50 to-orange-50 text-slate-900 border-amber-200/70"
        : active
          ? "from-emerald-700 to-sky-600 text-white border-emerald-300/30"
          : "from-emerald-50 to-sky-50 text-slate-900 border-emerald-200/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-3xl border px-4 py-4 bg-gradient-to-br transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_48px_-22px_rgba(13,148,136,0.22)]",
        active
          ? "shadow-[0_18px_44px_-20px_rgba(13,148,136,0.32)] ring-2 ring-teal-300/50 ring-offset-2 ring-offset-white scale-[1.02]"
          : "shadow-md shadow-slate-200/50",
        toneCls,
      ].join(" ")}
    >
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-80">
        {title}
      </div>
      <div className="mt-1 text-[24px] font-black leading-none">{value}</div>
      <div className="mt-2 text-[11px] font-bold opacity-85">{subtitle}</div>
    </button>
  );
};

const SectionCard = ({ title, subtitle, rightLabel, children }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-teal-200/45 bg-white shadow-[0_22px_60px_-28px_rgba(13,148,136,0.22)] ring-1 ring-teal-100/35 transition-all duration-300 hover:shadow-[0_28px_72px_-32px_rgba(13,148,136,0.3)] hover:-translate-y-0.5">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-800 to-cyan-900 p-4 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_100%_-20%,rgba(45,212,191,0.25),transparent_50%),radial-gradient(ellipse_80%_60%_at_0%_100%,rgba(167,139,250,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-black tracking-tight text-white drop-shadow-sm sm:text-[17px]">
            {title}
          </div>
          <div className="mt-1 max-w-xl text-[11px] font-semibold leading-snug text-teal-100/95">
            {subtitle}
          </div>
        </div>
        {rightLabel ? (
          <span className="shrink-0 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] backdrop-blur-md">
            {rightLabel}
          </span>
        ) : null}
      </div>
    </div>
    <div className="relative bg-gradient-to-b from-slate-50/50 via-white to-white p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(45,212,191,0.04),transparent_55%)]" />
      <div className="relative">{children}</div>
    </div>
  </div>
);

const Select = ({ value, onChange, options = [] }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-[13px] font-bold text-slate-800 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] outline-none ring-1 ring-slate-100/80 transition focus:border-teal-300 focus:ring-2 focus:ring-teal-400/35"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

/* --------------------------- normalize helpers ---------------------------- */
/** Defaults when posting rows do not include designation-based limits from ERP. */
const DEFAULT_SHORT_POSTING_MAX_DAYS = 60;
const DEFAULT_MATURE_POSTING_MIN_DAYS = 548;

/**
 * Reads optional limits joined from DESIGNATION (or similar) on each posting row.
 * Add whichever columns your API exposes — first positive number wins.
 * @see ERP DESIGNATION / posting-history payload
 */
function firstPositiveNumber(...vals) {
  for (const v of vals) {
    const n = Number(String(v ?? "").replace(/,/g, "").trim());
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function getMaturePostingMinDaysFromRow(r) {
  return (
    firstPositiveNumber(
      r.MATUREPERIOD,
      r.MATURE_POSTING_MIN_DAYS,
      r.MATURITY_POSTING_MIN_DAYS,
      r.MATURE_MIN_DAYS,
      r.MIN_MATURITY_DAYS,
      r.TRUE_STAY_MIN_DAYS,
      r.MATURE_POSTING_DAYS,
      r.DESIGNATION_MATURE_DAYS,
      r.DESIG_MATURE_DAYS,
      r.POSTING_MATURITY_DAYS,
      r.TENURE_MATURITY_MIN,
      r.MATURITY_DAYS,
      r.MIN_DAYS_FOR_MATURE_POSTING,
    ) ?? DEFAULT_MATURE_POSTING_MIN_DAYS
  );
}

function getShortPostingMaxDaysFromRow(r) {
  return (
    firstPositiveNumber(
      r.SHORTPERIOD,
      r.SHORT_POSTING_MAX_DAYS,
      r.MAX_SHORT_POSTING_DAYS,
      r.SHORT_STAY_MAX_DAYS,
      r.MOBILITY_MAX_DAYS,
      r.SHORT_POSTING_DAYS,
    ) ?? DEFAULT_SHORT_POSTING_MAX_DAYS
  );
}

/** Ensure short and mature bands do not overlap; fall back to defaults if bad data. */
function effectiveStayThresholds(r) {
  let matureMin = getMaturePostingMinDaysFromRow(r);
  let shortMax = getShortPostingMaxDaysFromRow(r);
  if (shortMax >= matureMin) {
    shortMax = DEFAULT_SHORT_POSTING_MAX_DAYS;
    matureMin = DEFAULT_MATURE_POSTING_MIN_DAYS;
  }
  return { matureMin, shortMax };
}

function buildStayThresholdSubtitle(rows) {
  const list = rows || [];
  if (!list.length) {
    return "Short posting and mature posting use default day limits until designation thresholds are present on posting rows.";
  }
  const shorts = [...new Set(list.map((r) => r._shortMaxDays))].sort(
    (a, b) => a - b,
  );
  const matures = [...new Set(list.map((r) => r._matureMinDays))].sort(
    (a, b) => a - b,
  );
  const shortPart =
    shorts.length === 1
      ? `under ${shorts[0]} days (${fmtYMDLong(shorts[0])})`
      : `under ${shorts[0]}–${shorts[shorts.length - 1]} days (by designation / row)`;
  const maturePart =
    matures.length === 1
      ? `over ${matures[0]} days (${fmtYMDLong(matures[0])})`
      : `over ${matures[0]}–${matures[matures.length - 1]} days (by designation / row)`;
  return `Short posting is ${shortPart}; mature posting is ${maturePart}.`;
}

const getCadre = (r) =>
  r.CADRENAME ||
  r.CADREDESC ||
  r.CADRE_DESC ||
  r.CADRE ||
  r.SERVICECADRE ||
  "Unknown";

const getDistrict = (r) =>
  r.DISTRICTNAME || r.DISTRICT || r.POSTDISTRICT || "Unknown";

const getTehsil = (r) =>
  r.TEHSILNAME || r.TEHSIL || r.TEHNAME || r.SUBDIVNAME || "Unknown";

const getDesignation = (r) => r.DESIGNATIONDESC || r.DESIGNATION || "Unknown";

const getExCadreValue = (r) =>
  r.ex_cader_Court ||
  r.EX_CADER_COURT ||
  r.EX_CADRE_COURT ||
  r.EXCADRECOURT ||
  r.EX_CADRE ||
  "Unknown";

const getPostingBucket = (r) => {
  const val = safeText(getExCadreValue(r));
  return val === "OTHER COURTS" ? "In Field" : "Ex-Cadre";
};

const normalizePostingRows = (rows) => {
  const ordered = (rows || []).map((r) => ({
    r,
    from: parseDateSafe(r.FDATE || r.DATEOFPOSTING),
  }));
  ordered.sort(
    (a, b) => (a.from?.getTime?.() || 0) - (b.from?.getTime?.() || 0),
  );

  const list = ordered.map((item, i) => {
    const r = item.r;
    const from = item.from;
    const explicitTo = parseDateSafe(r.TDATE);
    const to =
      explicitTo ?? ordered[i + 1]?.from ?? new Date();
    const durationDays = daysBetween(from, to);
    const { matureMin, shortMax } = effectiveStayThresholds(r);

    return {
      ...r,
      _from: from,
      _to: to,
      _durationDays: durationDays,
      _cadre: getCadre(r),
      _district: getDistrict(r),
      _tehsil: getTehsil(r),
      _designation: getDesignation(r),
      _exCadreValue: safeText(getExCadreValue(r)),
      _bucket: getPostingBucket(r),
      _matureMinDays: matureMin,
      _shortMaxDays: shortMax,
      _isShortStay: durationDays < shortMax,
      _isTrueStay: durationDays > matureMin,
    };
  });

  return list;
};

/**
 * Career window: earliest posting start → latest row end.
 * Use this for "years of service" style metrics. Summing per-row durations
 * inflates totals when history has overlapping rows or multiple open-ended TDATEs.
 */
function getCareerCalendarBounds(rows) {
  const list = (rows || []).filter((r) => r._from && r._to);
  if (!list.length) return { start: null, end: null, days: 0 };
  let minT = list[0]._from.getTime();
  let maxT = list[0]._to.getTime();
  for (let i = 1; i < list.length; i++) {
    const r = list[i];
    minT = Math.min(minT, r._from.getTime());
    maxT = Math.max(maxT, r._to.getTime());
  }
  const start = new Date(minT);
  const end = new Date(maxT);
  return { start, end, days: daysBetween(start, end) };
}

/* ------------------------------ analytics -------------------------------- */
const groupRows = (rows, keyFn) => {
  const map = {};
  for (const r of rows || []) {
    const key = safeText(keyFn(r));
    if (!map[key]) map[key] = [];
    map[key].push(r);
  }
  return map;
};

const summarizeRows = (label, rows) => {
  const count = rows.length;
  const totalDays = rows.reduce(
    (sum, r) => sum + Number(r._durationDays || 0),
    0,
  );
  const avgDays = count ? Math.round(totalDays / count) : 0;
  const shortCount = rows.filter((r) => r._isShortStay).length;
  const trueCount = rows.filter((r) => r._isTrueStay).length;

  return {
    label,
    count,
    totalDays,
    avgDays,
    shortCount,
    trueCount,
    rows,
  };
};

const getMaxStayRow = (rows = []) => {
  if (!rows.length) return null;
  return [...rows].sort(
    (a, b) => (b._durationDays || 0) - (a._durationDays || 0),
  )[0];
};

const getMinStayRow = (rows = []) => {
  if (!rows.length) return null;
  return [...rows].sort(
    (a, b) => (a._durationDays || 0) - (b._durationDays || 0),
  )[0];
};

const filterByBucket = (rows, bucket) => {
  if (bucket === "All") return rows;
  return (rows || []).filter((r) => r._bucket === bucket);
};

const buildBucketSummary = (rows) => {
  const groups = groupRows(rows, (r) => r._bucket);
  return ["In Field", "Ex-Cadre"].map((k) => summarizeRows(k, groups[k] || []));
};

const buildDistrictStaySummary = (rows, bucket) => {
  const filtered = filterByBucket(rows, bucket).filter(
    (r) => safeText(r._district) && safeText(r._district) !== "Unknown",
  );

  const groups = groupRows(filtered, (r) => r._district);

  return Object.entries(groups)
    .map(([district, g]) => {
      const totalDays = g.reduce(
        (sum, r) => sum + Number(r._durationDays || 0),
        0,
      );
      const avgDays = g.length ? Math.round(totalDays / g.length) : 0;
      const maxRow = getMaxStayRow(g);
      const minRow = getMinStayRow(g);

      return {
        district,
        count: g.length,
        totalDays,
        avgDays,
        maxDays: maxRow?._durationDays || 0,
        minDays: minRow?._durationDays || 0,
      };
    })
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 10);
};

const buildDesignationDistribution = (rows, bucket) => {
  const filtered = filterByBucket(rows, bucket);
  const groups = groupRows(filtered, (r) => r._designation);
  return Object.entries(groups)
    .map(([k, g]) => summarizeRows(k, g))
    .sort((a, b) => b.count - a.count || b.totalDays - a.totalDays);
};

const buildStayTypePie = (rows, bucket) => {
  const filtered = filterByBucket(rows, bucket);

  const shortRows = filtered.filter((r) => r._isShortStay);
  const trueRows = filtered.filter((r) => r._isTrueStay);

  const shortMax = getMaxStayRow(shortRows);
  const shortMin = getMinStayRow(shortRows);
  const trueMax = getMaxStayRow(trueRows);
  const trueMin = getMinStayRow(trueRows);

  return [
    {
      label: "Short posting",
      count: shortRows.length,
      totalDays: shortRows.reduce(
        (sum, r) => sum + Number(r._durationDays || 0),
        0,
      ),
      avgDays: shortRows.length
        ? Math.round(
            shortRows.reduce(
              (sum, r) => sum + Number(r._durationDays || 0),
              0,
            ) / shortRows.length,
          )
        : 0,
      maxDays: shortMax?._durationDays || 0,
      minDays: shortMin?._durationDays || 0,
      maxDistrict: shortMax?._district || "—",
      minDistrict: shortMin?._district || "—",
    },
    {
      label: "Mature posting",
      count: trueRows.length,
      totalDays: trueRows.reduce(
        (sum, r) => sum + Number(r._durationDays || 0),
        0,
      ),
      avgDays: trueRows.length
        ? Math.round(
            trueRows.reduce((sum, r) => sum + Number(r._durationDays || 0), 0) /
              trueRows.length,
          )
        : 0,
      maxDays: trueMax?._durationDays || 0,
      minDays: trueMin?._durationDays || 0,
      maxDistrict: trueMax?._district || "—",
      minDistrict: trueMin?._district || "—",
    },
  ];
};

const buildDistrictDesignationStayPie = (rows, bucket, district) => {
  const filtered = filterByBucket(rows, bucket).filter((r) =>
    district === "All" ? true : safeText(r._district) === safeText(district),
  );

  const groups = groupRows(filtered, (r) => r._designation);

  return Object.entries(groups)
    .map(([k, g]) => ({
      label: k,
      totalDays: g.reduce((sum, r) => sum + Number(r._durationDays || 0), 0),
      count: g.length,
      avgDays: g.length
        ? Math.round(
            g.reduce((sum, r) => sum + Number(r._durationDays || 0), 0) /
              g.length,
          )
        : 0,
    }))
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 8);
};

/* -------------------------------- charts --------------------------------- */
const PIE_COLORS = PERFORMANCE_SLICE_COLORS;

const BUCKET_COLORS = {
  "In Field": PERFORMANCE_SLICE_COLORS[0],
  "Ex-Cadre": PERFORMANCE_SLICE_COLORS[3],
};

const STAY_TYPE_COLORS = {
  "Short posting": PERFORMANCE_SLICE_COLORS[7],
  "Mature posting": PERFORMANCE_SLICE_COLORS[2],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/98 px-3 py-2.5 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.2)] backdrop-blur-md ring-1 ring-white/80">
      {label ? (
        <div className="text-[12px] font-black text-slate-900">{label}</div>
      ) : null}
      <div className="mt-1.5 space-y-1">
        {payload.map((p, idx) => {
          const v = p.value;
          const isDays =
            typeof v === "number" &&
            (p.dataKey === "totalDays" || String(p.name || "").includes("Days"));
          const display =
            isDays && typeof v === "number" ? `${v} d (${fmtYMDLong(v)})` : v;
          return (
            <div key={idx} className="text-[11px] font-bold text-slate-700">
              {p.name}:{" "}
              <span className="font-black text-slate-950">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const postingInsightTone = {
  teal: {
    border: "from-emerald-400 via-teal-500 to-cyan-400",
    glow: "shadow-[0_18px_50px_-20px_rgba(20,184,166,0.35)]",
    iconBg: "bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-teal-500/25",
    blob: "bg-teal-400/25",
    blob2: "bg-cyan-300/15",
  },
  violet: {
    border: "from-violet-400 via-fuchsia-500 to-purple-500",
    glow: "shadow-[0_18px_50px_-20px_rgba(139,92,246,0.32)]",
    iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25",
    blob: "bg-violet-400/20",
    blob2: "bg-fuchsia-300/15",
  },
  amber: {
    border: "from-amber-400 via-orange-500 to-rose-400",
    glow: "shadow-[0_18px_50px_-20px_rgba(245,158,11,0.28)]",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20",
    blob: "bg-amber-400/25",
    blob2: "bg-orange-300/15",
  },
  slate: {
    border: "from-slate-300 via-slate-400 to-slate-500",
    glow: "shadow-[0_14px_40px_-18px_rgba(15,23,42,0.12)]",
    iconBg: "bg-gradient-to-br from-slate-600 to-slate-800 shadow-md",
    blob: "bg-slate-300/20",
    blob2: "bg-slate-400/10",
  },
};

const InsightCallout = ({ icon: Icon, tone, title, body, hint }) => {
  const t = postingInsightTone[tone] || postingInsightTone.slate;
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${t.border} p-[1.5px] ${t.glow} transition-transform duration-300 hover:scale-[1.01]`}
    >
      <div className="relative h-full overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-white to-slate-50/90 ring-1 ring-white/70">
        <div
          className={`pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full ${t.blob} blur-2xl`}
        />
        <div
          className={`pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full ${t.blob2} blur-3xl`}
        />
        <div className="relative flex items-start gap-3 p-4 sm:p-5">
          <div
            className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white ${t.iconBg}`}
          >
            <Icon size={20} strokeWidth={2.35} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              {title}
            </div>
            <div className="mt-2 text-sm font-bold leading-snug text-slate-900">
              {body}
            </div>
            {hint ? (
              <div className="mt-3 rounded-xl border border-slate-100/90 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold leading-snug text-slate-600">
                {hint}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Action-oriented signals derived from filtered posting rows. */
const DecisionInsights = ({ rows, bucket }) => {
  const filtered = useMemo(() => filterByBucket(rows, bucket), [rows, bucket]);
  const insights = useMemo(() => {
    const n = filtered.length;
    if (!n)
      return {
        topDistrict: null,
        topDesig: null,
        shortPct: 0,
        truePct: 0,
        inFieldShare: 0,
        careerBounds: { start: null, end: null, days: 0 },
      };

    const short = filtered.filter((r) => r._isShortStay).length;
    const tru = filtered.filter((r) => r._isTrueStay).length;
    const careerBounds = getCareerCalendarBounds(filtered);

    const distMap = groupRows(filtered, (r) => r._district);
    let topDistrict = null;
    let maxD = 0;
    for (const [d, g] of Object.entries(distMap)) {
      const td = g.reduce((s, r) => s + (r._durationDays || 0), 0);
      if (td > maxD && safeText(d) && d !== "Unknown") {
        maxD = td;
        topDistrict = { name: d, days: td, postings: g.length };
      }
    }

    const desMap = groupRows(filtered, (r) => r._designation);
    let topDesig = null;
    let maxC = 0;
    for (const [dg, g] of Object.entries(desMap)) {
      if (g.length > maxC && safeText(dg) && dg !== "Unknown") {
        maxC = g.length;
        topDesig = { name: dg, count: g.length };
      }
    }

    const inField = filtered.filter((r) => r._bucket === "In Field").length;

    return {
      topDistrict,
      topDesig,
      shortPct: (short / n) * 100,
      truePct: (tru / n) * 100,
      inFieldShare: (inField / n) * 100,
      careerBounds,
      count: n,
    };
  }, [filtered]);

  if (!insights.count) return null;

  const bucketLabel =
    bucket === "All" ? "all postings" : bucket === "In Field" ? "in-field" : "ex-cadre";

  return (
    <SectionCard
      title="Decision-ready insights"
      subtitle="Highlights for posting review, transfer planning, and tenure balance"
      rightLabel={bucket}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {insights.topDistrict ? (
          <InsightCallout
            icon={MapPin}
            tone="teal"
            title="Largest tenure concentration"
            body={`${insights.topDistrict.name} — ${fmtYMDLong(insights.topDistrict.days)} summed days across ${insights.topDistrict.postings} posting row(s).`}
            hint="Sum of segment lengths in this district (same basis as bar charts). Compare with career span below for calendar service length."
          />
        ) : null}

        {insights.topDesig ? (
          <InsightCallout
            icon={Scale}
            tone="violet"
            title="Most frequent role"
            body={`${insights.topDesig.name} — ${insights.topDesig.count} posting record(s).`}
            hint="Shows dominant designation exposure in the selected filter."
          />
        ) : null}

        <InsightCallout
          icon={ArrowRightLeft}
          tone={insights.shortPct > 35 ? "amber" : "slate"}
          title={"Mobility (short postings)"}
          body={`${insights.shortPct.toFixed(0)}% of ${bucketLabel} (${Math.round((insights.shortPct / 100) * insights.count)} records).`}
          hint={
            insights.shortPct > 35
              ? "Elevated short postings — check for rapid transfers or interim postings."
              : "Short postings within a typical range for context."
          }
        />

        <InsightCallout
          icon={Clock}
          tone={insights.truePct > 25 ? "teal" : "slate"}
          title={"Mature postings (tenure by designation)"}
          body={`${insights.truePct.toFixed(0)}% of ${bucketLabel} count as mature postings. Calendar career span in this view: ${fmtCalendarSpan(insights.careerBounds.start, insights.careerBounds.end)}.`}
          hint={
            insights.truePct > 25
              ? "Strong mature postings — useful for depth-of-experience narrative."
              : "Span = earliest start to latest end (not sum of rows), so it matches typical service length."
          }
        />

        {bucket === "All" ? (
          <InsightCallout
            icon={Target}
            tone="violet"
            title="Field vs ex-cadre mix"
            body={`About ${insights.inFieldShare.toFixed(0)}% of records are In Field postings.`}
            hint="Toggle In Field / Ex-Cadre above to drill into each stream."
          />
        ) : null}

        <InsightCallout
          icon={TrendingUp}
          tone="teal"
          title="Career span in view"
          body={`${insights.count} posting row(s). Calendar span ${fmtCalendarSpan(insights.careerBounds.start, insights.careerBounds.end)} (${insights.careerBounds.days.toLocaleString()} days from first start to latest end).`}
          hint="Not the sum of each row’s length — avoids double-count when several rows share open dates or overlap."
        />
      </div>
    </SectionCard>
  );
};

const BucketTiles = ({ rows, activeBucket, onChange }) => {
  const summary = useMemo(() => buildBucketSummary(rows), [rows]);
  const allCount = rows.length || 0;
  const field = summary.find((x) => x.label === "In Field");
  const ex = summary.find((x) => x.label === "Ex-Cadre");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatTile
        title="All Postings"
        value={allCount}
        subtitle="Show complete analysis"
        active={activeBucket === "All"}
        onClick={() => onChange("All")}
        tone="amber"
      />
      <StatTile
        title="In Field"
        value={field?.count || 0}
        subtitle={`Avg ${fmtYMDLong(field?.avgDays || 0)} • district-wise tenure`}
        active={activeBucket === "In Field"}
        onClick={() => onChange("In Field")}
        tone="emerald"
      />
      <StatTile
        title="Ex-Cadre"
        value={ex?.count || 0}
        subtitle={`Avg ${fmtYMDLong(ex?.avgDays || 0)} • ex-cadre-value-wise tenure`}
        active={activeBucket === "Ex-Cadre"}
        onClick={() => onChange("Ex-Cadre")}
        tone="violet"
      />
    </div>
  );
};

const BucketPie = ({ rows }) => {
  const data = useMemo(() => buildBucketSummary(rows), [rows]);

  return (
    <SectionCard
      title="In Field vs Ex-Cadre Split"
      subtitle="Main posting division"
      rightLabel={`${rows.length || 0} Records`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
        <div className="xl:col-span-6 h-[360px] min-h-[280px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={PIE_CHART_MARGIN}>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                {...DONUT_PIE_PROPS}
                label={pieSliceLabel}
                labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      BUCKET_COLORS[entry.label] ||
                      PIE_COLORS[idx % PIE_COLORS.length]
                    }
                    {...DONUT_CELL_STROKE}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-6 space-y-3">
          {data.map((x, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 px-4 py-3.5 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.1)] ring-1 ring-white/80 transition hover:shadow-[0_16px_44px_-18px_rgba(13,148,136,0.15)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-black text-slate-950">
                    {x.label}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>Postings: {x.count}</Chip>
                    <Chip>Avg posting: {fmtYMDLong(x.avgDays || 0)}</Chip>
                    <Chip>Short posting: {x.shortCount}</Chip>
                    <Chip>Mature: {x.trueCount}</Chip>
                  </div>
                </div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black text-white"
                  style={{
                    backgroundColor:
                      BUCKET_COLORS[x.label] ||
                      PIE_COLORS[idx % PIE_COLORS.length],
                  }}
                >
                  {x.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

const StayTypePieChart = ({ rows, bucket }) => {
  const data = useMemo(() => buildStayTypePie(rows, bucket), [rows, bucket]);
  const subtitle = useMemo(() => buildStayThresholdSubtitle(rows), [rows]);

  return (
    <SectionCard
      title="Short posting vs mature posting"
      subtitle={subtitle}
      rightLabel={bucket}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
        <div className="xl:col-span-7 h-[400px] min-h-[300px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={PIE_CHART_MARGIN}>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                {...DONUT_PIE_PROPS}
                label={pieSliceLabel}
                labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      STAY_TYPE_COLORS[entry.label] ||
                      PIE_COLORS[idx % PIE_COLORS.length]
                    }
                    {...DONUT_CELL_STROKE}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-5 space-y-3">
          {data.map((x, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-violet-50/30 px-4 py-3.5 shadow-[0_12px_36px_-18px_rgba(109,40,217,0.12)] ring-1 ring-white/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-black text-slate-950">
                    {x.label}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>Records: {x.count}</Chip>
                    <Chip>Total posting: {fmtYMDLong(x.totalDays || 0)}</Chip>
                    <Chip>Avg posting: {fmtYMDLong(x.avgDays || 0)}</Chip>
                    <Chip>Max: {fmtYMDLong(x.maxDays || 0)}</Chip>
                    <Chip>Min: {fmtYMDLong(x.minDays || 0)}</Chip>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] font-bold text-slate-600">
                    <div>
                      Max posting (district):{" "}
                      <span className="font-black text-slate-900">
                        {x.maxDistrict}
                      </span>
                    </div>
                    <div>
                      Min posting (district):{" "}
                      <span className="font-black text-slate-900">
                        {x.minDistrict}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black text-white"
                  style={{
                    backgroundColor:
                      STAY_TYPE_COLORS[x.label] ||
                      PIE_COLORS[idx % PIE_COLORS.length],
                  }}
                >
                  {x.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

const DistrictWiseStayBarChart = ({ rows, bucket }) => {
  const data = useMemo(
    () => buildDistrictStaySummary(rows, bucket),
    [rows, bucket],
  );

  return (
    <SectionCard
      title="District-wise total posting"
      subtitle="Each bar is cumulative posting tenure in the district (total, average, max, min)"
      rightLabel={`${data.length} Districts`}
    >
      {!data.length ? (
        <div className="rounded-2xl border border-dashed border-cyan-200/80 bg-cyan-50/40 py-12 text-center text-sm font-bold text-slate-500">
          No district data found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7 h-[520px] min-h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 16, right: 26, left: 4, bottom: 82 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="district"
                  angle={-28}
                  textAnchor="end"
                  interval={0}
                  height={86}
                  tick={{ fontSize: 11, fontWeight: 700 }}
                />
                <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="totalDays"
                  name="Total posting (days)"
                  fill="#0284c7"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-5 space-y-3 max-h-[520px] overflow-auto pr-1">
            {data.map((x, idx) => (
              <div
                key={`${x.district}-${idx}`}
                className="rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-white to-cyan-50/35 px-4 py-3.5 shadow-[0_10px_30px_-16px_rgba(8,145,178,0.18)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-black text-slate-900">
                    {x.district}
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black text-white bg-cyan-600">
                    {x.count}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip>Count: {x.count}</Chip>
                  <Chip>Posting (days): {Number(x.totalDays || 0).toLocaleString()}</Chip>
                  <Chip>Total posting: {fmtYMDLong(x.totalDays || 0)}</Chip>
                  <Chip>Avg posting: {fmtYMDLong(x.avgDays || 0)}</Chip>
                  <Chip>Max: {fmtYMDLong(x.maxDays || 0)}</Chip>
                  <Chip>Min: {fmtYMDLong(x.minDays || 0)}</Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
};

const DesignationPieChart = ({ rows, bucket }) => {
  const data = useMemo(
    () => buildDesignationDistribution(rows, bucket).slice(0, 8),
    [rows, bucket],
  );

  return (
    <SectionCard
      title="Designation-wise Distribution"
      subtitle="Overall designation split in selected posting type along with tenure"
      rightLabel={`${data.length} Designations`}
    >
      {!data.length ? (
        <div className="rounded-2xl border border-dashed border-violet-200/80 bg-violet-50/40 py-12 text-center text-sm font-bold text-slate-500">
          No data found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7 h-[520px] min-h-[420px] overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={PIE_CHART_MARGIN}>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  {...DONUT_LONG_NAME}
                  label={pieSliceLabel}
                  labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      {...DONUT_CELL_STROKE}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-5 space-y-3 max-h-[520px] overflow-auto pr-1">
            {data.map((x, idx) => (
              <div
                key={`${x.label}-${idx}`}
                className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white to-violet-50/30 px-4 py-3.5 shadow-[0_10px_30px_-16px_rgba(124,58,237,0.2)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-black text-slate-900">
                    {x.label}
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black text-white"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  >
                    {x.count}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip>Count: {x.count}</Chip>
                  <Chip>Posting (days): {Number(x.totalDays || 0).toLocaleString()}</Chip>
                  <Chip>Posting tenure: {fmtYMDLong(x.totalDays || 0)}</Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
};

const kpiAccentBorder = {
  slate: "from-slate-300 to-slate-500",
  teal: "from-teal-400 to-cyan-500",
  amber: "from-amber-400 to-orange-500",
  violet: "from-violet-400 to-fuchsia-500",
};

const kpiAccentInner = {
  slate: "from-slate-50 via-white to-white",
  teal: "from-teal-50/90 via-cyan-50/40 to-white",
  amber: "from-amber-50/90 via-orange-50/30 to-white",
  violet: "from-violet-50/90 via-fuchsia-50/35 to-white",
};

const KpiCard = ({ label, value, sub, accent = "slate" }) => {
  const b = kpiAccentBorder[accent] || kpiAccentBorder.slate;
  const inner = kpiAccentInner[accent] || kpiAccentInner.slate;
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${b} p-[1px] shadow-[0_14px_40px_-18px_rgba(13,148,136,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-20px_rgba(13,148,136,0.22)]`}
    >
      <div
        className={`h-full rounded-[13px] bg-gradient-to-br ${inner} px-4 py-4 ring-1 ring-white/60`}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </div>
        <div className="mt-2 text-2xl font-black tabular-nums leading-none text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 sm:text-[28px]">
          {value}
        </div>
        {sub ? (
          <div className="mt-2 text-[11px] font-bold text-slate-600">{sub}</div>
        ) : null}
      </div>
    </div>
  );
};

const InsightPanel = ({ rows, bucket }) => {
  const filtered = useMemo(() => filterByBucket(rows, bucket), [rows, bucket]);
  const totalPostings = filtered.length || 0;
  const avgDays = totalPostings
    ? Math.round(
        filtered.reduce((s, r) => s + (r._durationDays || 0), 0) /
          totalPostings,
      )
    : 0;

  const shortCount = filtered.filter((r) => r._isShortStay).length;
  const trueCount = filtered.filter((r) => r._isTrueStay).length;
  const normalCount = totalPostings - shortCount - trueCount;
  const shortPct = totalPostings ? (shortCount / totalPostings) * 100 : 0;
  const truePct = totalPostings ? (trueCount / totalPostings) * 100 : 0;
  const careerBounds = getCareerCalendarBounds(filtered);

  const shortSub = useMemo(() => {
    if (!totalPostings) return "—";
    const u = [...new Set(filtered.map((r) => r._shortMaxDays))].sort(
      (a, b) => a - b,
    );
    if (u.length === 1)
      return `${shortPct.toFixed(0)}% · under ${u[0]} days (${fmtYMDLong(u[0])})`;
    return `${shortPct.toFixed(0)}% · under per-row limits (${u[0]}–${u[u.length - 1]} d)`;
  }, [filtered, shortPct, totalPostings]);

  const matureSub = useMemo(() => {
    if (!totalPostings) return "—";
    const u = [...new Set(filtered.map((r) => r._matureMinDays))].sort(
      (a, b) => a - b,
    );
    if (u.length === 1)
      return `${truePct.toFixed(0)}% · over ${u[0]} days (${fmtYMDLong(u[0])})`;
    return `${truePct.toFixed(0)}% · over per-row limits (${u[0]}–${u[u.length - 1]} d)`;
  }, [filtered, truePct, totalPostings]);

  return (
    <SectionCard
      title="Executive KPIs"
      subtitle="Numbers for the selected scope — compare tenure mix at a glance"
      rightLabel={bucket}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Posting records"
          value={totalPostings}
          sub="Rows in filtered set"
          accent="teal"
        />
        <KpiCard
          label="Avg tenure / posting"
          value={fmtYMDLong(avgDays)}
          sub={`${avgDays.toLocaleString()} days`}
          accent="slate"
        />
        <KpiCard
          label="Short postings"
          value={shortCount}
          sub={shortSub}
          accent="amber"
        />
        <KpiCard
          label="Mature postings"
          value={trueCount}
          sub={matureSub}
          accent="violet"
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-gradient-to-r from-teal-50/90 to-cyan-50/50 px-4 py-2 text-[11px] font-bold text-teal-950 shadow-[0_8px_24px_-10px_rgba(13,148,136,0.25)] ring-1 ring-white/80 backdrop-blur-sm">
          <Clock size={15} className="shrink-0 text-teal-600" strokeWidth={2.25} />
          <span>
            Career span:{" "}
            <span className="font-black text-slate-900">
              {fmtCalendarSpan(careerBounds.start, careerBounds.end)}
            </span>
            <span className="font-semibold text-teal-800/80">
              {" "}
              ({careerBounds.days.toLocaleString()} d)
            </span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-gradient-to-r from-violet-50/90 to-fuchsia-50/40 px-4 py-2 text-[11px] font-bold text-violet-950 shadow-[0_8px_24px_-10px_rgba(139,92,246,0.2)] ring-1 ring-white/80 backdrop-blur-sm">
          <Compass size={15} className="shrink-0 text-violet-600" strokeWidth={2.25} />
          Mid tenure:{" "}
          <span className="font-black text-slate-900">{normalCount}</span>
        </span>
      </div>
    </SectionCard>
  );
};

/* ----------------------------- dashboard only ----------------------------- */
const PostingDashboard = ({ items }) => {
  const [activeBucket, setActiveBucket] = useState("All");
  const careerQuick = useMemo(() => getCareerCalendarBounds(items), [items]);

  return (
    <div className="relative space-y-6 overflow-hidden rounded-[2.5rem] border border-teal-200/45 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/25 p-4 shadow-[0_28px_80px_-38px_rgba(13,148,136,0.32)] ring-1 ring-teal-100/35 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_15%_-15%,rgba(45,212,191,0.14),transparent_52%),radial-gradient(ellipse_70%_45%_at_95%_105%,rgba(167,139,250,0.1),transparent_48%)]" />
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-teal-300/15 to-cyan-200/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 border-b border-teal-100/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 text-white shadow-[0_16px_40px_-12px_rgba(13,148,136,0.5)] ring-2 ring-white/40">
            <Sparkles size={28} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-800 via-emerald-700 to-cyan-700 sm:text-2xl">
              Posting analytics
            </h2>
            <p className="mt-1 max-w-2xl text-xs font-semibold leading-relaxed text-slate-600 sm:text-sm">
              Filter by scope, scan decision-ready insights and KPIs, then drill
              into charts for districts and designations.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-teal-900 shadow-[0_10px_30px_-12px_rgba(13,148,136,0.3)] backdrop-blur-md">
            <TrendingUp size={14} className="text-teal-600" strokeWidth={2.5} />
            {items.length} postings
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100/90 bg-gradient-to-r from-indigo-50/90 to-violet-50/50 px-4 py-2 text-[11px] font-bold text-indigo-950 shadow-md backdrop-blur-sm">
            <MapPin size={14} className="text-violet-600" strokeWidth={2.25} />
            Span {fmtCalendarSpan(careerQuick.start, careerQuick.end)}
          </span>
        </div>
      </div>

      <SectionCard
        title="Analysis scope"
        subtitle="Filter every chart and KPI below — All, In Field, or Ex-Cadre"
        rightLabel={`${items.length || 0} records`}
      >
        <BucketTiles
          rows={items}
          activeBucket={activeBucket}
          onChange={setActiveBucket}
        />
      </SectionCard>

      <DecisionInsights rows={items} bucket={activeBucket} />
      <InsightPanel rows={items} bucket={activeBucket} />
      <BucketPie rows={items} />

      <StayTypePieChart rows={items} bucket={activeBucket} />
      <DistrictWiseStayBarChart rows={items} bucket={activeBucket} />

      <DesignationPieChart rows={items} bucket={activeBucket} />
    </div>
  );
};

export default function PostingTransfersTab({ historyRows, historyLoading }) {
  const items = useMemo(() => normalizePostingRows(historyRows), [historyRows]);

  if (historyLoading) {
    return (
      <div className="relative overflow-hidden rounded-[2.5rem] border border-teal-200/50 bg-gradient-to-br from-teal-50/90 via-white to-violet-50/40 p-10 shadow-[0_28px_70px_-35px_rgba(13,148,136,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,0.18),transparent_50%)]" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 to-violet-500 opacity-35 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full border-[3px] border-teal-200/80 border-t-teal-600 border-l-violet-500 animate-spin" />
            <Zap className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-teal-600" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-teal-800/85">
            Building posting analytics…
          </p>
          <div className="w-full max-w-md space-y-3">
            <div className="h-3 rounded-full bg-gradient-to-r from-teal-100 via-cyan-100 to-teal-100 animate-pulse" />
            <div className="mx-auto h-3 w-4/5 rounded-full bg-gradient-to-r from-violet-100 via-fuchsia-100 to-violet-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-teal-50/50 animate-pulse shadow-inner" />
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="relative overflow-hidden rounded-[2.5rem] border border-dashed border-teal-200/70 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-14 text-center shadow-inner">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-200/20 blur-3xl" />
        <Compass className="mx-auto h-14 w-14 text-teal-300" strokeWidth={1.15} />
        <p className="mt-4 text-base font-black text-slate-700">
          No posting history for analytics
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs font-semibold leading-relaxed text-slate-500">
          Open <span className="font-bold text-teal-700">Posting History</span>{" "}
          to confirm data from the service.
        </p>
      </div>
    );
  }

  return <PostingDashboard items={items} />;
}
