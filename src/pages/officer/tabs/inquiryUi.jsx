import React from "react";
import {
  Calendar,
  Hash,
  ClipboardList,
} from "lucide-react";
import { safeText, toDDMMYYYY } from "../officerUtils/officerFormat.js";

export function normComplaintKey(v) {
  if (v == null) return "";
  return String(v).trim();
}

export function pickInquiryComplaintNo(row) {
  const v =
    row?.COMPLAINT_NO ??
    row?.complaint_no ??
    row?.["COMPLAINT#"] ??
    row?.COMPLAINTNO;
  return v != null && String(v).trim() !== "" ? String(v).trim() : "";
}

export function fmtInquiryDate(val) {
  if (val == null || val === "") return "—";
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${d}-${m}-${y}`;
  }
  return toDDMMYYYY(val);
}

function isFilled(v) {
  const s = safeText(v);
  return s !== "—" && String(s).trim() !== "";
}

function lower(v) {
  const s = safeText(v);
  return s === "—" ? "" : String(s).trim().toLowerCase();
}

export function isActiveInquiry(row) {
  if (!row || typeof row !== "object") return false;

  // If final decision exists, treat it as closed.
  if (isFilled(row.FINALDECISION)) return false;

  // If hearing result/decision date exists, treat as likely closed.
  if (isFilled(row.HEARING_RESULT)) return false;
  if (isFilled(row.HEARING_DECISION_DATE)) return false;

  const status = `${lower(row.HEARING_STATUS)} ${lower(row.INV_HEARING_STATUS)} ${lower(
    row.INV_HEARING_REMARKS,
  )}`.trim();

  // Common closure markers across data sources.
  const closedHints = [
    "disposed",
    "decided",
    "final",
    "completed",
    "concluded",
    "closed",
    "settled",
    "dec",
    "punishment",
    "penalty",
  ];
  if (closedHints.some((h) => status.includes(h))) return false;

  // Otherwise, assume it’s active / pending / in-progress.
  return true;
}

function badge(base, tone) {
  return `${base} ${tone}`;
}

function shortText(v, max = 90) {
  const s = safeText(v);
  if (s === "—") return "—";
  const t = String(s).trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function labelInquiryField(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const cardShell =
  "overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(6,95,70,0.35)] ring-1 ring-white/60";

/**
 * @param {object} props
 * @param {object} props.row
 * @param {number} props.index
 * @param {number} [props.totalCount] — when set, header shows "record X of Y" (standalone tab).
 * @param {"embedded" | "standalone"} [props.variant]
 */
export function InquiryFormStyleCard({ row, index, totalCount, variant = "embedded" }) {
  if (!row || typeof row !== "object") return null;

  const initiate = safeText(row.INQUIRY_INITIATE);
  const onComplaint = initiate.toLowerCase().includes("complaint");
  const complaintNo = safeText(row.COMPLAINT_NO);
  const isStandalone = variant === "standalone";
  const active = isActiveInquiry(row);

  const titleLine = isStandalone
    ? `Inquiry record ${index + 1}${totalCount != null ? ` of ${totalCount}` : ""}`
    : `Regular inquiry — row ${index + 1}`;

  return (
    <div className={cardShell}>
      <div className="border-b border-emerald-200/70 bg-gradient-to-r from-emerald-700/95 to-teal-700/90 px-3 py-2.5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                <ClipboardList className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.25} />
                {titleLine}
              </span>
              <span
                className={badge(
                  "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1",
                  onComplaint
                    ? "bg-white/15 text-white ring-white/25"
                    : "bg-white/10 text-white/80 ring-white/20",
                )}
              >
                {onComplaint ? "On complaint" : "Misc. matters"}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-emerald-100/95">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" strokeWidth={2.25} />
                Complaint # <span className="font-black text-white">{complaintNo}</span>
              </span>
              <span className="text-white/35">•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" strokeWidth={2.25} />
                Hearing: <span className="font-black text-white">{fmtInquiryDate(row.INV_HEARING_DATE)}</span>
              </span>
            </div>
          </div>
          <div
            className={[
              "shrink-0 rounded-xl border px-2.5 py-2 text-[10px] font-black uppercase tracking-wide",
              active
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/20 bg-white/5 text-white/85",
            ].join(" ")}
          >
            {active ? "Active" : "Closed"}
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-900/60">
              Inquiry type
            </div>
            <div className="mt-0.5 text-[12px] font-bold text-slate-900">
              {safeText(row.INQUIRY_TYPE)}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-700">
              Initiate: <span className="font-bold">{shortText(row.INQUIRY_INITIATE, 64)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white p-2.5">
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Against officer
            </div>
            <div className="mt-0.5 text-[12px] font-bold text-slate-900">
              {safeText(row.O_NAME_A_INQUIRY)}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-700">
              {safeText(row.O_DESIGDESC_A_INQUIRY)} • PF {safeText(row.O_PFNO_A_INQUIRY)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white p-2.5">
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Current status
            </div>
            <div className="mt-0.5 text-[12px] font-bold text-slate-900">
              {safeText(row.HEARING_STATUS) !== "—"
                ? safeText(row.HEARING_STATUS)
                : safeText(row.INV_HEARING_STATUS)}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-700">
              Result: <span className="font-bold">{safeText(row.HEARING_RESULT)}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200/70 bg-white p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                Posting at complaint time
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-800">
                {safeText(row.PPDISTRICTNAME)} / {safeText(row.PPTEHSILNAME)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                Inquiry officer
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-800">
                {safeText(row.INV_OFF_NAME)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InquirySummaryTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="rounded-2xl border-2 border-emerald-400/40 bg-gradient-to-b from-[#f0faf2] via-[#e8f5eb] to-[#dff0e3] p-3 shadow-[0_16px_48px_-24px_rgba(6,95,70,0.28)] ring-1 ring-emerald-200/50">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-300/40 pb-2">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-950">
          <ClipboardList className="h-4 w-4 text-emerald-800" strokeWidth={2.25} />
          Regular inquiry — summary table
        </h3>
        <span className="rounded-full bg-emerald-800/90 px-2.5 py-1 text-[10px] font-black text-white">
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mb-2 text-[10px] font-semibold text-emerald-900/80">
        Linked to complaints by <span className="font-black">Complaint #</span>. Matches the inquiry
        register layout (read-only).
      </p>
      <div className="overflow-x-auto rounded-xl border border-emerald-300/50 bg-white/85 shadow-inner">
        <table className="w-full min-w-[1000px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="sticky top-0 z-[1] bg-emerald-700 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
              <th className="px-2 py-2.5">#</th>
              <th className="px-2 py-2.5">Complaint #</th>
              <th className="px-2 py-2.5">Initiate</th>
              <th className="px-2 py-2.5">Inquiry type</th>
              <th className="px-2 py-2.5">Officer</th>
              <th className="px-2 py-2.5">PF no.</th>
              <th className="px-2 py-2.5">Then dist. / tehsil</th>
              <th className="px-2 py-2.5">Taken from</th>
              <th className="px-2 py-2.5">Inv. officer</th>
              <th className="px-2 py-2.5">Hearing date</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5">Result</th>
              <th className="px-2 py-2.5">Final decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const fd = safeText(r.FINALDECISION);
              const fdShort = fd.length > 48 ? `${fd.slice(0, 48)}…` : fd;
              const loc = [safeText(r.PPDISTRICTNAME), safeText(r.PPTEHSILNAME)]
                .filter((x) => x !== "—")
                .join(" / ");
              return (
                <tr
                  key={i}
                  className={
                    i % 2 === 0
                      ? "border-t border-emerald-100/80 bg-white"
                      : "border-t border-emerald-100/80 bg-emerald-50/50"
                  }
                >
                  <td className="px-2 py-2 font-black tabular-nums text-emerald-900">
                    {i + 1}
                  </td>
                  <td className="px-2 py-2 font-bold text-slate-900">
                    {safeText(r.COMPLAINT_NO)}
                  </td>
                  <td className="px-2 py-2 font-semibold text-slate-800">
                    {safeText(r.INQUIRY_INITIATE)}
                  </td>
                  <td className="px-2 py-2 text-slate-800">{safeText(r.INQUIRY_TYPE)}</td>
                  <td
                    className="max-w-[140px] truncate px-2 py-2 font-semibold text-slate-800"
                    title={safeText(r.O_NAME_A_INQUIRY)}
                  >
                    {safeText(r.O_NAME_A_INQUIRY)}
                  </td>
                  <td className="px-2 py-2 tabular-nums text-slate-800">
                    {safeText(r.O_PFNO_A_INQUIRY)}
                  </td>
                  <td className="max-w-[160px] truncate px-2 py-2 text-slate-800" title={loc}>
                    {loc || "—"}
                  </td>
                  <td className="px-2 py-2 text-slate-800">{safeText(r.TAKEN_FROM)}</td>
                  <td
                    className="max-w-[140px] truncate px-2 py-2 text-slate-800"
                    title={safeText(r.INV_OFF_NAME)}
                  >
                    {safeText(r.INV_OFF_NAME)}
                  </td>
                  <td className="px-2 py-2 tabular-nums text-slate-800">
                    {fmtInquiryDate(r.INV_HEARING_DATE)}
                  </td>
                  <td className="px-2 py-2 text-slate-800">{safeText(r.HEARING_STATUS)}</td>
                  <td className="px-2 py-2 text-slate-800">{safeText(r.HEARING_RESULT)}</td>
                  <td className="max-w-[200px] truncate px-2 py-2 text-slate-700" title={fd}>
                    {fdShort}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
