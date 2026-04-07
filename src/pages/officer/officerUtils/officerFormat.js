import { intervalToDuration } from "date-fns";

// src/components/officerUtils/officerFormat.js

export const toDDMMYYYY = (val) => {
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

export const parseDateSafe = (val) => {
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

export const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((bb - aa) / ms));
};

// y/m/d display (approx)
export const ymdFromDays = (totalDays) => {
  const d = Math.max(0, Number(totalDays || 0));
  const years = Math.floor(d / 365);
  const rem = d % 365;
  const months = Math.floor(rem / 30);
  const days = rem % 30;
  return { years, months, days, totalDays: d };
};

export const fmtYMDLong = (totalDays) => {
  const { years, months, days } = ymdFromDays(totalDays);
  return `${years}y ${months}m ${days}d`;
};

/** Calendar-accurate years/months/days between two dates (for career span, not rough day/365). */
export const fmtCalendarSpan = (start, end) => {
  if (!start || !end) return "—";
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) {
    return "—";
  }
  const { years = 0, months = 0, days = 0 } = intervalToDuration({
    start: s,
    end: e,
  });
  return `${years}y ${months}m ${days}d`;
};

export const safeText = (v) => {
  if (v === null || v === undefined) return "—";
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s) return "—";
  const low = s.toLowerCase();
  if (low === "null" || low === "undefined" || low === "n/a") return "—";
  return s;
};

export const safeDate = (v) => {
  const s = safeText(v);
  if (s === "—") return "—";
  return toDDMMYYYY(s);
};

export const safeJoin = (a, b) => {
  const A = safeText(a);
  const B = safeText(b);
  if (A === "—" && B === "—") return "—";
  if (A !== "—" && B !== "—") return `${A} / ${B}`;
  return A !== "—" ? A : B;
};

export const hashString = (s) => {
  const str = String(s ?? "");
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
};

export const getInitials = (name) => {
  const s = String(name || "").trim();
  if (!s) return "OF";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "O";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
};
