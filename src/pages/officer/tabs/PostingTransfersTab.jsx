import React, { useMemo, useState } from "react";
import {
  safeText,
  toDDMMYYYY,
  parseDateSafe,
  daysBetween,
  fmtYMDLong,
} from "../officerUtils/officerFormat.js";

/* -------------------------- small UI components --------------------------- */
const Chip = ({ children, tone = "light" }) => (
  <span
    className={[
      "px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-sm",
      tone === "dark"
        ? "bg-white/20 text-white border-white/20"
        : "bg-white/90 text-slate-800 border-slate-200/70",
    ].join(" ")}
  >
    {children}
  </span>
);

const ToggleBtn = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-xl text-[12px] font-black border border-white/25 transition",
      active
        ? "bg-white text-slate-900"
        : "bg-white/15 text-white hover:bg-white/20",
    ].join(" ")}
  >
    {children}
  </button>
);

/* --------------------------- normalize + sort (posting) ----------------------------- */
const getNotifNo = (r) =>
  r.NOTIFICATION_NO ||
  r.NOTIFICATIONNO ||
  r.NOTIF_NO ||
  r.NOTIFNO ||
  r.NOTIFICATIONNUMBER ||
  "";

const getNotifDate = (r) =>
  r.NOTIFY_DATE ||
  r.NOTIFYDATE ||
  r.NOTIFICATION_DATE ||
  r.NOTIF_DATE ||
  r.NOTIFICATIONDATE ||
  "";

const getPostingPerson = (r) =>
  r.POSTINGPERSON ||
  r.POSTING_PERSON ||
  r.POSTINGBY ||
  r.POSTEDBY ||
  r.ISSUEDBY ||
  r.ENTEREDBY ||
  r.CREATEDBY ||
  r.USERNAME ||
  "";

const normalizePostingRows = (rows) => {
  const list = (rows || []).map((r) => {
    const from = parseDateSafe(r.FDATE || r.DATEOFPOSTING);
    const to = parseDateSafe(r.TDATE) || new Date();
    const durationDays = daysBetween(from, to);

    const fromTxt = toDDMMYYYY(r.FDATE || r.DATEOFPOSTING);
    const toTxt = r.TDATE ? toDDMMYYYY(r.TDATE) : "Present";

    return {
      ...r,
      _from: from,
      _to: to,
      _durationDays: durationDays,
      _period: `${fromTxt} → ${toTxt}`,
      _notifNo: getNotifNo(r),
      _notifDate: getNotifDate(r),
      _postingPerson: getPostingPerson(r),
    };
  });

  list.sort(
    (a, b) => (a._from?.getTime?.() || 0) - (b._from?.getTime?.() || 0),
  );
  return list;
};

const applySort = (items, sortMode) => {
  const list = [...(items || [])];

  const byStart = (a, b) =>
    (a._from?.getTime?.() || 0) - (b._from?.getTime?.() || 0);
  const byLatest = (a, b) =>
    (b._to?.getTime?.() || 0) - (a._to?.getTime?.() || 0);
  const byDuration = (a, b) => (b._durationDays || 0) - (a._durationDays || 0);
  const byNotifDate = (a, b) => {
    const da = parseDateSafe(a._notifDate)?.getTime?.() || 0;
    const db = parseDateSafe(b._notifDate)?.getTime?.() || 0;
    return db - da;
  };

  if (sortMode === "latest") list.sort(byLatest);
  else if (sortMode === "duration") list.sort(byDuration);
  else if (sortMode === "notifDate") list.sort(byNotifDate);
  else list.sort(byStart);

  return list;
};

/* ----------------------------- History Card ------------------------------- */
const HistoryCard = ({ loading, rows }) => {
  const [sortMode, setSortMode] = useState("start");

  const baseItems = useMemo(() => normalizePostingRows(rows), [rows]);
  const items = useMemo(
    () => applySort(baseItems, sortMode),
    [baseItems, sortMode],
  );

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-black">
              Posting / Transfer History
            </div>
            <div className="text-[11px] font-bold text-white/90">
              Sorting + posting person + notification
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            {rows?.length || 0} Records
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            Sort
          </span>
          <ToggleBtn
            active={sortMode === "start"}
            onClick={() => setSortMode("start")}
          >
            Start
          </ToggleBtn>
          <ToggleBtn
            active={sortMode === "latest"}
            onClick={() => setSortMode("latest")}
          >
            Latest
          </ToggleBtn>
          <ToggleBtn
            active={sortMode === "duration"}
            onClick={() => setSortMode("duration")}
          >
            Duration
          </ToggleBtn>
          <ToggleBtn
            active={sortMode === "notifDate"}
            onClick={() => setSortMode("notifDate")}
          >
            Notif Date
          </ToggleBtn>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading history...
          </div>
        ) : !items.length ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No posting history found.
          </div>
        ) : (
          items.map((r, idx) => (
            <div
              key={`row-${idx}`}
              className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-slate-600">
                    {r._period}
                  </div>

                  <div className="mt-0.5 text-[13px] font-black text-slate-950 truncate">
                    {safeText(r.DISTRICTNAME)}{" "}
                    <span className="text-slate-300">/</span>{" "}
                    {safeText(r.SUBDIVNAME)}
                  </div>

                  <div className="text-[11.5px] font-bold text-slate-700 truncate">
                    {safeText(r.DESIGNATIONDESC || r.DESIGNATION)}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>Person: {safeText(r._postingPerson)}</Chip>
                    <Chip>Notif: {safeText(r._notifNo)}</Chip>
                    <Chip>
                      Notif Date:{" "}
                      {r._notifDate ? toDDMMYYYY(r._notifDate) : "—"}
                    </Chip>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black bg-slate-900 text-white">
                    {fmtYMDLong(r._durationDays)}
                  </span>
                  <div className="mt-1 text-[10.5px] font-black text-slate-500">
                    {r._durationDays || 0}d
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function PostingTransfersTab({ historyRows, historyLoading }) {
  return <HistoryCard loading={historyLoading} rows={historyRows} />;
}
