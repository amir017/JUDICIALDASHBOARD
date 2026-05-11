/** Shared helpers for Punjab division GeoJSON maps (no Turf). */

import { geoMercator, geoPath } from "d3-geo";
import { parseDateSafe } from "../officerUtils/officerFormat.js";
import { PUNJAB_DIVISION_ORDER } from "./punjabDivisionMapTheme.js";

/** Larger canvas → sharper Mercator fit on wide layouts. */
export const PUNJAB_MAP_VIEWBOX = { w: 1680, h: 1120 };
export const PUNJAB_MAP_PAD = 18;

export function punjabGeoJsonFetchUrl() {
  const base = String(import.meta.env.BASE_URL ?? "/");
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}geo/punjab_divisions.geojson`;
}

export function normalizeFeatureCollection(raw) {
  if (raw == null || typeof raw !== "object") return null;
  let cur = raw;
  for (let depth = 0; depth < 5; depth += 1) {
    if (cur?.type === "FeatureCollection" && Array.isArray(cur.features)) return cur;
    const next = cur?.default;
    if (next != null && typeof next === "object") {
      cur = next;
      continue;
    }
    break;
  }
  return null;
}

export function cloneFeatureCollection(fc) {
  if (!fc?.features?.length) return null;
  try {
    if (typeof structuredClone === "function") return structuredClone(fc);
    return JSON.parse(JSON.stringify(fc));
  } catch {
    return null;
  }
}

/** Average of d3 geoPath.centroid in screen space — stable label anchor per division. */
export function averagePathCentroid(features, pathGen) {
  if (!features?.length || !pathGen) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const f of features) {
    const c = pathGen.centroid(f);
    if (!Array.isArray(c) || c.length < 2) continue;
    const [x, y] = c;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      sx += x;
      sy += y;
      n += 1;
    }
  }
  if (!n) return null;
  return { x: sx / n, y: sy / n };
}

/** Match posting row keys (e.g. "Lahore Division") to canonical division names. */
export function countForCanonicalDivision(canonicalName, divisionCounts) {
  const counts = divisionCounts || {};
  const canon = String(canonicalName || "").trim();
  if (!canon) return 0;
  if (counts[canon]) return Number(counts[canon]) || 0;
  const withSuffix = `${canon} Division`;
  if (counts[withSuffix]) return Number(counts[withSuffix]) || 0;
  const low = canon.toLowerCase();
  for (const [k, v] of Object.entries(counts)) {
    const kn = String(k).replace(/\s+division\s*$/i, "").trim().toLowerCase();
    if (kn === low) return Number(v) || 0;
  }
  return 0;
}

export function canonicalDivisionForPostingRow(row) {
  const raw = String(row?._division || row?.DIVISIONNAME || row?.divisionname || "").trim();
  if (!raw) return null;
  const u = raw.toUpperCase();
  if (["NONE", "N/A", "NA", "NULL", "UNKNOWN", "-", "—"].includes(u)) return null;
  const probe = { [raw]: 1 };
  for (const d of PUNJAB_DIVISION_ORDER) {
    if (countForCanonicalDivision(d, probe) > 0) return d;
  }
  return null;
}

/** Map pie `label` / API division string to a canonical Punjab division name. */
export function canonicalDivisionLabelFromRaw(rawLabel) {
  const s = String(rawLabel ?? "").trim();
  if (!s) return null;
  return canonicalDivisionForPostingRow({
    _division: s,
    DIVISIONNAME: s,
    divisionname: s,
  });
}

/**
 * Raw `DIVISIONNAME` from officer profile (`getOfficerProfile` payload).
 * Tries exact keys first, then any property whose name normalizes to DIVISIONNAME.
 */
export function profileDivisionNameRaw(profile) {
  if (!profile || typeof profile !== "object") return "";
  const tryKeys = [
    "DIVISIONNAME",
    "divisionname",
    "DivisionName",
    "divisionName",
    "DIVISION_NAME",
    "division_name",
  ];
  for (const k of tryKeys) {
    const v = profile[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  for (const k of Object.keys(profile)) {
    const norm = String(k).replace(/\s+/g, "").toUpperCase();
    if (norm === "DIVISIONNAME") {
      const v = profile[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
  }
  return "";
}

/** Residence / home division from profile `DIVISIONNAME` → canonical Punjab division for map + distances. */
export function livingDivisionCanonFromProfile(profile) {
  const raw = profileDivisionNameRaw(profile);
  if (!raw) return null;
  return canonicalDivisionLabelFromRaw(raw);
}

export function divisionTenureFromPostingItems(postingItems) {
  const by = {};
  for (const d of PUNJAB_DIVISION_ORDER) {
    by[d] = { totalDays: 0, count: 0 };
  }
  for (const r of postingItems || []) {
    const d = canonicalDivisionForPostingRow(r);
    if (!d) continue;
    by[d].totalDays += Number(r._durationDays || 0);
    by[d].count += 1;
  }
  return by;
}

export function maxCanonicalDivisionTenureDays(tenureByCanon) {
  let m = 0;
  for (const d of PUNJAB_DIVISION_ORDER) {
    m = Math.max(m, tenureByCanon[d]?.totalDays || 0);
  }
  return m;
}

export function sortedPostedDivisionTenures(tenureByCanon) {
  const rows = PUNJAB_DIVISION_ORDER
    .map((d) => {
      const x = tenureByCanon[d] || { totalDays: 0, count: 0 };
      return { division: d, totalDays: x.totalDays, count: x.count };
    })
    .filter((x) => x.count > 0 || x.totalDays > 0);
  rows.sort((a, b) => b.totalDays - a.totalDays || b.count - a.count);
  return rows;
}

export function getLatestPostingRow(historyRows) {
  const list = Array.isArray(historyRows) ? historyRows : [];
  let best = null;
  let bestT = -Infinity;
  for (const r of list) {
    const d =
      parseDateSafe(r.TO_DATE) ||
      parseDateSafe(r.TODATE) ||
      parseDateSafe(r.TO) ||
      parseDateSafe(r.FROM_DATE) ||
      parseDateSafe(r.FROMDATE) ||
      parseDateSafe(r.DATEOFPOSTING) ||
      null;
    const t = d ? d.getTime() : 0;
    if (t > bestT) {
      bestT = t;
      best = r;
    }
  }
  return best;
}

export function currentDivisionLabelFromHistory(historyRows) {
  const row = getLatestPostingRow(historyRows);
  if (!row) return null;
  const n = String(row.DIVISIONNAME || row.divisionname || "").trim();
  if (!n) return null;
  const u = n.toUpperCase();
  if (["NONE", "N/A", "NA", "NULL", "UNKNOWN", "-", "—"].includes(u)) return null;
  return n;
}

export function fitMercatorPathGen(vbW, vbH, pad, geoForFit) {
  const projection = geoMercator();
  projection.fitExtent([[pad, pad], [vbW - pad, vbH - pad]], geoForFit);
  const pathGen = geoPath(projection);
  return { projection, pathGen };
}

