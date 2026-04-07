import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Scale,
  UserCheck,
  CalendarRange,
  PenLine,
  Stamp,
  Users,
  AlertTriangle,
  Gavel,
} from "lucide-react";
import { safeText, toDDMMYYYY } from "../officerUtils/officerFormat";

const g = (r, ...keys) => {
  for (const k of keys) {
    if (r && r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== "") {
      return r[k];
    }
  }
  return undefined;
};

/** DB stores band as 1–4: A1, A, B, D (matches paper ACR rating columns). */
const ACR_BAND_BY_CODE = {
  1: "A1",
  2: "A",
  3: "B",
  4: "D",
};

function formatAcrBandGrade(raw) {
  if (raw === null || raw === undefined) return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.trunc(raw);
    if (ACR_BAND_BY_CODE[n]) return ACR_BAND_BY_CODE[n];
    return String(raw);
  }
  const s = String(raw).trim();
  if (!s) return "—";
  const n = parseInt(s, 10);
  if (String(n) === s && ACR_BAND_BY_CODE[n]) return ACR_BAND_BY_CODE[n];
  const upper = s.toUpperCase().replace(/\s+/g, "");
  if (upper === "A1" || upper === "AI") return "A1";
  if (["A", "B", "C", "D"].includes(upper)) return upper;
  return s;
}

const isMarked = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toUpperCase();
  if (!s) return false;
  if (["N", "NO", "0", "FALSE", "-"].includes(s)) return false;
  return true;
};

const TextBlock = ({ label, value }) => {
  const t = safeText(value);
  if (t === "—") return null;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap">
        {t}
      </div>
    </div>
  );
};

const GradeChip = ({ label, value }) => {
  const display = formatAcrBandGrade(value);
  if (display === "—") return null;
  const raw =
    value !== null && value !== undefined && String(value).trim() !== ""
      ? String(value).trim()
      : "";
  const mapped =
    raw !== "" && display !== raw && /^\d+$/.test(raw);
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600/90">
        {label}
      </span>
      <span className="text-[18px] font-black tracking-tight text-indigo-950">
        {display}
      </span>
      {mapped ? (
        <span className="text-[9px] font-semibold text-indigo-600/70">
          code {raw}
        </span>
      ) : null}
    </div>
  );
};

const CheckCell = ({ on }) => (
  <div
    className={[
      "h-9 rounded-xl border text-center text-[13px] font-black leading-9",
      on
        ? "border-emerald-400 bg-emerald-500 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-300",
    ].join(" ")}
  >
    {on ? "✓" : "—"}
  </div>
);

const MatrixSection = ({ title, subtitle, rows }) => (
  <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white">
    <div className="px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
      <div className="text-[12px] font-black">{title}</div>
      {subtitle ? (
        <div className="text-[10px] font-semibold text-white/80">{subtitle}</div>
      ) : null}
    </div>
    <div className="grid grid-cols-[1fr_72px_72px] gap-px bg-slate-200">
      <div className="bg-slate-100 px-2 py-1.5 text-[9px] font-bold uppercase text-slate-600">
        Criterion
      </div>
      <div className="bg-slate-100 px-1 py-1.5 text-[9px] font-black text-center text-slate-600">
        Reporting
      </div>
      <div className="bg-slate-100 px-1 py-1.5 text-[9px] font-black text-center text-slate-600">
        Counter-
        <br />
        signing
      </div>
      {rows.map((row) => (
        <React.Fragment key={row.key}>
          <div className="bg-white px-2 py-2 text-[11px] font-semibold text-slate-800 leading-snug">
            {row.label}
          </div>
          <div className="bg-white p-1.5">
            <CheckCell on={row.r} />
          </div>
          <div className="bg-white p-1.5">
            <CheckCell on={row.c} />
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const OVERALL_ROWS = [
  { suffix: "I", label: "(I) Equalled by very few — Very Good" },
  { suffix: "II", label: "(II) Better than the majority — Good" },
  { suffix: "III", label: "(III) Equals the majority — Average" },
  { suffix: "IV", label: "(IV) Meets bare minimum — Below Average" },
  { suffix: "V", label: "(V) Unsatisfactory — Poor" },
];

const FIT_ROWS = [
  { suffix: "I", label: "(I) Fit for accelerated promotion" },
  { suffix: "II", label: "(II) Fit for promotion in his turn" },
  { suffix: "III", label: "(III) Not yet fit for promotion" },
  { suffix: "IV", label: "(IV) Unlikely to progress further" },
];

const INTEG_ROWS = [
  { suffix: "I", label: "(I) Honest" },
  { suffix: "II", label: "(II) Corrupt" },
  { suffix: "III", label: "(III) Reported to be corrupt" },
];

function fromVal(row) {
  return g(row, "FROM_DATE", "from_date");
}
function toVal(row) {
  return g(row, "TO_DATE", "to_date");
}

function periodLabel(row) {
  const from = fromVal(row);
  const to = toVal(row);
  if (!from && !to) return "Period not set";
  return `${toDDMMYYYY(from) || "—"} → ${toDDMMYYYY(to) || "—"}`;
}

function periodOptionKey(row, idx) {
  return `${g(row, "OFFICER_ID", "officer_id")}|${String(fromVal(row))}|${String(toVal(row))}|${idx}`;
}

/** Part V (F): 1 = useful (yes), 0 = not useful (no). */
function formatUsefulness(raw) {
  if (raw === null || raw === undefined) return { kind: "empty" };
  const s = String(raw).trim();
  if (s === "") return { kind: "empty" };
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : parseInt(s, 10);
  if (s === String(n) || (typeof raw === "number" && Number.isFinite(raw))) {
    if (n === 1) return { kind: "yes" };
    if (n === 0) return { kind: "no" };
  }
  const u = s.toUpperCase();
  if (u === "Y" || u === "YES" || u === "USEFUL") return { kind: "yes" };
  if (u === "N" || u === "NO" || u === "NOT USEFUL" || u === "NOTUSEFUL")
    return { kind: "no" };
  return { kind: "raw", text: s };
}

function UsefulnessCard({ raw }) {
  const u = formatUsefulness(raw);
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">
        (F) Usefulness for further retention in service
      </div>
      {u.kind === "empty" ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-3 text-center text-[12px] font-semibold text-slate-400">
          Not recorded
        </div>
      ) : u.kind === "yes" ? (
        <div className="inline-flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3.5 text-white shadow-lg shadow-emerald-500/25">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-black">
            ✓
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              Useful for further retention
            </div>
            <div className="text-[17px] font-black leading-tight">Yes</div>
          </div>
        </div>
      ) : u.kind === "no" ? (
        <div className="inline-flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-rose-300/90 bg-gradient-to-r from-rose-500 to-orange-600 px-5 py-3.5 text-white shadow-lg shadow-rose-500/20">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-black">
            ×
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              Not useful for retention
            </div>
            <div className="text-[17px] font-black leading-tight">No</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-800">
          {safeText(u.text)}
        </div>
      )}
    </div>
  );
}

function fmtSubDate(v) {
  if (v === null || v === undefined || String(v).trim() === "") return "";
  return toDDMMYYYY(v) || String(v).trim();
}

function OfficerMiniCard({ icon: Icon, tone, title, name, line2, line2Label }) {
  const n = safeText(name);
  const L2 =
    line2 === undefined || line2 === null || String(line2).trim() === ""
      ? ""
      : line2Label
        ? fmtSubDate(line2) || safeText(line2)
        : safeText(line2);
  const has = n !== "—" || (L2 && L2 !== "—");
  if (!has) return null;
  const ring =
    tone === "violet"
      ? "ring-violet-100"
      : tone === "indigo"
        ? "ring-indigo-100"
        : "ring-teal-100";
  const labelCls =
    tone === "violet"
      ? "text-violet-600/90"
      : tone === "indigo"
        ? "text-indigo-600/90"
        : "text-teal-700/90";

  return (
    <div
      className={`rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm ring-1 ${ring}`}
    >
      <div
        className={`flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wider ${labelCls}`}
      >
        {Icon ? <Icon size={12} className="shrink-0" /> : null}
        {title}
      </div>
      <div className="mt-2 text-[14px] font-black text-slate-900 leading-snug">
        {n}
      </div>
      {line2Label && L2 && L2 !== "—" ? (
        <div className="mt-1 text-[11px] font-semibold text-slate-500">
          <span className="text-slate-400">{line2Label}: </span>
          {L2}
        </div>
      ) : !line2Label && L2 && L2 !== "—" ? (
        <div className="mt-1">
          <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Designation
          </div>
          <div className="text-[12px] font-semibold text-slate-600">{L2}</div>
        </div>
      ) : null}
    </div>
  );
}

function officerSlotHasContent({ name, line2, line2Label }) {
  const n = safeText(name);
  if (n !== "—") return true;
  if (line2 === undefined || line2 === null || String(line2).trim() === "")
    return false;
  if (line2Label) {
    const d = fmtSubDate(line2) || safeText(line2);
    return d && d !== "—";
  }
  return safeText(line2) !== "—";
}

/** Reporting (Part VI) + 1st & 2nd countersigning (Part VII). */
function ThreeOfficersPanel({ row }) {
  const repName = g(row, "REP_OFFICER_NAME", "rep_officer_name");
  const repDesig = g(row, "REP_OFF_DESIGNATION", "rep_off_designation");
  const counName = g(row, "COUN_OFFICER_NAME", "coun_officer_name");
  const counDate = g(row, "COUN_OFFICER_SUBDATE", "coun_officer_subdate");
  const secName = g(row, "SEC_COUN_OFFICER_NAME", "sec_coun_officer_name");
  const secDate = g(row, "SEC_COUN_OFFICER_SUBDATE", "sec_coun_officer_subdate");

  const slots = [
    {
      key: "rep",
      icon: PenLine,
      tone: "violet",
      title: "Reporting officer",
      name: repName,
      line2: repDesig,
      line2Label: null,
    },
    {
      key: "c1",
      icon: Stamp,
      tone: "indigo",
      title: "Countersigning officer",
      name: counName,
      line2: counDate,
      line2Label: "Submission date",
    },
    {
      key: "c2",
      icon: Users,
      tone: "teal",
      title: "Second countersigning officer",
      name: secName,
      line2: secDate,
      line2Label: "Submission date",
    },
  ].filter(officerSlotHasContent);

  const count = slots.length;
  const rendered = slots.map((s) => (
    <OfficerMiniCard
      key={s.key}
      icon={s.icon}
      tone={s.tone}
      title={s.title}
      name={s.name}
      line2={s.line2}
      line2Label={s.line2Label}
    />
  ));
  if (!count) return null;

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 p-4 shadow-sm">
      <div className="text-[11px] font-black text-violet-950 mb-3 flex items-center gap-2">
        <Users className="text-violet-600 shrink-0" size={16} />
        Officers (reporting &amp; countersigning)
      </div>
      <div
        className={[
          "grid gap-3",
          count >= 3 ? "grid-cols-1 md:grid-cols-3" : count === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
        ].join(" ")}
      >
        {rendered}
      </div>
    </div>
  );
}

function hasAnyContent(row, keys) {
  return keys.some((k) => {
    const v = g(row, k, k.toLowerCase());
    if (v === undefined || v === null) return false;
    return String(v).trim() !== "";
  });
}

function nonEmptyVal(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function AdverseAndAppealsSection({ row }) {
  const adverse = g(row, "ADVERSE_REMARKS", "adverse_remarks");
  const adverseDt = g(row, "ADVERSE_SUBDATE", "adverse_subdate");
  const decision = g(row, "DECISION_ON_REPRESENTATION", "decision_on_representation");
  const decisionDt = g(row, "DEC_ON_REP_SUBDATE", "dec_on_rep_subdate");
  const acDecision = g(row, "ACDECISSION", "acdecission");
  const appealFate = g(row, "APPEALFATE", "appealfate");

  const hasAdverse = nonEmptyVal(adverse) || nonEmptyVal(adverseDt);

  const hasDecisionBlock = hasAnyContent(row, [
    "DECISION_ON_REPRESENTATION",
    "DEC_ON_REP_SUBDATE",
    "ACDECISSION",
    "APPEALFATE",
  ]);

  const counRem = g(row, "COUN_OFFICER_REMAKRS", "coun_officer_remakrs");
  const secRem = g(row, "SEC_COUN_OFFICER_REMARKS", "sec_coun_officer_remarks");

  const hasPartViiRemarks = nonEmptyVal(counRem) || nonEmptyVal(secRem);
  if (!hasPartViiRemarks && !hasAdverse && !hasDecisionBlock) return null;

  return (
    <div className="space-y-4">
      <div className="text-[13px] font-black text-slate-800 flex items-center gap-2">
        <Gavel className="text-slate-600 shrink-0" size={18} />
        Parts VII &amp; VIII — Remarks, adverse entries &amp; appeals
      </div>

      <div className="grid grid-cols-1 gap-2">
        <TextBlock
          label="(a) Remarks of countersigning officer"
          value={counRem}
        />
        <TextBlock
          label="(b) Remarks of second countersigning officer (if any)"
          value={secRem}
        />
      </div>

      {hasAdverse ? (
        <div className="rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/30 p-4 shadow-md">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900/80">
                Adverse remarks (if communicated)
              </div>
              {adverseDt ? (
                <div className="mt-1 text-[11px] font-bold text-amber-800/90">
                  Date: {fmtSubDate(adverseDt) || safeText(adverseDt)}
                </div>
              ) : null}
              {adverse !== undefined && String(adverse).trim() !== "" ? (
                <div className="mt-2 text-[13px] font-semibold leading-relaxed text-amber-950 whitespace-pre-wrap">
                  {safeText(adverse)}
                </div>
              ) : !adverseDt ? (
                <div className="mt-2 text-[12px] text-amber-800/80">
                  No narrative text on file for this period.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-[12px] font-semibold text-slate-500">
          No adverse remarks recorded for this period.
        </div>
      )}

      {hasDecisionBlock ? (
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Decision on representation / appeal tracking
          </div>
          <div className="grid grid-cols-1 gap-3">
            <TextBlock
              label="Decision on representation (if any)"
              value={decision}
            />
            {decisionDt ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px]">
                <span className="font-bold text-slate-600">Submission / record date: </span>
                <span className="font-semibold text-slate-900">
                  {fmtSubDate(decisionDt) || safeText(decisionDt)}
                </span>
              </div>
            ) : null}
            <TextBlock label="Administrative decision (ACDECISSION)" value={acDecision} />
            <TextBlock label="Appeal fate (APPEALFATE)" value={appealFate} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildPartViRows(r, prefix) {
  const p = prefix;
  const map = {
    OVER_ALL_GRADING: OVERALL_ROWS,
    FIT_PRO: FIT_ROWS,
    INTEG: INTEG_ROWS,
  };
  const defs = map[prefix];
  if (!defs) return [];
  return defs.map((d) => {
    const suf = d.suffix;
    const rKey = `${p}_${suf}_R`;
    const cKey = `${p}_${suf}_C`;
    return {
      key: `${p}_${suf}`,
      label: d.label,
      r: isMarked(g(r, rKey, rKey.toUpperCase())),
      c: isMarked(g(r, cKey, cKey.toUpperCase())),
    };
  });
}

function ACRPeriodCard({ row }) {
  const from = g(row, "FROM_DATE", "from_date");
  const to = g(row, "TO_DATE", "to_date");
  const period =
    from || to
      ? `${toDDMMYYYY(from) || "—"} → ${toDDMMYYYY(to) || "—"}`
      : "Period not set";

  const part2 = {
    pq: g(row, "PARTII_PERSOLQUALITIES", "partii_persolqualities"),
    att: g(row, "PARTIII_ATTITUDES", "partiii_attitudes"),
    prof: g(row, "PARTIV_PROFICIENCYINJOB", "partiv_proficiencyinjob"),
  };

  const overallRows = buildPartViRows(row, "OVER_ALL_GRADING");
  const fitRows = buildPartViRows(row, "FIT_PRO");
  const integRows = buildPartViRows(row, "INTEG");

  const usefulness = g(row, "USEFULNESS", "usefulness");

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white shadow-md overflow-hidden">
      <div className="relative px-4 py-3 bg-gradient-to-r from-amber-800 via-orange-700 to-rose-800 text-white">
        <div className="pointer-events-none absolute -top-8 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-white/85">
              Annual Confidential Report
            </div>
            <div className="mt-1 text-[16px] font-black">Reporting period</div>
            <div className="text-[13px] font-bold text-white/95">{period}</div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold">
            <ClipboardList size={14} />
            II • V • VI • VII
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <ThreeOfficersPanel row={row} />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scale className="text-indigo-600" size={18} />
            <span className="text-[13px] font-black text-slate-800">
              Overall grades (Parts II–IV summary on form)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <GradeChip label="Part II — Personal qualities" value={part2.pq} />
            <GradeChip label="Part III — Attitudes" value={part2.att} />
            <GradeChip label="Part IV — Proficiency in job" value={part2.prof} />
          </div>
          <p className="mt-2 text-[10px] font-semibold text-slate-500">
            Grade scale stored as codes:{" "}
            <span className="text-slate-700">1 = A1</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-slate-700">2 = A</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-slate-700">3 = B</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-slate-700">4 = D</span>
          </p>
        </div>

        <div>
          <div className="text-[13px] font-black text-slate-800 mb-2">
            Part V — Narrative assessment
          </div>
          <div className="grid grid-cols-1 gap-2">
            <TextBlock label="(A) Pen picture" value={g(row, "PEN_PICTURE", "Pen_picture")} />
            <TextBlock label="(B) Counselling" value={g(row, "COUNSELING", "Counseling")} />
            <TextBlock
              label="(C) Assessment of performance"
              value={g(
                row,
                "ASSESSMENTOFPERFORMANCE",
                "AssessmentOfPerformance",
                "ASS_OF_PERFOR",
              )}
            />
            <TextBlock
              label="(D) Inspection of subordinate offices"
              value={g(row, "INSPECTION_SUB_OFFICES", "inspection_sub_offices")}
            />
            <TextBlock label="(E) Field tour" value={g(row, "FIELD_TOUR", "field_tour")} />
            <UsefulnessCard raw={usefulness} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="text-rose-700" size={18} />
            <span className="text-[13px] font-black text-slate-800">
              Part VI — Assessment matrix
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-3">
            <MatrixSection
              title="Overall grading"
              subtitle="Compared with peers (Parts II–IV)"
              rows={overallRows}
            />
            <MatrixSection title="Fitness for promotion" rows={fitRows} />
            <MatrixSection title="Integrity" rows={integRows} />
          </div>
          <div className="mt-4">
            <AdverseAndAppealsSection row={row} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ACRTab({ acrLoading, acrRows }) {
  const list = useMemo(() => (Array.isArray(acrRows) ? acrRows : []), [acrRows]);
  const [periodIdx, setPeriodIdx] = useState(0);

  useEffect(() => {
    setPeriodIdx(0);
  }, [acrRows]);

  useEffect(() => {
    if (periodIdx >= list.length) setPeriodIdx(0);
  }, [list.length, periodIdx]);

  const selectedRow = list.length ? list[Math.min(periodIdx, list.length - 1)] : null;

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-amber-900 via-orange-800 to-rose-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[16px] font-black">ACR (Confidential)</div>
            <div className="text-[11px] font-bold text-white/90">
              Choose a reporting period — Parts II through VII
            </div>
          </div>
          <span className="shrink-0 self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            {acrLoading ? "…" : `${list.length} period(s)`}
          </span>
        </div>

        {!acrLoading && list.length > 1 ? (
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-white/85 mb-2">
              <CalendarRange size={14} className="shrink-0 opacity-90" />
              Select reporting period
            </label>
            <select
              className="w-full rounded-xl border border-white/30 bg-white/95 px-3 py-2.5 text-[13px] font-bold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/60"
              value={String(periodIdx)}
              onChange={(e) => setPeriodIdx(Number(e.target.value, 10) || 0)}
            >
              {list.map((row, i) => (
                <option key={periodOptionKey(row, i)} value={String(i)}>
                  {periodLabel(row)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="p-4 space-y-4">
        {acrLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm font-semibold animate-pulse">
            Loading ACR…
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 text-sm">
            No ACR records found for this officer.
          </div>
        ) : (
          <ACRPeriodCard row={selectedRow} />
        )}
      </div>
    </div>
  );
}
