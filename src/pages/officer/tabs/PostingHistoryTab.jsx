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

/* --------------------------- normalize + sort ----------------------------- */
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

const getExCadre = (r) =>
  safeText(
    r.ex_cadre_Court ||
      r.EX_CADRE_COURT ||
      r.EX_CADRE ||
      r.EXCADRECOURT ||
      r.EX_CADER_COURT ||
      "—",
  );

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

    const fromTxt = toDDMMYYYY(r.FDATE || r.DATEOFPOSTING);
    const nextR = ordered[i + 1]?.r;
    const toTxt = explicitTo
      ? toDDMMYYYY(r.TDATE)
      : nextR
        ? toDDMMYYYY(nextR.FDATE || nextR.DATEOFPOSTING) || "—"
        : "Present";

    return {
      ...r,
      _from: from,
      _to: to,
      _durationDays: durationDays,
      _period: `${fromTxt} → ${toTxt}`,
      _notifNo: getNotifNo(r),
      _notifDate: getNotifDate(r),
      _postingPerson: getPostingPerson(r),
      _exCadre: getExCadre(r),
    };
  });

  return list;
};

const applySort = (items, sortMode) => {
  const list = [...(items || [])];

  const byStart = (a, b) =>
    (a._from?.getTime?.() || 0) - (b._from?.getTime?.() || 0);
  const byLatest = (a, b) =>
    (b._to?.getTime?.() || 0) - (a._to?.getTime?.() || 0);
  const byDuration = (a, b) => (b._durationDays || 0) - (a._durationDays || 0);
  const byDistrict = (a, b) =>
    safeText(a.DISTRICTNAME).localeCompare(safeText(b.DISTRICTNAME));
  const byDesignation = (a, b) =>
    safeText(a.DESIGNATIONDESC || a.DESIGNATION).localeCompare(
      safeText(b.DESIGNATIONDESC || b.DESIGNATION),
    );
  const byNotifDate = (a, b) => {
    const da = parseDateSafe(a._notifDate)?.getTime?.() || 0;
    const db = parseDateSafe(b._notifDate)?.getTime?.() || 0;
    return db - da;
  };

  if (sortMode === "latest") list.sort(byLatest);
  else if (sortMode === "duration") list.sort(byDuration);
  else if (sortMode === "district") list.sort(byDistrict);
  else if (sortMode === "designation") list.sort(byDesignation);
  else if (sortMode === "notifDate") list.sort(byNotifDate);
  else list.sort(byStart);

  return list;
};

/* --------------------------- split logic ---------------------------------- */
/*
  Rule:
  - OTHER COURTS = In Field
  - all other values = Ex-Cadre
*/
const getPostingBucket = (row) => {
  const value = safeText(row._exCadre).trim().toUpperCase();
  if (value === "OTHER COURTS") return "In Field";
  return "Ex-Cadre";
};

const splitPostingRows = (items) => {
  const inField = [];
  const exCadre = [];

  (items || []).forEach((item) => {
    const bucket = getPostingBucket(item);
    if (bucket === "In Field") inField.push(item);
    else exCadre.push(item);
  });

  return { inField, exCadre };
};

/* ========================= CURRENT POSTING BANNER ========================= */
const CurrentPostingBanner = ({ rows }) => {
  const current = useMemo(() => {
    const items = normalizePostingRows(rows);
    if (!items.length) return null;

    const present = items.filter((x) => !x.TDATE || !String(x.TDATE).trim());
    if (present.length) {
      present.sort(
        (a, b) => (b._from?.getTime?.() || 0) - (a._from?.getTime?.() || 0),
      );
      return present[0];
    }

    const copy = [...items];
    copy.sort((a, b) => (b._to?.getTime?.() || 0) - (a._to?.getTime?.() || 0));
    return copy[0] || null;
  }, [rows]);

  if (!current) return null;

  const district = safeText(current.DISTRICTNAME);
  const tehsil = safeText(current.SUBDIVNAME);
  const desig = safeText(current.DESIGNATIONDESC || current.DESIGNATION);

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm">
      <div className="relative bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white p-4">
        <div className="pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.22em] uppercase text-white/90">
              Current Posting
            </div>

            <div className="mt-1 text-[18px] md:text-[20px] font-black leading-tight truncate">
              {district} <span className="text-white/40">/</span> {tehsil}
            </div>

            <div className="mt-0.5 text-[12.5px] font-bold text-white/90 truncate">
              {desig}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="px-3 py-2 rounded-2xl bg-white/15 border border-white/25 backdrop-blur">
              <div className="text-[10px] font-extrabold tracking-[0.22em] uppercase text-white/85">
                Duration
              </div>
              <div className="text-[16px] font-black leading-tight">
                {fmtYMDLong(current._durationDays)}
              </div>
              <div className="text-[11px] font-black text-white/85">
                {current._durationDays || 0} days
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-3 flex flex-wrap gap-2">
          <Chip tone="dark">
            From: {toDDMMYYYY(current.FDATE || current.DATEOFPOSTING)}
          </Chip>
          <Chip tone="dark">
            To: {current.TDATE ? toDDMMYYYY(current.TDATE) : "Present"}
          </Chip>

          {getPostingBucket(current) === "Ex-Cadre" &&
            safeText(current._exCadre) !== "—" &&
            safeText(current._exCadre).toUpperCase() !== "OTHER COURTS" && (
              <span className="px-3 py-1.5 rounded-full text-[11px] font-black bg-violet-700 text-white border border-violet-600 shadow-sm">
                ⚖ {safeText(current._exCadre)}
              </span>
            )}

          {safeText(current._postingPerson) !== "—" && (
            <Chip tone="dark">Person: {safeText(current._postingPerson)}</Chip>
          )}

          {safeText(current._notifNo) !== "—" && (
            <Chip tone="dark">Notif: {safeText(current._notifNo)}</Chip>
          )}

          <Chip tone="dark">
            Notif Date:{" "}
            {current._notifDate ? toDDMMYYYY(current._notifDate) : "—"}
          </Chip>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur px-4 py-3 border-t border-slate-200/60">
        <div className="text-[11px] font-bold text-slate-600">
          Showing current posting based on latest record (Present / most
          recent).
        </div>
      </div>
    </div>
  );
};

/* ========================= SINGLE BASELINE ========================= */
const GraphBaseline = ({ items, title, subtitle, tone = "green" }) => {
  const maxDays = useMemo(
    () => Math.max(1, ...items.map((x) => x._durationDays || 0)),
    [items],
  );

  const scrollRef = React.useRef(null);

  const scrollByAmount = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const accentBorder =
    tone === "green" ? "border-emerald-600" : "border-violet-600";
  const accentGlow =
    tone === "green" ? "bg-emerald-400/20" : "bg-violet-400/20";
  const accentLine =
    tone === "green"
      ? "from-emerald-600 via-teal-600 to-sky-600"
      : "from-violet-600 via-fuchsia-600 to-indigo-600";

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-sky-50 flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-black text-slate-900">{title}</div>
          <div className="text-[11px] font-bold text-slate-500">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-700 font-black shadow-sm hover:bg-slate-50"
            title="Scroll left"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-700 font-black shadow-sm hover:bg-slate-50"
            title="Scroll right"
          >
            →
          </button>

          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white border border-slate-200 text-slate-800">
            {items.length} postings
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="p-3 overflow-x-auto">
        {items.length === 0 ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No records found
          </div>
        ) : (
          <div className="relative min-w-fit">
            <div className="absolute left-0 right-0 top-[26px] h-[4px] rounded-full bg-slate-200/80" />
            <div
              className={`absolute left-0 right-0 top-[23px] h-[10px] rounded-full bg-gradient-to-r ${accentLine} opacity-10 blur-sm`}
            />

            <div className="relative flex items-start gap-3 pr-3">
              {items.map((r, idx) => {
                const pct = Math.max(
                  8,
                  Math.round(((r._durationDays || 0) / maxDays) * 100),
                );

                return (
                  <div
                    key={`${title}-${idx}`}
                    className="relative w-[360px] shrink-0"
                  >
                    <div className="absolute left-4 top-[18px]">
                      <div className="group relative">
                        <div
                          className={`h-5 w-5 rounded-full bg-white border-2 ${accentBorder} shadow-sm`}
                        />
                        <div
                          className={`pointer-events-none absolute -inset-2 rounded-full ${accentGlow} blur-md opacity-0 group-hover:opacity-100 transition`}
                        />
                      </div>
                    </div>

                    <div className="mt-12 rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur px-3 py-2.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
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
                        </div>

                        <span className="shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-slate-900 text-white">
                          {fmtYMDLong(r._durationDays)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${accentLine}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[10.5px] font-black text-slate-500">
                          {r._durationDays || 0} days
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {getPostingBucket(r) === "Ex-Cadre" &&
                          safeText(r._exCadre) !== "—" &&
                          safeText(r._exCadre).toUpperCase() !==
                            "OTHER COURTS" && (
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-black bg-violet-700 text-white border border-violet-600 shadow-sm">
                              ⚖ {safeText(r._exCadre)}
                            </span>
                          )}

                        {safeText(r._postingPerson) !== "—" && (
                          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-800">
                            Person: {safeText(r._postingPerson)}
                          </span>
                        )}

                        {safeText(r._notifNo) !== "—" && (
                          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-800">
                            Notif: {safeText(r._notifNo)}
                          </span>
                        )}

                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-800">
                          Notif Date:{" "}
                          {r._notifDate ? toDDMMYYYY(r._notifDate) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================= BARS ========================= */
const GraphBars = ({ items, title, subtitle, tone = "green" }) => {
  const maxDays = useMemo(
    () => Math.max(1, ...items.map((x) => x._durationDays || 0)),
    [items],
  );

  const accentLine =
    tone === "green"
      ? "from-emerald-600 via-teal-600 to-sky-600"
      : "from-violet-600 via-fuchsia-600 to-indigo-600";

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 overflow-hidden h-full">
      <div className="px-4 py-2.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-sky-50 flex items-center justify-between">
        <div>
          <div className="text-[12px] font-black text-slate-900">{title}</div>
          <div className="text-[11px] font-bold text-slate-500">{subtitle}</div>
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white border border-slate-200 text-slate-800">
          {items.length} postings
        </span>
      </div>

      <div className="p-3 space-y-2">
        {items.length === 0 ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No records found
          </div>
        ) : (
          items.map((r, idx) => {
            const pct = Math.max(
              6,
              Math.round(((r._durationDays || 0) / maxDays) * 100),
            );

            return (
              <div
                key={`${title}-bar-${idx}`}
                className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
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

                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      {getPostingBucket(r) === "Ex-Cadre" &&
                        safeText(r._exCadre) !== "—" &&
                        safeText(r._exCadre).toUpperCase() !==
                          "OTHER COURTS" && (
                          <span className="px-3 py-1.5 rounded-full text-[11px] font-black bg-violet-700 text-white border border-violet-600 shadow-sm">
                            ⚖ {safeText(r._exCadre)}
                          </span>
                        )}

                      {safeText(r._postingPerson) !== "—" && (
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-800">
                          Person: {safeText(r._postingPerson)}
                        </span>
                      )}

                      {safeText(r._notifNo) !== "—" && (
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-800">
                          Notif: {safeText(r._notifNo)}
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-800">
                        Notif Date:{" "}
                        {r._notifDate ? toDDMMYYYY(r._notifDate) : "—"}
                      </span>
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

                <div className="mt-2 h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${accentLine}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ========================= DUAL VIEWS ========================= */
const DualBaselineView = ({ inFieldItems, exCadreItems }) => {
  return (
    <div className="space-y-4">
      <GraphBaseline
        items={inFieldItems}
        title="In Field"
        subtitle="Baseline timeline"
        tone="green"
      />

      <GraphBaseline
        items={exCadreItems}
        title="Ex-Cadre"
        subtitle="Baseline timeline"
        tone="violet"
      />
    </div>
  );
};

const DualBarsView = ({ inFieldItems, exCadreItems }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      <GraphBars
        items={inFieldItems}
        title="In Field"
        subtitle="Duration bars"
        tone="green"
      />

      <GraphBars
        items={exCadreItems}
        title="Ex-Cadre"
        subtitle="Duration bars"
        tone="violet"
      />
    </div>
  );
};

/* ----------------------------- Main Tab ------------------------------- */
export default function PostingHistoryTab({ historyRows, historyLoading }) {
  const [sortMode, setSortMode] = useState("start");
  const [viewMode, setViewMode] = useState("baseline");

  const baseItems = useMemo(
    () => normalizePostingRows(historyRows),
    [historyRows],
  );

  const items = useMemo(
    () => applySort(baseItems, sortMode),
    [baseItems, sortMode],
  );

  const { inField, exCadre } = useMemo(() => splitPostingRows(items), [items]);

  return (
    <div className="space-y-4">
      <CurrentPostingBanner rows={historyRows} />

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-black">
                Posting / Transfer History
              </div>
              <div className="text-[11px] font-bold text-white/90">
                In Field and Ex-Cadre split view
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
              {historyRows?.length || 0} Records
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
              View
            </span>

            <ToggleBtn
              active={viewMode === "baseline"}
              onClick={() => setViewMode("baseline")}
            >
              Baseline
            </ToggleBtn>

            <ToggleBtn
              active={viewMode === "bars"}
              onClick={() => setViewMode("bars")}
            >
              Bars
            </ToggleBtn>

            <span className="ml-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
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

            <ToggleBtn
              active={sortMode === "district"}
              onClick={() => setSortMode("district")}
            >
              District
            </ToggleBtn>

            <ToggleBtn
              active={sortMode === "designation"}
              onClick={() => setSortMode("designation")}
            >
              Designation
            </ToggleBtn>
          </div>
        </div>

        <div className="p-4 min-h-[720px]">
          {historyLoading ? (
            <div className="py-10 text-center text-slate-500 font-bold">
              Loading history...
            </div>
          ) : viewMode === "baseline" ? (
            <DualBaselineView inFieldItems={inField} exCadreItems={exCadre} />
          ) : (
            <DualBarsView inFieldItems={inField} exCadreItems={exCadre} />
          )}
        </div>
      </div>
    </div>
  );
}
