/**
 * Shared In Field district pie + Punjab map colors (one hex per canonical division, one fill per pie row).
 * Lives in its own module to avoid circular imports between PostingTransfersTab and punjabMapGeo.
 */
import { safeText } from "../officerUtils/officerFormat.js";
import { PERFORMANCE_SLICE_COLORS } from "../officerUtils/chartColors.js";
import { PUNJAB_DIVISION_ORDER } from "./punjabDivisionMapTheme.js";
import {
  canonicalDivisionLabelFromRaw,
  divisionTenureFromPostingItems,
} from "./punjabMapGeo.js";

const groupRows = (rows, keyFn) => {
  const map = {};
  for (const r of rows || []) {
    const key = safeText(keyFn(r));
    if (!map[key]) map[key] = [];
    map[key].push(r);
  }
  return map;
};

const filterByBucket = (rows, bucket) => {
  if (bucket === "All") return rows;
  return (rows || []).filter((r) => r._bucket === bucket);
};

/** District tenure pie rows (sorted by total days; optional "Other" tail bucket). */
export function buildDistrictTenurePieData(rows, bucket) {
  const filtered = filterByBucket(rows, bucket).filter(
    (r) => safeText(r._division) && safeText(r._division) !== "Unknown",
  );
  if (!filtered.length) return [];
  const groups = groupRows(filtered, (r) => r._division);
  const list = Object.entries(groups)
    .map(([division, g]) => {
      const totalDays = g.reduce((sum, r) => sum + Number(r._durationDays || 0), 0);
      return {
        label: division,
        count: g.length,
        totalDays,
        avgDays: g.length ? Math.round(totalDays / g.length) : 0,
      };
    })
    .sort((a, b) => b.totalDays - a.totalDays);

  const TOP = 10;
  if (list.length <= TOP) return list;
  const head = list.slice(0, TOP);
  const tail = list.slice(TOP);
  const otherDays = tail.reduce((s, x) => s + x.totalDays, 0);
  const otherCount = tail.reduce((s, x) => s + x.count, 0);
  if (otherDays <= 0) return head;
  head.push({
    label: `Other (${tail.length} more)`,
    count: otherCount,
    totalDays: otherDays,
    avgDays: otherCount ? Math.round(otherDays / otherCount) : 0,
  });
  return head;
}

export const divisionTenurePieSliceColor = (idx) =>
  PERFORMANCE_SLICE_COLORS[(idx + 3) % PERFORMANCE_SLICE_COLORS.length];

/**
 * @returns {{ hexByCanon: Map<string,string>, sliceFills: string[], districtTenurePieData: Array }}
 */
export function buildInFieldDistrictVisualColors(postingItems) {
  const list = postingItems || [];
  const inFieldItems = list.filter((r) => r._bucket === "In Field");
  const inFieldTenureByCanon = divisionTenureFromPostingItems(inFieldItems);
  const pieData = buildDistrictTenurePieData(list, "In Field");

  const hexByCanon = new Map();
  if (pieData.length) {
    const headRows = pieData.filter((r) => !/^Other\s\(/i.test(String(r.label || "")));
    headRows.forEach((row, idx) => {
      const canon = canonicalDivisionLabelFromRaw(row.label);
      if (canon) hexByCanon.set(canon, divisionTenurePieSliceColor(idx));
    });
    const otherRow = pieData.find((r) => /^Other\s\(/i.test(String(r.label || "")));
    if (otherRow) {
      const otherIdx = pieData.indexOf(otherRow);
      const otherColor = divisionTenurePieSliceColor(otherIdx);
      for (const d of PUNJAB_DIVISION_ORDER) {
        const x = inFieldTenureByCanon[d];
        if ((x?.totalDays || 0) > 0 && !hexByCanon.has(d)) hexByCanon.set(d, otherColor);
      }
    }
  }

  const sliceFills = pieData.map((row, idx) => {
    if (/^Other\s\(/i.test(String(row?.label || ""))) return divisionTenurePieSliceColor(idx);
    const canon = canonicalDivisionLabelFromRaw(row.label);
    if (canon && hexByCanon.has(canon)) return hexByCanon.get(canon);
    return divisionTenurePieSliceColor(idx);
  });

  return { hexByCanon, sliceFills, districtTenurePieData: pieData };
}
