import React, { useMemo } from "react";
import { safeText, toDDMMYYYY } from "../officerUtils/officerFormat";

const getQuaType = (r) => r?.qua_type ?? r?.QUA_TYPE;
const getQuaDesc = (r) => r?.qua_desc ?? r?.QUA_DESC;
const getNameIns = (r) => r?.name_ins ?? r?.NAME_INS;
const getFromDate = (r) => r?.from_date ?? r?.FROM_DATE;
const getToDate = (r) => r?.to_date ?? r?.TO_DATE;
const getRemarks = (r) => r?.remarks ?? r?.REMARKS;
const getPassYear = (r) => r?.pass_year ?? r?.PASS_YEAR;
const getGrade = (r) => r?.grade ?? r?.GRADE;

const quaTypeLabel = (t) => {
  const n = Number(t);
  if (n === 0) return "Academic";
  if (n === 1) return "Professional";
  if (n === 2) return "Other";
  return "—";
};

const Chip = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-sm bg-white/90 text-slate-800 border-slate-200/70">
    {children}
  </span>
);

const EduPill = ({ text }) => {
  const t = safeText(text);
  return (
    <div
      title={t}
      className={[
        "max-w-full inline-flex items-center",
        "px-3 py-1.5 rounded-2xl",
        "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600",
        "text-white text-[12px] font-black shadow-sm",
        "border border-white/20",
      ].join(" ")}
    >
      <span className="max-w-[520px] truncate">{t}</span>
    </div>
  );
};

export default function QualificationsTab({ qualLoading, qualRows }) {
  const grouped = useMemo(() => {
    const list = [...(qualRows || [])];
    list.sort(
      (a, b) => Number(getPassYear(b) || 0) - Number(getPassYear(a) || 0),
    );

    return list.reduce(
      (acc, r) => {
        const k = quaTypeLabel(getQuaType(r));
        acc[k] = acc[k] || [];
        acc[k].push(r);
        return acc;
      },
      { Academic: [], Professional: [], Other: [], "—": [] },
    );
  }, [qualRows]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-black">Qualifications</div>
            <div className="text-[11px] font-bold text-white/90">
              Academic • Professional • Other
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            {qualRows?.length || 0} Records
          </span>
        </div>
      </div>

      <div className="p-4">
        {qualLoading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading qualifications...
          </div>
        ) : !qualRows?.length ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No qualifications found.
          </div>
        ) : (
          <div className="space-y-4">
            {["Academic", "Professional", "Other", "—"].map((k) => {
              const items = grouped[k] || [];
              if (!items.length) return null;

              return (
                <div
                  key={k}
                  className="rounded-3xl border border-slate-200/70 bg-white/70 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-sky-50 flex items-center justify-between">
                    <div className="text-[12px] font-black text-slate-900">
                      {k}
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white border border-slate-200 text-slate-800">
                      {items.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    {items.map((r, idx) => (
                      <div
                        key={`${k}-${idx}`}
                        className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <EduPill text={getQuaDesc(r)} />

                              <div
                                title={safeText(getNameIns(r))}
                                className="px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-200 text-slate-900 text-[12px] font-black max-w-full"
                              >
                                <span className="max-w-[520px] truncate inline-block">
                                  {safeText(getNameIns(r))}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Chip>
                                From:{" "}
                                {getFromDate(r)
                                  ? toDDMMYYYY(getFromDate(r))
                                  : "—"}
                              </Chip>
                              <Chip>
                                To:{" "}
                                {getToDate(r) ? toDDMMYYYY(getToDate(r)) : "—"}
                              </Chip>
                              <Chip>Pass Year: {safeText(getPassYear(r))}</Chip>
                              <Chip>Grade: {safeText(getGrade(r))}</Chip>
                            </div>

                            {safeText(getRemarks(r)) !== "—" && (
                              <div className="mt-2 text-[11.5px] font-bold text-slate-700">
                                Remarks:{" "}
                                <span className="font-extrabold text-slate-900">
                                  {safeText(getRemarks(r))}
                                </span>
                              </div>
                            )}
                          </div>

                          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-black text-white bg-slate-900">
                            {quaTypeLabel(getQuaType(r))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
