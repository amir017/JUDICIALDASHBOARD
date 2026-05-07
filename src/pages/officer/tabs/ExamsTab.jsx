import React from "react";
import {
  BookMarked,
  ClipboardList,
  Trophy,
  Scale,
  CalendarRange,
} from "lucide-react";
import { safeText, safeDate } from "../officerUtils/officerFormat";

/** Numeric marks when parsable; otherwise null. */
function parseMarksNum(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Total marks for scoring: missing / empty / invalid → 100 (display default).
 * Explicit zero from API is preserved.
 */
function resolveTotalMarks(raw) {
  if (raw === null || raw === undefined) return 100;
  const s = String(raw).trim().replace(/,/g, "");
  if (!s) return 100;
  const n = Number(s);
  if (!Number.isFinite(n)) return 100;
  return n;
}

function StatusPill({ value }) {
  const t = safeText(value);
  if (t === "—") return null;
  const u = t.toUpperCase();
  const positive = /PASS|QUAL|SUCCESS|CLEARED|APPROV|COMPLETE/i.test(u);
  const pending = /PEND|PENDING|WITHHOLD|WITHHELD|AWAIT/i.test(u);
  const negative = /FAIL|REJECT|DISMISS/i.test(u);
  const cls = positive
    ? "bg-emerald-100 text-emerald-900 border-emerald-200/80"
    : pending
      ? "bg-amber-100 text-amber-950 border-amber-200/80"
      : negative
        ? "bg-rose-100 text-rose-900 border-rose-200/80"
        : "bg-slate-100 text-slate-800 border-slate-200/80";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${cls}`}
    >
      {t}
    </span>
  );
}

function SectionShell({
  title,
  subtitle,
  icon: Icon,
  gradient,
  count,
  loading,
  emptyHint,
  children,
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/35 overflow-hidden ring-1 ring-slate-100/90">
      <div
        className={`relative px-4 py-3.5 bg-gradient-to-r ${gradient} text-white overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-0.5 h-10 w-10 rounded-2xl bg-white/20 border border-white/30 grid place-items-center shrink-0 backdrop-blur-sm">
              <Icon size={20} className="text-white" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[17px] font-black leading-tight tracking-tight">
                {title}
              </h3>
              <p className="text-[11.5px] font-bold text-white/90 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-extrabold bg-black/15 border border-white/25 backdrop-blur-sm">
            {count} {count === 1 ? "record" : "records"}
          </span>
        </div>
      </div>
      <div className="p-4 bg-gradient-to-b from-slate-50/90 to-white">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
            <p className="mt-3 text-[13px] font-bold text-slate-500">
              Loading…
            </p>
          </div>
        ) : count === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-[13px] font-bold text-slate-500">{emptyHint}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value, wide }) {
  const v = safeText(value);
  if (v === "—") return null;
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="text-[12.5px] font-semibold text-slate-800 mt-0.5 break-words">
        {v}
      </div>
    </div>
  );
}

/** Paper score: obtained / total (total defaults to 100 when not provided). */
function PaperScorePanel({ obtainedRaw, row }) {
  const totalResolved = resolveTotalMarks(
    row?.TOTAL_MARKS ?? row?.total_marks ?? row?.TOTALMARKS,
  );
  const obtNum = parseMarksNum(obtainedRaw);
  const obtDisplay =
    obtNum != null ? String(Math.round(obtNum)) : safeText(obtainedRaw);
  const totalRounded = Math.round(totalResolved);
  const pct =
    obtNum != null && totalResolved > 0
      ? Math.min(100, Math.round((obtNum / totalResolved) * 100))
      : null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-sky-50/30 to-cyan-50/20 px-3.5 py-2.5 min-w-[156px] shadow-sm ring-1 ring-sky-100/80">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Marks obtained
      </div>
      <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
        <span className="text-[22px] font-black leading-none text-slate-900 tracking-tight">
          {obtDisplay}
        </span>
        <span className="text-[13px] font-semibold text-slate-400 pb-0.5">
          /
        </span>
        <span className="text-[15px] font-bold text-slate-600">{totalRounded}</span>
      </div>
      <div className="mt-1 text-[10px] font-semibold text-slate-500">
        Out of maximum
      </div>
      {pct != null ? (
        <>
          <div
            className="mt-2.5 h-2 rounded-full bg-slate-200/80 overflow-hidden ring-1 ring-inset ring-slate-300/40"
            role="presentation"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Attainment
            </span>
            <span className="text-[11px] font-black tabular-nums text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-md border border-teal-200/70">
              {pct}%
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function ExamsTab({
  examAttemptRows,
  examAttemptLoading,
  examAttemptDetailRows,
  examAttemptDetailLoading,
  examResultRows,
  examResultLoading,
  examRemedyRows,
  examRemedyLoading,
}) {
  const attempts = Array.isArray(examAttemptRows) ? examAttemptRows : [];
  const papers = Array.isArray(examAttemptDetailRows)
    ? examAttemptDetailRows
    : [];
  const results = Array.isArray(examResultRows) ? examResultRows : [];
  const remedies = Array.isArray(examRemedyRows) ? examRemedyRows : [];

  return (
    <div className="space-y-5 min-w-[280px]">
      <SectionShell
        title="Exam attempts"
        subtitle="Sessions and posting context for each attempt"
        icon={BookMarked}
        gradient="from-amber-500 via-orange-500 to-rose-500"
        count={attempts.length}
        loading={examAttemptLoading}
        emptyHint="No exam attempts on record."
      >
        <div className="space-y-3">
          {attempts.map((row, idx) => (
            <div
              key={`a-${idx}`}
              className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md hover:border-amber-200/60 transition-all duration-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="text-[14px] font-black text-slate-900 leading-snug max-w-[85%]">
                  {safeText(row?.ATTEMPT_DESC)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-950">
                  <CalendarRange size={13} className="text-amber-600" />
                  {safeDate(row?.FROMDATE)} → {safeDate(row?.TODATE)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MetaRow label="Session" value={row?.SESSION_ID} />
                <MetaRow label="Exam for" value={row?.EXAMFOR} />
                <MetaRow label="Designation" value={row?.DESIGDESC} wide />
                <MetaRow label="Remarks" value={row?.REMARKS} wide />
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title="Papers & subjects"
        subtitle="Marks, status, and paper-wise performance"
        icon={ClipboardList}
        gradient="from-sky-500 via-cyan-500 to-teal-500"
        count={papers.length}
        loading={examAttemptDetailLoading}
        emptyHint="No paper-level details available."
      >
        <div className="space-y-4">
          {papers.map((row, idx) => (
            <div
              key={`p-${idx}`}
              className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-md shadow-slate-200/50 hover:shadow-lg hover:border-sky-200/70 transition-all duration-200 ring-1 ring-slate-100/80"
            >
              <div className="px-4 py-4 sm:px-5 bg-gradient-to-r from-slate-50 via-sky-50/40 to-cyan-50/30 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700/90 mb-1">
                    Subject / paper
                  </div>
                  <div className="text-[15px] font-black text-slate-900 leading-snug tracking-tight">
                    {safeText(row?.SUBJECT_NAME)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill value={row?.STATUS} />
                  </div>
                </div>
                <PaperScorePanel obtainedRaw={row?.MARKS_OBT} row={row} />
              </div>
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-white">
                <MetaRow label="Grace marks" value={row?.GRACE_MARKS} />
                <MetaRow label="Exam for" value={row?.EXAMFOR} />
                <MetaRow label="Designation" value={row?.DESIGDESC} wide />
                <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Examination period
                  </div>
                  <div className="text-[12.5px] font-semibold text-slate-800 mt-1 tabular-nums">
                    {safeDate(row?.FROMDATE)}
                    <span className="text-slate-400 mx-1.5 font-normal">→</span>
                    {safeDate(row?.TODATE)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title="Final results"
        subtitle="Declared outcomes linked to attempts"
        icon={Trophy}
        gradient="from-violet-500 via-purple-500 to-fuchsia-500"
        count={results.length}
        loading={examResultLoading}
        emptyHint="No final exam results on file."
      >
        <div className="space-y-3">
          {results.map((row, idx) => (
            <div
              key={`r-${idx}`}
              className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/40 to-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[15px] font-black text-slate-900">
                  {safeText(row?.FRESULT)}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                Attempt ref:{" "}
                <span className="text-slate-700 font-bold tabular-nums">
                  {safeText(row?.ATTEMPT_ID)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title="Remedies & appeals"
        subtitle="Forum, dates, and remedy outcomes"
        icon={Scale}
        gradient="from-slate-600 via-slate-700 to-slate-900"
        count={remedies.length}
        loading={examRemedyLoading}
        emptyHint="No remedy records."
      >
        <div className="space-y-3">
          {remedies.map((row, idx) => (
            <div
              key={`m-${idx}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="text-[12px] font-black text-slate-900 uppercase tracking-wide">
                  Ref {safeText(row?.REMEDY_REF_NO)}
                </div>
                <StatusPill value={row?.RESULT} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MetaRow label="Apply date" value={safeDate(row?.REMEDY_APPLY_DATE)} />
                <MetaRow
                  label="Approval date"
                  value={safeDate(row?.REMEDY_APROV_DATE)}
                />
                <MetaRow label="Forum" value={row?.REMEDY_FORUM} />
                <MetaRow label="Exam for" value={row?.EXAM_FOR} />
                <MetaRow label="Attempt ref" value={row?.ATTEMPT_ID} />
                <MetaRow label="Remarks" value={row?.REMARKS} wide />
              </div>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
