import React from "react";
import { GraduationCap, CalendarDays } from "lucide-react";
import { safeText, toDDMMYYYY } from "../officerUtils/officerFormat";

/** Course / scope title from API (`scope_name` ← `course_name`). */
const courseTitle = (row) =>
  safeText(
    row?.SCOPE_NAME ??
      row?.scope_name ??
      row?.COURSE_NAME ??
      row?.COURSENAME ??
      row?.TRAINING_TITLE ??
      row?.TITLE,
  );

const providerText = (row) =>
  safeText(
    row?.TPROVIDER_NAME ??
      row?.tprovider_name ??
      row?.RECEIVED_FROM ??
      row?.received_from,
  );

/** dd-mm-yyyy; supports Oracle DATE objects and ISO strings. */
const fmtDMY = (val) => {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const dd = String(val.getDate()).padStart(2, "0");
    const mm = String(val.getMonth() + 1).padStart(2, "0");
    const yyyy = String(val.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  }
  return toDDMMYYYY(val);
};

const fromDateRaw = (r) =>
  r?.FROM_DATE ?? r?.from_date ?? r?.FROMDATE ?? r?.From_date ?? r?.FDATE;

const toDateRaw = (r) =>
  r?.TO_DATE ?? r?.to_date ?? r?.TODATE ?? r?.TDATE;

export default function TrainingsTab({ trainingRows, trainingLoading }) {
  const list = Array.isArray(trainingRows) ? trainingRows : [];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-teal-200/25 overflow-hidden min-w-[280px] ring-1 ring-teal-100/50">
      <div className="relative p-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_15%_0%,rgba(255,255,255,0.45),transparent_50%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-11 w-11 rounded-2xl bg-white/20 border border-white/35 grid place-items-center shrink-0 shadow-inner backdrop-blur-sm">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="text-[17px] font-black leading-tight tracking-tight">
                Trainings
              </h2>
              <p className="text-[11px] font-bold text-white/90 mt-0.5">
                Courses, provider, and schedule (dates dd-mm-yyyy)
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black bg-black/15 border border-white/25 backdrop-blur-sm tabular-nums">
            {list.length}{" "}
            {list.length === 1 ? "course" : "courses"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 bg-gradient-to-b from-teal-50/35 via-slate-50/50 to-white">
        {trainingLoading ? (
          <div className="py-14 text-center rounded-2xl border border-teal-100/90 bg-white/70">
            <div className="inline-block h-9 w-9 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
            <p className="mt-4 text-[13px] font-bold text-teal-900/70">
              Loading trainings…
            </p>
          </div>
        ) : !list.length ? (
          <div className="py-14 text-center rounded-2xl border-2 border-dashed border-teal-200/70 bg-white/80">
            <p className="text-[13px] font-bold text-slate-500">
              No training records found.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden ring-1 ring-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-800 via-emerald-900 to-cyan-900 text-white">
                    <th className="py-3.5 px-4 text-left text-[11px] font-black uppercase tracking-[0.12em]">
                      Course / scope
                    </th>
                    <th className="py-3.5 px-4 text-left text-[11px] font-black uppercase tracking-[0.12em]">
                      Received from
                    </th>
                    <th className="py-3.5 px-4 text-left text-[11px] font-black uppercase tracking-[0.12em] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 opacity-90" />
                        From
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-left text-[11px] font-black uppercase tracking-[0.12em] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 opacity-90" />
                        To
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, idx) => {
                    const title = courseTitle(row);
                    const prov = providerText(row);
                    const fd = fmtDMY(fromDateRaw(row));
                    const td = fmtDMY(toDateRaw(row));
                    return (
                      <tr
                        key={`${idx}-${title}-${fd}`}
                        className={[
                          "border-b border-slate-100/90 transition-colors duration-150",
                          idx % 2 === 0 ? "bg-white" : "bg-teal-50/25",
                          "hover:bg-gradient-to-r hover:from-teal-50/90 hover:to-cyan-50/60",
                        ].join(" ")}
                      >
                        <td className="py-3.5 px-4 align-middle max-w-[220px]">
                          <span className="font-extrabold text-slate-900 leading-snug">
                            {title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <span className="inline-flex rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-1 text-[12px] font-bold text-slate-800 border border-slate-200/80 shadow-sm">
                            {prov}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <span className="font-mono tabular-nums text-[13px] font-bold text-teal-950 bg-teal-100/90 border border-teal-200/70 rounded-lg px-2.5 py-1 shadow-sm">
                            {fd}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <span className="font-mono tabular-nums text-[13px] font-bold text-cyan-950 bg-cyan-100/90 border border-cyan-200/70 rounded-lg px-2.5 py-1 shadow-sm">
                            {td}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
