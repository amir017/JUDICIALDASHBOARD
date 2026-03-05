import React, { useMemo } from "react";
import {
  safeText,
  toDDMMYYYY,
  parseDateSafe,
  daysBetween,
} from "../officerUtils/officerFormat";

const Chip = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-sm bg-white/90 text-slate-800 border-slate-200/70">
    {children}
  </span>
);

/* =============================== Leaves =============================== */
const getLeaveType = (r) => r?.leave_type ?? r?.LEAVE_TYPE;
const getLeaveTypeDesc = (r) => r?.leave_type_desc ?? r?.LEAVE_TYPE_DESC;
const getLeaveFrom = (r) => r?.from_date ?? r?.FROM_DATE;
const getLeaveTo = (r) => r?.to_date ?? r?.TO_DATE;
const getLeaveRemarks = (r) => r?.remarks ?? r?.REMARKS;

const leaveTypeLabel = (t) => {
  const n = Number(t);
  if (n === 0) return "Casual Leave";
  if (n === 1) return "Earned Leave";
  if (n === 2) return "Special Leave";
  if (n === 3) return "Extra-Ordinary Leave";
  if (n === 4) return "Ex-Pakistan Leave";
  if (n === 5) return "Paternity Leave";
  if (n === 6) return "Maternity Leave";
  return "Unknown";
};

const leaveDays = (r) => {
  const f = parseDateSafe(getLeaveFrom(r));
  const t = parseDateSafe(getLeaveTo(r)) || new Date();
  if (!f) return 0;
  return Math.max(1, daysBetween(f, t) + 1);
};

const LeavesCard = ({ loading, rows }) => {
  const items = useMemo(() => {
    const list = [...(rows || [])];
    list.sort(
      (a, b) =>
        (parseDateSafe(getLeaveFrom(b))?.getTime?.() || 0) -
        (parseDateSafe(getLeaveFrom(a))?.getTime?.() || 0),
    );
    return list;
  }, [rows]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-black">Leaves</div>
            <div className="text-[11px] font-bold text-white/90">
              Leave records (latest first)
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            {rows?.length || 0} Records
          </span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading leaves...
          </div>
        ) : !items.length ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No leaves found.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((r, idx) => {
              const t = getLeaveType(r);
              const label = getLeaveTypeDesc(r) || leaveTypeLabel(t);
              const f = getLeaveFrom(r);
              const to = getLeaveTo(r);
              const d = leaveDays(r);

              const pillCls =
                Number(t) === 0
                  ? "bg-emerald-600"
                  : Number(t) === 1
                    ? "bg-indigo-600"
                    : Number(t) === 2
                      ? "bg-sky-600"
                      : Number(t) === 3
                        ? "bg-rose-600"
                        : Number(t) === 4
                          ? "bg-amber-600"
                          : Number(t) === 5
                            ? "bg-violet-600"
                            : Number(t) === 6
                              ? "bg-pink-600"
                              : "bg-slate-700";

              return (
                <div
                  key={`lv-${idx}`}
                  className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black text-white ${pillCls}`}
                        >
                          {label}
                        </span>

                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-900 text-white">
                          {d} days
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Chip>From: {f ? toDDMMYYYY(f) : "—"}</Chip>
                        <Chip>To: {to ? toDDMMYYYY(to) : "—"}</Chip>
                      </div>

                      {safeText(getLeaveRemarks(r)) !== "—" && (
                        <div className="mt-2 text-[11.5px] font-bold text-slate-700">
                          Remarks:{" "}
                          <span className="font-extrabold text-slate-900">
                            {safeText(getLeaveRemarks(r))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const LeavesYearlyCard = ({ loading, rows }) => {
  const grouped = useMemo(() => {
    const list = [...(rows || [])];
    const getYr = (r) => r?.yr ?? r?.YR;
    const getCnt = (r) => r?.cnt ?? r?.CNT;
    const getDays = (r) => r?.total_days ?? r?.TOTAL_DAYS;

    const byYear = {};
    for (const r of list) {
      const y = String(getYr(r) ?? "—");
      byYear[y] = byYear[y] || {
        year: y,
        totalDays: 0,
        totalCnt: 0,
        items: [],
      };
      const cnt = Number(getCnt(r) || 0);
      const days = Number(getDays(r) || 0);
      byYear[y].items.push(r);
      byYear[y].totalCnt += cnt;
      byYear[y].totalDays += days;
    }

    return Object.values(byYear).sort((a, b) => {
      if (a.year === "—") return 1;
      if (b.year === "—") return -1;
      return Number(b.year) - Number(a.year);
    });
  }, [rows]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-black">Leaves (Year-wise)</div>
            <div className="text-[11px] font-bold text-white/90">
              Summary by year and leave type
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            {rows?.length || 0} Rows
          </span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading yearly summary...
          </div>
        ) : !grouped.length ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No summary found.
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((y) => (
              <div
                key={`yr-${y.year}`}
                className="rounded-3xl border border-slate-200/70 bg-white/70 overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-sky-50 flex items-center justify-between">
                  <div className="text-[12px] font-black text-slate-900">
                    {y.year}
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white border border-slate-200 text-slate-800">
                      {y.totalCnt} leaves
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-900 text-white">
                      {Math.round(y.totalDays)} days
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {y.items.map((r, idx) => {
                    const label =
                      (r?.leave_type_desc ?? r?.LEAVE_TYPE_DESC) ||
                      leaveTypeLabel(getLeaveType(r));
                    const cnt = Number(r?.cnt ?? r?.CNT ?? 0);
                    const days = Number(r?.total_days ?? r?.TOTAL_DAYS ?? 0);

                    return (
                      <div
                        key={`row-${y.year}-${idx}`}
                        className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[12px] font-black text-slate-950 truncate">
                              {label}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Chip>Count: {cnt}</Chip>
                              <Chip>Total Days: {Math.round(days)}</Chip>
                            </div>
                          </div>

                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-900 text-white">
                            {Math.round(days)}d
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function LeavesTab({
  leaveYearRows,
  leaveYearLoading,
  leaveRows,
  leaveLoading,
}) {
  return (
    <div className="space-y-4">
      <LeavesYearlyCard loading={leaveYearLoading} rows={leaveYearRows} />
      <LeavesCard loading={leaveLoading} rows={leaveRows} />
    </div>
  );
}
