import React, { useEffect, useMemo, useState } from "react";
import { Home } from "lucide-react";
import punjabDivisionsJson from "../../../data/punjab_divisions.json";
import { fmtYMDLong } from "../officerUtils/officerFormat.js";
import { normalizePostingRows, DivisionTenurePieChart } from "./PostingTransfersTab.jsx";
import { buildInFieldDistrictVisualColors } from "./inFieldDistrictMapColors.js";
import { PUNJAB_DIVISION_ORDER, UNPOSTED_DIVISION_FILL } from "./punjabDivisionMapTheme.js";
import {
  averagePathCentroid,
  cloneFeatureCollection,
  currentDivisionLabelFromHistory,
  divisionTenureFromPostingItems,
  fitMercatorPathGen,
  livingDivisionCanonFromProfile,
  canonicalDivisionForPostingRow,
  normalizeFeatureCollection,
  PUNJAB_MAP_PAD,
  PUNJAB_MAP_VIEWBOX,
  punjabGeoJsonFetchUrl,
} from "./punjabMapGeo.js";

const PUNJAB_GEOJSON_FETCH_URL = punjabGeoJsonFetchUrl();
const bundled = cloneFeatureCollection(normalizeFeatureCollection(punjabDivisionsJson));

const VB = PUNJAB_MAP_VIEWBOX;
const PAD = PUNJAB_MAP_PAD;
const STROKE_CURRENT = "#0f766e";
const STROKE_DIVISION = "rgba(15, 23, 42, 0.22)";
const MAP_BG = "#f8fafc";
export default function PunjabDivisionsMapTab({ historyRows = [], profile = null }) {
  const [fc, setFc] = useState(() => bundled);
  const [err, setErr] = useState(null);
  const [hover, setHover] = useState(null);

  const postingItems = useMemo(() => normalizePostingRows(historyRows), [historyRows]);
  const inFieldItems = useMemo(
    () => postingItems.filter((r) => r._bucket === "In Field"),
    [postingItems],
  );
  const inFieldTenureByCanon = useMemo(
    () => divisionTenureFromPostingItems(inFieldItems),
    [inFieldItems],
  );

  const allPostingCountByCanon = useMemo(() => {
    const by = {};
    for (const d of PUNJAB_DIVISION_ORDER) by[d] = 0;
    for (const r of postingItems) {
      const d = canonicalDivisionForPostingRow(r);
      if (d) by[d] += 1;
    }
    return by;
  }, [postingItems]);

  const { hexByCanon: divisionHexByCanon, sliceFills: districtPieSliceFills } = useMemo(
    () => buildInFieldDistrictVisualColors(postingItems),
    [postingItems],
  );

  const currentDivision = useMemo(
    () => currentDivisionLabelFromHistory(historyRows),
    [historyRows],
  );
  const curNorm = useMemo(
    () =>
      currentDivision
        ? String(currentDivision).replace(/\s+division\s*$/i, "").trim().toLowerCase()
        : "",
    [currentDivision],
  );

  const livingCanon = useMemo(() => livingDivisionCanonFromProfile(profile), [profile]);

  useEffect(() => {
    if (fc?.features?.length) return;
    let alive = true;
    setErr(null);
    fetch(PUNJAB_GEOJSON_FETCH_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        const norm = normalizeFeatureCollection(j);
        const cloned = cloneFeatureCollection(norm);
        if (!alive) return;
        if (cloned?.features?.length) setFc(cloned);
        else throw new Error("Invalid GeoJSON");
      })
      .catch((e) => {
        if (alive) setErr(e?.message || "Failed to load map");
      });
    return () => {
      alive = false;
    };
  }, [fc]);

  const { paths, labels } = useMemo(() => {
    if (!fc?.features?.length) return { paths: [], labels: [] };
    const punjabGeo = cloneFeatureCollection(fc);
    if (!punjabGeo?.features?.length) return { paths: [], labels: [] };

    const { pathGen } = fitMercatorPathGen(VB.w, VB.h, PAD, punjabGeo);

    const outPaths = [];
    const byDivision = new Map();

    for (let i = 0; i < punjabGeo.features.length; i += 1) {
      const f = punjabGeo.features[i];
      const name = String(f?.properties?.division || "").trim() || `div-${i}`;
      const d = pathGen(f);
      if (!d) continue;
      const gid = f?.properties?.gid_3 ?? f?.properties?.district ?? i;
      const tinfoIF = inFieldTenureByCanon[name] || { totalDays: 0, count: 0 };
      const totalPostCount = allPostingCountByCanon[name] || 0;
      const isCur = curNorm && String(name).trim().toLowerCase() === curNorm;
      const fill = divisionHexByCanon.get(name) ?? UNPOSTED_DIVISION_FILL;

      outPaths.push({
        key: `${name}-${gid}-${i}`,
        d,
        name,
        count: tinfoIF.count,
        totalDays: tinfoIF.totalDays,
        totalPostCount,
        isCur,
        fill,
      });
      if (!byDivision.has(name)) byDivision.set(name, []);
      byDivision.get(name).push(f);
    }

    const outLabels = [];
    for (const divName of PUNJAB_DIVISION_ORDER) {
      const feats = byDivision.get(divName);
      if (!feats?.length) continue;
      const pos = averagePathCentroid(feats, pathGen);
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
        const tinfoIF = inFieldTenureByCanon[divName] || { totalDays: 0, count: 0 };
        const totalPostCount = allPostingCountByCanon[divName] || 0;
        outLabels.push({
          key: `${divName}-lbl`,
          name: divName,
          x: pos.x,
          y: pos.y,
          totalDays: tinfoIF.totalDays,
          totalPostCount,
        });
      }
    }

    const sortedForDraw = [...outPaths].sort((a, b) => {
      if (a.isCur === b.isCur) return 0;
      return a.isCur ? 1 : -1;
    });

    return { paths: sortedForDraw, labels: outLabels };
  }, [fc, curNorm, divisionHexByCanon, inFieldTenureByCanon, allPostingCountByCanon]);

  const mapSvg = (heightClass) =>
    err && !paths.length ? (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
        Map failed to load: {err}
      </div>
    ) : !paths.length ? (
      <div className="flex h-[420px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500">
        <span>Loading Punjab map…</span>
        {!bundled?.features?.length ? (
          <span className="max-w-md text-xs font-bold text-slate-400">
            No bundled GeoJSON in this build. Ensure{" "}
            <code className="rounded bg-white px-1">src/data/punjab_divisions.json</code> exists and run{" "}
            <code className="rounded bg-white px-1">node scripts/build-punjab-divisions-geojson.mjs</code>.
          </span>
        ) : null}
      </div>
    ) : (
      <div
        className="mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-slate-200/90"
        style={{ backgroundColor: MAP_BG }}
      >
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className={[
            "block w-full",
            heightClass ||
              "min-h-[640px] h-[min(88vh,1020px)] sm:min-h-[760px]",
          ].join(" ")}
          style={{ backgroundColor: MAP_BG }}
          role="img"
          aria-label="Punjab divisions boundary map"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x="0" y="0" width={VB.w} height={VB.h} fill={MAP_BG} />
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill={p.fill}
              stroke={STROKE_DIVISION}
              strokeWidth={1.35}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              onMouseEnter={() =>
                setHover({
                  name: p.name,
                  count: p.count,
                  totalDays: p.totalDays,
                  totalPostCount: p.totalPostCount,
                })
              }
              onMouseMove={() =>
                setHover({
                  name: p.name,
                  count: p.count,
                  totalDays: p.totalDays,
                  totalPostCount: p.totalPostCount,
                })
              }
              onMouseLeave={() => setHover(null)}
            >
              <title>
                {`${p.name}${(p.totalPostCount || 0) > 0 ? ` — ${p.totalPostCount} posting row(s) (all)` : ""}${p.count ? ` · ${p.count} In Field` : ""}${p.totalDays > 0 ? ` · In Field stay ${fmtYMDLong(p.totalDays)}` : ""}`}
              </title>
            </path>
          ))}
          {paths
            .filter((p) => p.isCur)
            .map((p) => (
              <path
                key={`${p.key}-ring`}
                d={p.d}
                fill="none"
                stroke={STROKE_CURRENT}
                strokeWidth={4.5}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
                pointerEvents="none"
              />
            ))}
          {labels.map((l) => {
            const hasTenure = l.totalDays > 0;
            const hasPosts = (l.totalPostCount || 0) > 0;
            const stack = (hasTenure ? 1 : 0) + (hasPosts ? 1 : 0);
            const nameDy = stack === 2 ? 26 : stack === 1 ? 14 : 0;
            const isResidence = livingCanon && l.name === livingCanon;
            return (
              <g key={l.key} pointerEvents="none">
                {isResidence ? (
                  <g>
                    <title>{`Residence (profile DIVISIONNAME): ${l.name}`}</title>
                    <foreignObject
                      x={l.x - 18}
                      y={l.y - nameDy - 48}
                      width={36}
                      height={36}
                      className="overflow-visible"
                    >
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-400/95 bg-amber-50 text-amber-900 shadow-md ring-2 ring-amber-900/15"
                        style={{ margin: 0 }}
                      >
                        <Home className="h-5 w-5 shrink-0" strokeWidth={2.35} aria-hidden />
                      </div>
                    </foreignObject>
                  </g>
                ) : null}
                <text
                  x={l.x}
                  y={l.y - nameDy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    fill: "#0b1220",
                    opacity: 0.92,
                    paintOrder: "stroke",
                  }}
                  stroke="rgba(248,250,252,0.98)"
                  strokeWidth={7}
                  strokeLinejoin="round"
                >
                  {l.name}
                </text>
                {hasTenure ? (
                  <text
                    x={l.x}
                    y={l.y + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 19,
                      fontWeight: 900,
                      fill: "#0f766e",
                      opacity: 0.95,
                      paintOrder: "stroke",
                    }}
                    stroke="rgba(248,250,252,0.98)"
                    strokeWidth={5}
                    strokeLinejoin="round"
                  >
                    {fmtYMDLong(l.totalDays)}
                  </text>
                ) : null}
                {hasPosts ? (
                  <text
                    x={l.x}
                    y={l.y + (hasTenure ? 34 : 12)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      fill: "#334155",
                      opacity: 0.95,
                      paintOrder: "stroke",
                    }}
                    stroke="rgba(248,250,252,0.98)"
                    strokeWidth={4}
                    strokeLinejoin="round"
                  >
                    {l.totalPostCount} post{l.totalPostCount === 1 ? "" : "s"}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    );

  const headerBlock =
    currentDivision || hover?.name ? (
      <div className="mb-4 flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
        {currentDivision ? (
          <span className="inline-flex items-center justify-center rounded-full border border-teal-200/70 bg-teal-50/80 px-3 py-1.5 text-[11px] font-black text-teal-950">
            Latest: {currentDivision}
          </span>
        ) : null}
        {hover?.name ? (
          <span className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] font-black text-slate-900">
            <span>{hover.name}</span>
            {typeof hover.totalPostCount === "number" && hover.totalPostCount > 0 ? (
              <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-800">
                {hover.totalPostCount} posting{hover.totalPostCount === 1 ? "" : "s"} (all)
              </span>
            ) : null}
            {hover.count ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-700">
                {hover.count} In Field row(s)
              </span>
            ) : null}
            {typeof hover.totalDays === "number" && hover.totalDays > 0 ? (
              <span className="rounded-full border border-teal-200/70 bg-teal-50/90 px-2 py-0.5 text-[10px] font-black text-teal-900">
                In Field stay {fmtYMDLong(hover.totalDays)}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="w-full min-w-[320px]">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        {headerBlock}

        {mapSvg(null)}

        <DivisionTenurePieChart rows={postingItems} underMap sliceFills={districtPieSliceFills} />
      </div>
    </div>
  );
}

