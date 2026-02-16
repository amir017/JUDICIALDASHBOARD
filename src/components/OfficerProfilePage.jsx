// OfficerProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Calendar, IdCard, Phone, Home } from "lucide-react";
import Layout from "./Layout";
import Api from "../API/Api";

/* ------------------------- helpers: date formatting ------------------------ */
const toDDMMYYYY = (val) => {
  if (!val) return "—";
  const s = String(val).trim();
  if (!s) return "—";

  const dmY = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmY) {
    const dd = String(dmY[1]).padStart(2, "0");
    const mm = String(dmY[2]).padStart(2, "0");
    const yyyy = dmY[3];
    return `${dd}-${mm}-${yyyy}`;
  }

  const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = String(ymd[2]).padStart(2, "0");
    const dd = String(ymd[3]).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  }

  return s;
};

const parseDateSafe = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  const dmY = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmY) return new Date(Number(dmY[3]), Number(dmY[2]) - 1, Number(dmY[1]));

  const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((bb - aa) / ms));
};

// y/m/d display (approx)
const ymdFromDays = (totalDays) => {
  const d = Math.max(0, Number(totalDays || 0));
  const years = Math.floor(d / 365);
  const rem = d % 365;
  const months = Math.floor(rem / 30);
  const days = rem % 30;
  return { years, months, days, totalDays: d };
};
const fmtYMDLong = (totalDays) => {
  const { years, months, days } = ymdFromDays(totalDays);
  return `${years}y ${months}m ${days}d`;
};

/* --------------------- sanitize text so never blank --------------------- */
const safeText = (v) => {
  if (v === null || v === undefined) return "—";
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s) return "—";
  const low = s.toLowerCase();
  if (low === "null" || low === "undefined" || low === "n/a") return "—";
  return s;
};

const safeDate = (v) => {
  const s = safeText(v);
  if (s === "—") return "—";
  return toDDMMYYYY(s);
};

const safeJoin = (a, b) => {
  const A = safeText(a);
  const B = safeText(b);
  if (A === "—" && B === "—") return "—";
  if (A !== "—" && B !== "—") return `${A} / ${B}`;
  return A !== "—" ? A : B;
};

/* -------------------------- small UI components --------------------------- */
const hashString = (s) => {
  const str = String(s ?? "");
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
};

const getInitials = (name) => {
  const s = String(name || "").trim();
  if (!s) return "OF";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "O";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
};

const badgeCls = () =>
  "px-3 py-1 rounded-full text-[12px] font-black border border-white/25 bg-white/15 text-white shadow-sm backdrop-blur";

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

/* --------------------- eye-catching “Quick Details” UI --------------------- */
const SoftIcon = ({ icon: Icon, tint = "emerald" }) => {
  const cls =
    tint === "grey"
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : tint === "coolGrey"
        ? "bg-slate-200 text-slate-800 ring-slate-300"
        : tint === "blueGrey"
          ? "bg-slate-100 text-slate-800 ring-slate-300"
          : tint === "steel"
            ? "bg-blue-100 text-blue-800 ring-blue-200"
            : tint === "indigo"
              ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
              : tint === "cyan"
                ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
                : tint === "teal"
                  ? "bg-teal-50 text-teal-700 ring-teal-100"
                  : tint === "sky"
                    ? "bg-sky-50 text-sky-700 ring-sky-100"
                    : tint === "violet"
                      ? "bg-violet-50 text-violet-700 ring-violet-100"
                      : tint === "rose"
                        ? "bg-rose-50 text-rose-700 ring-rose-100"
                        : tint === "amber"
                          ? "bg-amber-50 text-amber-700 ring-amber-100"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return (
    <span
      className={`h-10 w-10 rounded-2xl grid place-items-center ring-1 ${cls}`}
    >
      <Icon size={18} />
    </span>
  );
};

const InfoTile = ({ icon, tint = "emerald", label, value, wide = false }) => {
  const v = safeText(value);
  const accent =
    tint === "grey"
      ? "from-slate-300/30 to-slate-100"
      : tint === "coolGrey"
        ? "from-slate-400/25 to-slate-200/20"
        : tint === "blueGrey"
          ? "from-slate-400/25 to-blue-200/20"
          : tint === "steel"
            ? "from-blue-500/20 to-blue-300/10"
            : tint === "indigo"
              ? "from-indigo-500/20 to-indigo-300/10"
              : tint === "cyan"
                ? "from-blue-500/25 via-sky-400/15 to-indigo-400/10"
                : tint === "sky"
                  ? "from-sky-400/20 to-slate-200/20"
                  : tint === "violet"
                    ? "from-violet-500/15 to-fuchsia-500/10"
                    : tint === "rose"
                      ? "from-rose-500/15 to-pink-500/10"
                      : tint === "amber"
                        ? "from-amber-500/15 to-orange-500/10"
                        : "from-emerald-500/15 to-teal-500/10";

  return (
    <div
      className={[
        "rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm",
        "hover:shadow-md transition overflow-hidden",
        wide ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className={`p-4 bg-gradient-to-br ${accent}`}>
        <div className="flex items-start gap-3">
          <SoftIcon icon={icon} tint={tint} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-600">
              {label}
            </div>
            <div
              className={[
                "mt-1 text-[15px] md:text-[15.5px] font-black break-words",
                v === "—" ? "text-slate-400" : "text-slate-950",
              ].join(" ")}
            >
              {v}
            </div>
            {v === "—" ? (
              <div className="mt-1 text-[11px] font-bold text-slate-500">
                Not available
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryPills = ({ CNIC, CELL, POSTING }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-sky-50 to-white px-3 py-2 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
        CNIC
      </div>
      <div className="mt-0.5 text-[13px] font-black text-slate-950 break-words">
        {safeText(CNIC)}
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-emerald-50 to-white px-3 py-2 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
        Cell
      </div>
      <div className="mt-0.5 text-[13px] font-black text-slate-950 break-words">
        {safeText(CELL)}
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-violet-50 to-white px-3 py-2 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
        Posting
      </div>
      <div className="mt-0.5 text-[13px] font-black text-slate-950 break-words">
        {safeText(POSTING)}
      </div>
    </div>
  </div>
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
          <Chip tone="dark">Person: {safeText(current._postingPerson)}</Chip>
          <Chip tone="dark">Notif: {safeText(current._notifNo)}</Chip>
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

/* ========================= Graph 1: Baseline (Horizontal) ========================= */
const GraphBaseline = ({ items }) => {
  const maxDays = useMemo(
    () => Math.max(1, ...items.map((x) => x._durationDays || 0)),
    [items],
  );

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-sky-50 flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-black text-slate-900">
            Baseline Timeline
          </div>
          <div className="text-[11px] font-bold text-slate-500">
            Tight spacing • scroll sideways
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white border border-slate-200 text-slate-800">
          {items.length} records
        </span>
      </div>

      <div className="p-3 overflow-x-auto">
        <div className="relative min-w-fit">
          <div className="absolute left-0 right-0 top-[26px] h-[4px] rounded-full bg-slate-200/80" />
          <div className="absolute left-0 right-0 top-[23px] h-[10px] rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 opacity-10 blur-sm" />

          <div className="relative flex items-start gap-3 pr-3">
            {items.map((r, idx) => {
              const pct = Math.max(
                8,
                Math.round(((r._durationDays || 0) / maxDays) * 100),
              );
              return (
                <div
                  key={`base-${idx}`}
                  className="relative w-[340px] shrink-0"
                >
                  <div className="absolute left-4 top-[18px]">
                    <div className="group relative">
                      <div className="h-5 w-5 rounded-full bg-white border-2 border-emerald-600 shadow-sm" />
                      <div className="pointer-events-none absolute -inset-2 rounded-full bg-emerald-400/20 blur-md opacity-0 group-hover:opacity-100 transition" />
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
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[10.5px] font-black text-slate-500">
                        {r._durationDays || 0} days
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip>Notif: {safeText(r._notifNo)}</Chip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================= Graph 2: Duration Bars (List) ========================= */
const GraphBars = ({ items }) => {
  const maxDays = useMemo(
    () => Math.max(1, ...items.map((x) => x._durationDays || 0)),
    [items],
  );

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-sky-50">
        <div className="text-[12px] font-black text-slate-900">
          Duration Bars
        </div>
        <div className="text-[11px] font-bold text-slate-500">
          Compact list • easy comparison
        </div>
      </div>

      <div className="p-3 space-y-2">
        {items.map((r, idx) => {
          const pct = Math.max(
            6,
            Math.round(((r._durationDays || 0) / maxDays) * 100),
          );
          return (
            <div
              key={`bar-${idx}`}
              className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2.5"
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

              <div className="mt-2 h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ----------------------------- History Card ------------------------------- */
const HistoryCard = ({ loading, rows }) => {
  const [graphType, setGraphType] = useState("baseline");
  const [sortMode, setSortMode] = useState("start");

  const baseItems = useMemo(() => normalizePostingRows(rows), [rows]);
  const items = useMemo(
    () => applySort(baseItems, sortMode),
    [baseItems, sortMode],
  );

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden mt-4">
      <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-black">
              Posting / Transfer History
            </div>
            <div className="text-[11px] font-bold text-white/90">
              Graph selection + sorting + posting person + notification
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            {rows?.length || 0} Records
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25">
            Graph
          </span>
          <ToggleBtn
            active={graphType === "baseline"}
            onClick={() => setGraphType("baseline")}
          >
            Baseline
          </ToggleBtn>
          <ToggleBtn
            active={graphType === "bars"}
            onClick={() => setGraphType("bars")}
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

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading history...
          </div>
        ) : graphType === "baseline" ? (
          <GraphBaseline items={items} />
        ) : (
          <GraphBars items={items} />
        )}
      </div>
    </div>
  );
};

/* ============================= Qualifications ============================= */
/* Oracle often returns UPPERCASE keys, so read both */
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

/* colorful + ellipsis education pill */
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

const QualificationsCard = ({ loading, rows }) => {
  const grouped = useMemo(() => {
    const list = [...(rows || [])];
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
  }, [rows]);

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
            {rows?.length || 0} Records
          </span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading qualifications...
          </div>
        ) : !rows?.length ? (
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
                    {items.map((r, idx) => {
                      const type = quaTypeLabel(getQuaType(r));
                      const typeCls =
                        type === "Academic"
                          ? "bg-emerald-600"
                          : type === "Professional"
                            ? "bg-indigo-600"
                            : type === "Other"
                              ? "bg-amber-600"
                              : "bg-slate-700";

                      return (
                        <div
                          key={`${k}-${idx}`}
                          className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {/* Education (colorful + ellipsis) + Institute (ellipsis) */}
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
                                  {getToDate(r)
                                    ? toDDMMYYYY(getToDate(r))
                                    : "—"}
                                </Chip>
                                <Chip>
                                  Pass Year: {safeText(getPassYear(r))}
                                </Chip>
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

                            <span
                              className={`shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-black text-white ${typeCls}`}
                            >
                              {type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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

/* ------------------------------------------------------------------------- */
export default function OfficerProfilePage({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const officerId = location.state?.officerId;

  const [profile, setProfile] = useState(null);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRows, setHistoryRows] = useState([]);

  const [qualLoading, setQualLoading] = useState(true);
  const [qualRows, setQualRows] = useState([]);

  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveRows, setLeaveRows] = useState([]);

  const [leaveYearLoading, setLeaveYearLoading] = useState(true);
  const [leaveYearRows, setLeaveYearRows] = useState([]);

  const [activeTab, setActiveTab] = useState("posting"); // posting | qual | leaves

  // posting history
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setHistoryLoading(true);
        if (!officerId) {
          setHistoryRows([]);
          return;
        }
        const rows = await Api.getOfficerPostingHistory({ officerId });
        if (!mounted) return;
        setHistoryRows(rows || []);
      } catch (e) {
        console.error("OfficerProfilePage history load error:", e);
        if (!mounted) return;
        setHistoryRows([]);
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [officerId]);

  // qualifications
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setQualLoading(true);
        if (!officerId) {
          setQualRows([]);
          return;
        }
        const rows = await Api.getOfficerQualifications({ officerId });
        if (!mounted) return;
        setQualRows(rows || []);
      } catch (e) {
        console.error("OfficerProfilePage qualifications load error:", e);
        if (!mounted) return;
        setQualRows([]);
      } finally {
        if (mounted) setQualLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [officerId]);

  // leaves list
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLeaveLoading(true);
        if (!officerId) {
          setLeaveRows([]);
          return;
        }
        const rows = await Api.getOfficerLeaves({ officerId });
        if (!mounted) return;
        setLeaveRows(rows || []);
      } catch (e) {
        console.error("OfficerProfilePage leaves load error:", e);
        if (!mounted) return;
        setLeaveRows([]);
      } finally {
        if (mounted) setLeaveLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [officerId]);

  // leaves yearly
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLeaveYearLoading(true);
        if (!officerId) {
          setLeaveYearRows([]);
          return;
        }
        const rows = await Api.getOfficerLeavesYearly({ officerId });
        if (!mounted) return;
        setLeaveYearRows(rows || []);
      } catch (e) {
        console.error("OfficerProfilePage leaves-yearly load error:", e);
        if (!mounted) return;
        setLeaveYearRows([]);
      } finally {
        if (mounted) setLeaveYearLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [officerId]);

  // profile
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!officerId) {
          setProfile(null);
          return;
        }
        const res = await Api.getOfficerProfile({ officerId });
        if (!mounted) return;
        setProfile(res ?? null);
      } catch (e) {
        console.error("OfficerProfilePage load error:", e);
        if (!mounted) return;
        setProfile(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [officerId]);

  const pictureSrc = useMemo(() => {
    if (!profile) return null;
    const b64 = profile.PHOTO_BASE64 || profile.PHOTOBASE64;
    const mime = profile.PHOTO_MIME || "image/jpeg";
    if (b64 && String(b64).trim()) return `data:${mime};base64,${b64}`;
    return profile.PHOTO_URL || profile.PHOTOURL || null;
  }, [profile]);

  const palette = useMemo(() => {
    const key =
      profile?.DESIGNATIONDESC ||
      profile?.DESIGNATION ||
      profile?.OFFICERNAME ||
      officerId ||
      "NA";
    hashString(key);

    return {
      hero: "from-emerald-700 via-teal-600 to-sky-600",
      glow1: "bg-emerald-300/30",
      glow2: "bg-sky-300/25",
    };
  }, [profile, officerId]);

  const name = safeText(profile?.OFFICERNAME) || "Officer";
  const desig = safeText(profile?.DESIGNATIONDESC || profile?.DESIGNATION);

  const CNIC = safeText(profile?.CNICNO || profile?.CNIC || profile?.NICNO);
  const CELL = safeText(profile?.CELLNO || profile?.CELL || profile?.MOBILE);
  const ADDRESS = safeText(
    profile?.ADDRESS ||
      profile?.HOMEADDRESS ||
      profile?.POSTALADDRESS ||
      profile?.PRESENTADDRESS ||
      profile?.PERMANENTADDRESS,
  );

  const POSTING = safeJoin(profile?.DISTRICTNAME, profile?.SUBDIVNAME);

  return (
    <Layout onLogout={onLogout}>
      <div className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50/40 px-4 py-4">
        <div
          className={`pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full ${palette.glow1} blur-3xl`}
        />
        <div
          className={`pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full ${palette.glow2} blur-3xl`}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 font-extrabold shadow-sm hover:bg-white"
          >
            ← Back
          </button>

          <div className="flex-1">
            <div className="text-[11px] text-slate-600 font-extrabold tracking-wider">
              OFFICER PROFILE
            </div>
            <div className="text-xl md:text-2xl font-black text-slate-900">
              {name}
              {officerId ? (
                <span className="ml-2 text-sm font-extrabold text-slate-500">
                  (ID: {officerId})
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm bg-white/80 backdrop-blur">
              <div className={`p-5 bg-gradient-to-r ${palette.hero}`}>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white font-black overflow-hidden shadow-sm">
                    {pictureSrc ? (
                      <img
                        src={pictureSrc}
                        alt="Officer"
                        className="h-full w-full object-cover"
                        style={{ objectPosition: "50% 5%" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white font-black">
                        {getInitials(name)}
                      </div>
                    )}
                  </div>

                  <div className="text-white">
                    <div className="text-xl font-black leading-tight">
                      {name}
                    </div>
                    <div className="text-[13px] font-bold text-white/90">
                      {desig}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={badgeCls()}>
                        PF: {safeText(profile?.PFNO)}
                      </span>
                      <span className={badgeCls()}>
                        CR: {safeText(profile?.CRNO)}
                      </span>
                      <span className={badgeCls()}>
                        Blood: {safeText(profile?.BLOODG)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Details */}
              <div className="p-5">
                <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5">
                  <SummaryPills CNIC={CNIC} CELL={CELL} POSTING={POSTING} />

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoTile
                      icon={MapPin}
                      tint="cyan"
                      label="Domicile"
                      value={profile?.DOMICILE}
                    />
                    <InfoTile
                      icon={Calendar}
                      tint="cyan"
                      label="DOB"
                      value={safeDate(profile?.DOB)}
                    />

                    <InfoTile
                      icon={IdCard}
                      tint="cyan"
                      label="CNIC"
                      value={CNIC}
                    />
                    <InfoTile
                      icon={Phone}
                      tint="cyan"
                      label="Cell No"
                      value={CELL}
                    />

                    <InfoTile
                      icon={Home}
                      tint="cyan"
                      label="Address"
                      value={ADDRESS}
                      wide
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-8 space-y-4">
            {/* Tabs header */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white flex items-center justify-between">
                <div className="text-[14px] font-black">Details</div>
                <div className="flex gap-2">
                  <ToggleBtn
                    active={activeTab === "posting"}
                    onClick={() => setActiveTab("posting")}
                  >
                    Posting / Transfers
                  </ToggleBtn>
                  <ToggleBtn
                    active={activeTab === "qual"}
                    onClick={() => setActiveTab("qual")}
                  >
                    Qualifications
                  </ToggleBtn>
                  <ToggleBtn
                    active={activeTab === "leaves"}
                    onClick={() => setActiveTab("leaves")}
                  >
                    Leaves
                  </ToggleBtn>
                </div>
              </div>
            </div>

            {activeTab === "posting" ? (
              <>
                <CurrentPostingBanner rows={historyRows} />
                <HistoryCard loading={historyLoading} rows={historyRows} />
              </>
            ) : activeTab === "qual" ? (
              <QualificationsCard loading={qualLoading} rows={qualRows} />
            ) : (
              <div className="space-y-4">
                <LeavesYearlyCard
                  loading={leaveYearLoading}
                  rows={leaveYearRows}
                />
                <LeavesCard loading={leaveLoading} rows={leaveRows} />
              </div>
            )}

            {!officerId && (
              <div className="mt-4 text-slate-600 font-bold">
                No officerId received. Please open profile using the “View”
                button.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
