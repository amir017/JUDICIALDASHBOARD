import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Api from "../API/Api";

export default function Dashboard({ onLogout }) {
  const [designationTiles, setDesignationTiles] = useState([]);
  const [districtTiles, setDistrictTiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // to keep a visual selected ring when user comes back (optional)
  const selectedDesignationId = location.state?.selectedDesignationId ?? null;

  // Designation tiles: EXCLUDED purple + green + red
  // Allowed: BLUE / SKY / CYAN / TEAL / INDIGO / SLATE / AMBER / ORANGE / YELLOW
  const TILE_COLORS = [
    // Premium Blues (rich + vibrant)
    "bg-gradient-to-br from-sky-500/90 via-blue-600/90 to-indigo-800/90 shadow-lg shadow-blue-500/25",
    "bg-gradient-to-br from-blue-500/90 via-indigo-600/90 to-slate-900/90 shadow-lg shadow-indigo-500/25",
    "bg-gradient-to-br from-indigo-500/90 via-blue-700/90 to-sky-500/90 shadow-lg shadow-indigo-500/25",

    // Cyan / Teal (fresh + modern)
    "bg-gradient-to-br from-cyan-500/90 via-sky-600/90 to-indigo-700/90 shadow-lg shadow-cyan-500/25",
    "bg-gradient-to-br from-teal-500/90 via-cyan-600/90 to-blue-800/90 shadow-lg shadow-teal-500/25",
    "bg-gradient-to-br from-sky-400/85 via-cyan-600/90 to-teal-800/90 shadow-lg shadow-cyan-500/25",
    "bg-gradient-to-br from-cyan-600/90 via-blue-600/90 to-indigo-800/90 shadow-lg shadow-cyan-500/25",

    // Deep Night (executive feel)
    "bg-gradient-to-br from-slate-700/90 via-slate-900/90 to-indigo-900/90 shadow-lg shadow-slate-600/25",
    "bg-gradient-to-br from-neutral-800/90 via-zinc-900/90 to-slate-900/90 shadow-lg shadow-neutral-600/25",
    "bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-indigo-950/90 shadow-lg shadow-slate-700/25",

    // Soft Premium (less harsh, still colorful)
    "bg-gradient-to-br from-sky-500/80 via-indigo-600/85 to-blue-700/85 shadow-lg shadow-sky-500/20",
    "bg-gradient-to-br from-teal-500/80 via-cyan-700/85 to-indigo-800/85 shadow-lg shadow-teal-500/20",

    // Warm Accents (for special tiles like totals/alerts)
    "bg-gradient-to-br from-amber-400/85 via-orange-500/90 to-amber-700/90 shadow-lg shadow-amber-500/25",
    "bg-gradient-to-br from-orange-500/90 via-amber-500/90 to-yellow-400/85 shadow-lg shadow-orange-500/25",
    "bg-gradient-to-br from-yellow-400/85 via-amber-600/90 to-orange-800/90 shadow-lg shadow-yellow-500/25",

    // Elegant Neutral Warm (rare use, looks premium)
    "bg-gradient-to-br from-stone-700/90 via-amber-700/75 to-orange-800/90 shadow-lg shadow-stone-500/20",
  ];
  // District-wise: (IMPORTANT) remove green/purple/red to match your requirement
  const DISTRICT_COLORS = [
    "bg-gradient-to-br from-sky-100 to-sky-300 text-slate-900 border border-sky-300",
    "bg-gradient-to-br from-blue-100 to-blue-300 text-slate-900 border border-blue-300",
    "bg-gradient-to-br from-indigo-100 to-indigo-300 text-slate-900 border border-indigo-300",

    "bg-gradient-to-br from-cyan-100 to-cyan-300 text-slate-900 border border-cyan-300",
    "bg-gradient-to-br from-teal-100 to-teal-300 text-slate-900 border border-teal-300",

    "bg-gradient-to-br from-amber-100 to-amber-300 text-slate-900 border border-amber-300",
    "bg-gradient-to-br from-yellow-100 to-yellow-300 text-slate-900 border border-yellow-300",
    "bg-gradient-to-br from-orange-100 to-orange-300 text-slate-900 border border-orange-300",

    "bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 border border-slate-300",
    "bg-gradient-to-br from-stone-100 to-stone-300 text-slate-900 border border-stone-300",
    "bg-gradient-to-br from-zinc-100 to-zinc-300 text-slate-900 border border-zinc-300",
  ];

  const TOTAL_COLOR =
    "bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900";

  const toNumber = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return Number.isFinite(val) ? val : 0;
    const cleaned = String(val).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // stable hash => stable colors even after back button
  const hashString = (s) => {
    const str = String(s ?? "");
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const colorById = (id, palette) => palette[hashString(id) % palette.length];

  const fetchDesignationTiles = async () => {
    const data = await Api.getOverallCount();
    return (data || []).map((x) => ({
      id: x.DESIGNATIONID ?? x.DESIGNATIONDESC,
      label: x.DESIGNATIONDESC,
      count: toNumber(x.CNT),
    }));
  };

  const fetchDistrictTiles = async () => {
    const data = await Api.getDistrictPostingCountoverAll();
    return (data || []).map((x) => ({
      id: x.DISTRICTID ?? x.DISTRICTNAME,
      label: x.DISTRICTNAME,
      count: toNumber(x.TOTAL ?? x.CNT ?? x.COUNT),
    }));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [d1, d2] = await Promise.all([
          fetchDesignationTiles(),
          fetchDistrictTiles(),
        ]);
        if (!mounted) return;
        setDesignationTiles(d1);
        setDistrictTiles(d2);
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!mounted) return;
        setDesignationTiles([]);
        setDistrictTiles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalJudges = useMemo(() => {
    const sum = designationTiles.reduce((s, t) => s + toNumber(t.count), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [designationTiles]);

  // CLICK: go to next page and pass designation
  const onDesignationClick = (tile) => {
    const designation = tile?.label ?? "";
    navigate("/dashboard/designation-districts", {
      state: {
        designation,
        selectedDesignationId: tile.id ?? tile.label,
      },
    });
  };

  const onDistrictClick = (tile) => {
    // keep for later if you want district drilldown
    console.log("District click:", tile);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="bg-slate-50 px-4 py-3 h-[calc(100vh-88px)] overflow-hidden">
        {/* Total bar */}
        <div
          className={`${TOTAL_COLOR} rounded-2xl text-white shadow-xl mb-3 backdrop-blur-sm border border-white/10`}
        >
          <div className="text-center py-3">
            <div className="text-xs uppercase tracking-widest opacity-90">
              Total Judges
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mt-1 leading-none">
              {loading ? 0 : totalJudges}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100%-86px)]">
          {/* LEFT: Designation-wise */}
          <div className="col-span-12 xl:col-span-4 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 flex flex-col min-h-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                </span>

                <div className="leading-tight">
                  <div className="text-lg font-extrabold text-slate-800 tracking-tight">
                    Designation-wise
                  </div>
                  <div className="text-[11px] text-slate-500 -mt-0.5">
                    Tap a tile to drill down
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm bg-gradient-to-r from-sky-600 to-indigo-600">
                {designationTiles.length} tiles
              </span>
            </div>

            <div className="flex-1 overflow-auto pr-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                {designationTiles.map((t, idx) => {
                  const key = t.id ?? t.label ?? idx;
                  const bg = colorById(key, TILE_COLORS);
                  const isSelected =
                    selectedDesignationId &&
                    selectedDesignationId === (t.id ?? t.label);

                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => onDesignationClick(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onDesignationClick(t);
                      }}
                      className={`${bg} rounded-2xl p-4 text-white font-extrabold cursor-pointer
                        hover:brightness-110 hover:ring-2 hover:ring-white/30
                        active:scale-[0.99] transition-all duration-200 backdrop-blur-sm
                        ${isSelected ? "ring-4 ring-white/40" : ""}`}
                      title="Click to open districts"
                    >
                      <div className="text-center">
                        <div className="text-xs uppercase tracking-wide opacity-95 line-clamp-2">
                          {t.label || "Unknown"}
                        </div>
                        <div className="text-3xl mt-2 leading-none drop-shadow-lg">
                          {t.count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: District-wise */}
          <div className="col-span-12 xl:col-span-8 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 flex flex-col min-h-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-extrabold text-slate-800">District-wise</div>
              <div className="text-xs text-slate-500">
                {districtTiles.length} districts
              </div>
            </div>

            <div className="flex-1 overflow-auto pr-1 min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {districtTiles.map((t, idx) => {
                  const key = t.id ?? t.label ?? idx;
                  const bg = colorById(key, DISTRICT_COLORS);

                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => onDistrictClick(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onDistrictClick(t);
                      }}
                      className={`${bg} rounded-2xl p-4 font-extrabold cursor-pointer shadow-sm
                        hover:brightness-105 hover:ring-2 hover:ring-slate-300
                        active:scale-[0.99] transition-all duration-200`}
                    >
                      <div className="text-center">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
