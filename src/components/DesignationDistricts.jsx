import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Api from "../API/Api";

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const cleaned = String(val).replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

// SAME hash as Dashboard (less collisions)
const hashString = (s) => {
  const str = String(s ?? "");
  let h = 5381; // djb2
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
};

const colorById = (id, palette) => palette[hashString(id) % palette.length];

// SAME bright district palette as Dashboard (NO green/purple/red)
const DISTRICT_COLORS = [
  // Sky/Blue/Indigo bright mixes
  "bg-gradient-to-br from-sky-200 via-sky-300 to-blue-500 text-slate-900 shadow-lg shadow-sky-300/40",
  "bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-500 text-slate-900 shadow-lg shadow-blue-300/40",
  "bg-gradient-to-br from-blue-200 via-blue-300 to-indigo-500 text-slate-900 shadow-lg shadow-blue-300/40",
  "bg-gradient-to-br from-blue-200 via-indigo-300 to-sky-500 text-slate-900 shadow-lg shadow-indigo-300/40",
  "bg-gradient-to-br from-indigo-200 via-sky-300 to-blue-500 text-slate-900 shadow-lg shadow-indigo-300/40",
  "bg-gradient-to-br from-indigo-200 via-indigo-300 to-blue-500 text-slate-900 shadow-lg shadow-indigo-300/40",

  // Cyan/Teal (allowed)
  "bg-gradient-to-br from-cyan-200 via-cyan-300 to-sky-500 text-slate-900 shadow-lg shadow-cyan-300/40",
  "bg-gradient-to-br from-cyan-200 via-sky-300 to-blue-500 text-slate-900 shadow-lg shadow-cyan-300/40",
  "bg-gradient-to-br from-teal-200 via-cyan-300 to-sky-500 text-slate-900 shadow-lg shadow-teal-300/40",
  "bg-gradient-to-br from-teal-200 via-sky-300 to-blue-500 text-slate-900 shadow-lg shadow-teal-300/40",
  "bg-gradient-to-br from-sky-100 via-cyan-200 to-teal-400 text-slate-900 shadow-lg shadow-sky-200/40",
  "bg-gradient-to-br from-cyan-100 via-sky-200 to-indigo-400 text-slate-900 shadow-lg shadow-cyan-200/40",

  // Warm (amber/yellow/orange) bright (no red)
  "bg-gradient-to-br from-amber-100 via-amber-200 to-orange-400 text-slate-900 shadow-lg shadow-amber-200/45",
  "bg-gradient-to-br from-amber-100 via-orange-200 to-yellow-300 text-slate-900 shadow-lg shadow-amber-200/45",
  "bg-gradient-to-br from-yellow-100 via-amber-200 to-orange-400 text-slate-900 shadow-lg shadow-yellow-200/45",
  "bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-400 text-slate-900 shadow-lg shadow-yellow-200/45",
  "bg-gradient-to-br from-orange-100 via-amber-200 to-yellow-300 text-slate-900 shadow-lg shadow-orange-200/45",
  "bg-gradient-to-br from-orange-100 via-orange-200 to-amber-400 text-slate-900 shadow-lg shadow-orange-200/45",

  // Neutrals (light but premium)
  "bg-gradient-to-br from-slate-100 via-slate-200 to-blue-400 text-slate-900 shadow-lg shadow-slate-200/40",
  "bg-gradient-to-br from-zinc-100 via-slate-200 to-indigo-400 text-slate-900 shadow-lg shadow-zinc-200/40",
  "bg-gradient-to-br from-stone-100 via-slate-200 to-sky-400 text-slate-900 shadow-lg shadow-stone-200/40",
  "bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-300 text-slate-900 shadow-lg shadow-slate-200/35",

  // Extra variations to avoid repeats
  "bg-gradient-to-br from-sky-100 via-blue-200 to-cyan-400 text-slate-900 shadow-lg shadow-sky-200/40",
  "bg-gradient-to-br from-blue-100 via-sky-200 to-indigo-400 text-slate-900 shadow-lg shadow-blue-200/40",
  "bg-gradient-to-br from-indigo-100 via-cyan-200 to-sky-400 text-slate-900 shadow-lg shadow-indigo-200/40",
  "bg-gradient-to-br from-cyan-100 via-teal-200 to-sky-400 text-slate-900 shadow-lg shadow-cyan-200/40",
  "bg-gradient-to-br from-teal-100 via-cyan-200 to-blue-400 text-slate-900 shadow-lg shadow-teal-200/40",
  "bg-gradient-to-br from-sky-100 via-indigo-200 to-blue-400 text-slate-900 shadow-lg shadow-indigo-200/40",
];

const TOTAL_COLOR =
  "bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900";

export default function DesignationDistricts({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const designation = location.state?.designation ?? "";
  const selectedDesignationId = location.state?.selectedDesignationId ?? null;

  const [loading, setLoading] = useState(true);
  const [districtTiles, setDistrictTiles] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        // if user opens this URL directly without state
        if (!designation) {
          setDistrictTiles([]);
          return;
        }

        const data = await Api.getDistrictPostingCount(designation);

        const mapped = (data || []).map((x) => ({
          id: x.DISTRICTID ?? x.DISTRICTNAME,
          label: x.DISTRICTNAME,
          count: toNumber(x.TOTAL ?? x.CNT ?? x.COUNT),
        }));

        if (!mounted) return;
        setDistrictTiles(mapped);
      } catch (e) {
        console.error("DesignationDistricts load error:", e);
        if (!mounted) return;
        setDistrictTiles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [designation]);

  const total = useMemo(
    () => districtTiles.reduce((s, t) => s + toNumber(t.count), 0),
    [districtTiles],
  );

  return (
    <Layout onLogout={onLogout}>
      <div className="relative bg-slate-50 px-4 py-3 h-[calc(100vh-88px)] overflow-hidden">
        {/* same subtle dashboard background vibe */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <button
            onClick={() =>
              navigate(-1, {
                state: { selectedDesignationId },
                replace: false,
              })
            }
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold shadow-sm hover:bg-slate-50"
          >
            Back
          </button>

          <div className="text-right">
            <div className="text-xs text-slate-500">Designation</div>
            <div className="text-lg font-extrabold text-slate-800">
              {designation || "N/A"}
            </div>
          </div>
        </div>

        {/* Total bar (same style language) */}
        <div
          className={`${TOTAL_COLOR} rounded-2xl text-white shadow-xl mb-3 backdrop-blur-sm border border-white/10 relative z-10`}
        >
          <div className="text-center py-3">
            <div className="text-xs uppercase tracking-widest opacity-90">
              Total in {designation || "Designation"}
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mt-1 leading-none">
              {loading ? 0 : total}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 shadow-sm h-[calc(100%-140px)] flex flex-col min-h-0 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="font-extrabold text-slate-800">
              District posting count
            </div>
            <div className="text-xs text-slate-500">
              {loading ? "Loading..." : `${districtTiles.length} districts`}
            </div>
          </div>

          <div className="flex-1 overflow-auto pr-1 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {districtTiles.map((t, idx) => {
                const key = t.id ?? t.label ?? idx;
                const c = colorById(key, DISTRICT_COLORS);

                return (
                  <div
                    key={key}
                    className={`${c} relative rounded-2xl p-4 font-extrabold cursor-default
                      hover:brightness-110 hover:ring-2 hover:ring-white/60
                      hover:-translate-y-0.5 hover:scale-[1.02]
                      transition-all duration-200`}
                    title={t.label}
                  >
                    {/* shine overlay (same as dashboard) */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10" />

                    <div className="text-center relative">
                      <div className="text-xs uppercase tracking-wide opacity-90 line-clamp-1">
                        {t.label || "Unknown"}
                      </div>
                      <div className="text-3xl mt-2 leading-none drop-shadow-sm">
                        {t.count}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && districtTiles.length === 0 && (
                <div className="col-span-full text-center text-slate-500 py-10">
                  No data found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
