import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Api from "../API/Api";

export default function DashboardSinglePage({ onLogout }) {
  const navigate = useNavigate();

  // LEFT (designation)
  const [designationTiles, setDesignationTiles] = useState([]);
  const [baseDesignationTiles, setBaseDesignationTiles] = useState([]);

  // RIGHT (district)
  const [districtTiles, setDistrictTiles] = useState([]);
  const [masterDistrictTiles, setMasterDistrictTiles] = useState([]);
  const [overallDistrictTiles, setOverallDistrictTiles] = useState([]);

  const [loadingLeft, setLoadingLeft] = useState(true);
  const [loadingRight, setLoadingRight] = useState(true);

  const [selectedDesignation, setSelectedDesignation] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [districtQuery, setDistrictQuery] = useState("");
  const [districtSort, setDistrictSort] = useState("az"); // stable default

  const toNumber = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return Number.isFinite(val) ? val : 0;
    const cleaned = String(val).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const hashString = (s) => {
    const str = String(s ?? "");
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
    return Math.abs(h >>> 0);
  };

  const colorById = (id, palette) => palette[hashString(id) % palette.length];

  // Designation colors
  const TILE_COLORS = [
    "bg-gradient-to-br from-sky-500/80 via-blue-600/80 to-indigo-700/80",
    "bg-gradient-to-br from-blue-600/80 via-indigo-700/80 to-indigo-900/80",
    "bg-gradient-to-br from-teal-500/80 via-cyan-600/80 to-blue-700/80",
    "bg-gradient-to-br from-cyan-600/80 via-teal-700/80 to-slate-800/80",
    "bg-gradient-to-br from-emerald-500/80 via-emerald-600/80 to-teal-800/80",
    "bg-gradient-to-br from-green-600/80 via-emerald-700/80 to-slate-800/80",
    "bg-gradient-to-br from-slate-600/80 via-slate-700/80 to-slate-900/80",
    "bg-gradient-to-br from-neutral-700/80 via-zinc-800/80 to-slate-900/80",
  ];

  // District colors
  const DISTRICT_COLORS_36 = [
    "bg-gradient-to-br from-sky-400/80 via-blue-500/80 to-indigo-600/80 text-white",
    "bg-gradient-to-br from-blue-400/80 via-indigo-500/80 to-blue-600/80 text-white",
    "bg-gradient-to-br from-indigo-400/80 via-blue-500/80 to-sky-600/80 text-white",
    "bg-gradient-to-br from-cyan-400/80 via-sky-500/80 to-blue-600/80 text-white",
    "bg-gradient-to-br from-slate-500/80 via-blue-600/80 to-indigo-700/80 text-white",
    "bg-gradient-to-br from-violet-400/80 via-purple-500/80 to-indigo-600/80 text-white",
    "bg-gradient-to-br from-purple-400/80 via-indigo-500/80 to-slate-700/80 text-white",
    "bg-gradient-to-br from-fuchsia-400/70 via-purple-500/80 to-indigo-600/80 text-white",
    "bg-gradient-to-br from-indigo-500/80 via-purple-600/80 to-slate-800/80 text-white",
    "bg-gradient-to-br from-violet-500/80 via-indigo-600/80 to-slate-800/80 text-white",
    "bg-gradient-to-br from-emerald-400/80 via-teal-500/80 to-cyan-600/80 text-white",
    "bg-gradient-to-br from-green-400/80 via-emerald-500/80 to-teal-600/80 text-white",
    "bg-gradient-to-br from-teal-400/80 via-emerald-500/80 to-slate-700/80 text-white",
    "bg-gradient-to-br from-lime-400/70 via-green-500/80 to-emerald-600/80 text-white",
    "bg-gradient-to-br from-green-500/80 via-teal-600/80 to-slate-800/80 text-white",
    "bg-gradient-to-br from-amber-400/80 via-orange-500/80 to-amber-600/80 text-white",
    "bg-gradient-to-br from-orange-400/80 via-amber-500/80 to-yellow-600/80 text-white",
    "bg-gradient-to-br from-yellow-400/80 via-amber-500/80 to-orange-600/80 text-white",
    "bg-gradient-to-br from-rose-400/70 via-orange-500/80 to-amber-600/80 text-white",
    "bg-gradient-to-br from-pink-400/70 via-rose-500/80 to-fuchsia-600/80 text-white",
    "bg-gradient-to-br from-rose-400/70 via-pink-500/80 to-purple-600/80 text-white",
    "bg-gradient-to-br from-fuchsia-400/70 via-purple-500/80 to-indigo-600/80 text-white",
    "bg-gradient-to-br from-slate-500/80 via-slate-600/80 to-indigo-700/80 text-white",
    "bg-gradient-to-br from-zinc-500/80 via-slate-600/80 to-blue-700/80 text-white",
    "bg-gradient-to-br from-stone-500/80 via-slate-600/80 to-indigo-600/80 text-white",
    "bg-gradient-to-br from-cyan-400/70 via-teal-500/80 to-emerald-600/80 text-white",
    "bg-gradient-to-br from-sky-400/70 via-indigo-500/80 to-purple-600/80 text-white",
    "bg-gradient-to-br from-teal-400/70 via-cyan-500/80 to-blue-600/80 text-white",
    "bg-gradient-to-br from-emerald-400/70 via-teal-500/80 to-blue-600/80 text-white",
    "bg-gradient-to-br from-purple-400/70 via-indigo-500/80 to-blue-600/80 text-white",
    "bg-gradient-to-br from-violet-400/70 via-purple-500/80 to-indigo-600/80 text-white",
    "bg-gradient-to-br from-green-400/70 via-lime-500/80 to-emerald-600/80 text-white",
    "bg-gradient-to-br from-amber-400/70 via-orange-500/80 to-rose-600/80 text-white",
  ];

  // Stable colors by master list
  const districtColorMap = useMemo(() => {
    const map = new Map();
    const used = new Set();

    for (const d of masterDistrictTiles) {
      const key = String(d.id ?? d.label ?? "");
      if (!key) continue;

      if (!map.has(key)) {
        const nextIndex = DISTRICT_COLORS_36.findIndex((_, i) => !used.has(i));
        const idx = nextIndex === -1 ? 0 : nextIndex;
        used.add(idx);
        map.set(key, DISTRICT_COLORS_36[idx]);
      }
    }
    return map;
  }, [masterDistrictTiles]);

  const TOTAL_COLOR =
    "bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900";

  // ---------------- FETCHERS ----------------
  const fetchDesignationTiles = async () => {
    const data = await Api.getOverallCount();
    return (data || [])
      .sort((a, b) => (a.DESIGNATIONID ?? 0) - (b.DESIGNATIONID ?? 0))
      .map((x) => ({
        id: x.DESIGNATIONID ?? x.DESIGNATIONDESC,
        label: x.DESIGNATIONDESC,
        count: toNumber(x.CNT),
      }));
  };

  const fetchOverallDistrictTiles = async () => {
    const data = await Api.getDistrictPostingCountoverAll();
    return (data || []).map((x) => ({
      id: x.DISTRICTID ?? x.DISTRICTNAME,
      label: x.DISTRICTNAME,
      count: toNumber(x.TOTAL ?? x.CNT ?? x.COUNT),
    }));
  };

  const fetchDistrictByDesignation = async (designationDesc) => {
    const data = await Api.getDistrictPostingCount(designationDesc);
    // only need district name + count
    return (data || []).map((x) => ({
      label: x.DISTRICTNAME,
      count: toNumber(x.TOTAL ?? x.CNT ?? x.COUNT),
    }));
  };

  const fetchDesignationsByDistrict = async (districtName) => {
    const data =
      await Api.getDesignationWiseCountWithDistrictFilter(districtName);

    const toIdParts = (id) => {
      const s = String(id ?? "").trim();
      if (!s) return [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      const parts = s.split(".").map((p) => Number(p));
      return [
        Number.isFinite(parts[0]) ? parts[0] : Number.POSITIVE_INFINITY,
        Number.isFinite(parts[1]) ? parts[1] : Number.POSITIVE_INFINITY,
      ];
    };

    const tiles = (data || []).map((x) => {
      const designationId = String(
        x.DESIGNATIONID ?? x.DESIGNATIONIDDRIVED ?? x.designationId ?? "",
      ).trim();

      return {
        designationId,
        id: designationId || (x.DESIGNATION ?? x.designation),
        label: x.DESIGNATION ?? x.designation,
        count: toNumber(x.TOTAL ?? x.total),
      };
    });

    tiles.sort((a, b) => {
      const [a1, a2] = toIdParts(a.designationId);
      const [b1, b2] = toIdParts(b.designationId);
      if (a1 !== b1) return a1 - b1;
      return a2 - b2;
    });

    return tiles.map(({ designationId, ...rest }) => rest);
  };

  // Keep district positions stable
  const applyDesignationToDistrictGrid = (countsList) => {
    const countsMap = new Map(
      (countsList || []).map((x) => [
        String(x.label ?? "").trim(),
        toNumber(x.count),
      ]),
    );

    const stable = (masterDistrictTiles || []).map((d) => ({
      ...d,
      count: countsMap.get(String(d.label ?? "").trim()) ?? 0,
    }));

    setDistrictTiles(stable);
  };

  // ---------------- SHOW ALL ----------------
  const showAll = () => {
    setSelectedDesignation("ALL");
    setSelectedDistrict(null);
    setDesignationTiles(baseDesignationTiles);
    setDistrictTiles(masterDistrictTiles);
    setDistrictQuery("");
    setDistrictSort("az");
  };

  const filtersActive =
    selectedDistrict !== null ||
    selectedDesignation !== "ALL" ||
    districtQuery.trim() !== "" ||
    districtSort !== "az";

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingLeft(true);
        setLoadingRight(true);

        const [d1, d2] = await Promise.all([
          fetchDesignationTiles(),
          fetchOverallDistrictTiles(),
        ]);

        if (!mounted) return;

        setBaseDesignationTiles(d1);
        setDesignationTiles(d1);

        const master = [...(d2 || [])].sort((a, b) =>
          String(a.label ?? "").localeCompare(String(b.label ?? ""), "en", {
            sensitivity: "base",
          }),
        );

        setOverallDistrictTiles(d2);
        setMasterDistrictTiles(master);
        setDistrictTiles(master);

        setSelectedDesignation("ALL");
        setSelectedDistrict(null);
        setDistrictSort("az");
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!mounted) return;
        setDesignationTiles([]);
        setBaseDesignationTiles([]);
        setOverallDistrictTiles([]);
        setMasterDistrictTiles([]);
        setDistrictTiles([]);
      } finally {
        if (mounted) {
          setLoadingLeft(false);
          setLoadingRight(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------- CLICK: DESIGNATION (filters district counts) ----------------
  const onDesignationClick = async (labelOrAll) => {
    setSelectedDistrict(null); // designation mode clears district selection
    setDesignationTiles(baseDesignationTiles);

    setSelectedDesignation(labelOrAll);
    setLoadingRight(true);
    setDistrictQuery("");
    setDistrictSort("az");

    try {
      if (labelOrAll === "ALL") {
        setDistrictTiles(masterDistrictTiles);
        return;
      }
      const list = await fetchDistrictByDesignation(labelOrAll);
      applyDesignationToDistrictGrid(list);
    } catch (e) {
      console.error("Load district by designation error:", e);
      setDistrictTiles(masterDistrictTiles);
    } finally {
      setLoadingRight(false);
    }
  };

  // ---------------- CLICK: DISTRICT (filters designations) ----------------
  const onDistrictClick = async (districtName) => {
    if (!districtName) return;

    setSelectedDesignation("ALL");
    setDistrictTiles(masterDistrictTiles);
    setDistrictQuery("");
    setDistrictSort("az");

    setSelectedDistrict(districtName);
    setLoadingLeft(true);

    try {
      const tiles = await fetchDesignationsByDistrict(districtName);
      setDesignationTiles(tiles);
    } catch (e) {
      console.error("Load designation by district error:", e);
      setDesignationTiles([]);
    } finally {
      setLoadingLeft(false);
    }
  };

  // ✅ DETAILS NAV for designation tiles
  const goToDesignationDetails = (designationId, designationLabel) => {
    navigate("/dashboard/officer-detail", {
      state: {
        designationId: designationId ?? "ALL",
        designation: designationLabel ?? "ALL",
        districtName: selectedDistrict ?? null, // if district selected, pass it too
      },
    });
  };

  // ✅ DETAILS NAV for district tiles (ONLY district)
  const goToDistrictDetails = (districtName) => {
    navigate("/dashboard/officer-detail", {
      state: {
        designationId: "ALL",
        designation: "ALL",
        districtName: districtName ?? null,
      },
    });
  };

  const totalOverall = useMemo(() => {
    const sum = baseDesignationTiles.reduce((s, t) => s + toNumber(t.count), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [baseDesignationTiles]);

  const totalLeft = useMemo(() => {
    const sum = designationTiles.reduce((s, t) => s + toNumber(t.count), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [designationTiles]);

  const totalRight = useMemo(() => {
    const sum = districtTiles.reduce((s, t) => s + toNumber(t.count), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [districtTiles]);

  const headerLabel = selectedDistrict
    ? `Total in District: ${selectedDistrict}`
    : selectedDesignation === "ALL"
      ? "Total Judges (Overall)"
      : `Total in ${selectedDesignation}`;

  const headerCount = selectedDistrict
    ? totalLeft
    : selectedDesignation === "ALL"
      ? totalOverall
      : totalRight;

  const filteredDistricts = useMemo(() => {
    const q = districtQuery.trim().toLowerCase();
    let list = districtTiles;

    if (q) {
      list = list.filter((d) =>
        String(d.label ?? "")
          .toLowerCase()
          .includes(q),
      );
    }

    const byCount = (a, b) => toNumber(a.count) - toNumber(b.count);
    const byName = (a, b) =>
      String(a.label ?? "").localeCompare(String(b.label ?? ""), "en", {
        sensitivity: "base",
      });

    const sorted = [...list];
    if (districtSort === "az") sorted.sort(byName);
    if (districtSort === "za") sorted.sort((a, b) => byName(b, a));
    if (districtSort === "count_desc") sorted.sort((a, b) => byCount(b, a));
    if (districtSort === "count_asc") sorted.sort((a, b) => byCount(a, b));

    return sorted;
  }, [districtTiles, districtQuery, districtSort]);

  return (
    <Layout onLogout={onLogout}>
      <div className="bg-slate-50 px-4 py-3 h-[calc(100vh-88px)] overflow-hidden">
        {/* Total bar */}
        <div
          className={`${TOTAL_COLOR} rounded-2xl text-white shadow-xl mb-3 border border-white/10`}
        >
          <div className="relative text-center py-3">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={showAll}
                disabled={!filtersActive}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Show All
              </button>
            </div>

            <div className="text-xs uppercase tracking-widest opacity-90">
              {headerLabel}
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mt-1 leading-none">
              {loadingLeft && selectedDistrict ? 0 : headerCount}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100%-86px)]">
          {/* LEFT */}
          <div className="col-span-12 xl:col-span-4 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 flex flex-col min-h-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="leading-tight">
                <div className="text-lg font-extrabold text-slate-800 tracking-tight">
                  {selectedDistrict
                    ? `Designation-wise ( ${selectedDistrict} )`
                    : "Designation-wise"}
                </div>
                <div className="text-[11px] text-slate-500 -mt-0.5">
                  Click tile = filter district/designation | Details = officer
                  list
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600">
                {designationTiles.length + 1} tiles
              </span>
            </div>

            <div className="flex-1 overflow-auto pr-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                {/* ALL tile */}
                <div
                  className={`bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-2xl p-4 text-white font-extrabold
                    ${selectedDesignation === "ALL" && !selectedDistrict ? "ring-4 ring-white/35" : ""}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onDesignationClick("ALL")}
                    className="cursor-pointer text-center"
                  >
                    <div className="text-xs uppercase tracking-wide opacity-95">
                      ALL
                    </div>
                    <div className="text-3xl mt-2 leading-none">
                      {loadingLeft
                        ? 0
                        : selectedDistrict
                          ? totalLeft
                          : totalOverall}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToDesignationDetails("ALL", "ALL")}
                    className="mt-3 w-full rounded-xl bg-white/15 text-white text-xs py-2 font-bold hover:bg-white/20 transition"
                  >
                    Details
                  </button>
                </div>

                {/* Designation tiles */}
                {designationTiles.map((t, idx) => {
                  const key = t.id ?? t.label ?? idx;
                  const bg = colorById(key, TILE_COLORS);

                  return (
                    <div
                      key={key}
                      className={`${bg} rounded-2xl p-4 text-white font-extrabold`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onDesignationClick(t.label ?? "")}
                        className="cursor-pointer text-center"
                      >
                        <div className="text-xs uppercase tracking-wide opacity-95 line-clamp-2">
                          {t.label || "Unknown"}
                        </div>
                        <div className="text-3xl mt-2 leading-none">
                          {t.count}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          goToDesignationDetails(t.id ?? "ALL", t.label ?? "")
                        }
                        className="mt-3 w-full rounded-xl bg-white/15 text-white text-xs py-2 font-bold hover:bg-white/20 transition"
                      >
                        Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-12 xl:col-span-8 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 flex flex-col min-h-0 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="leading-tight">
                <div className="font-extrabold text-slate-800">
                  District-wise
                </div>
                <div className="text-[11px] text-slate-500">
                  Click tile = filter designations | Details = officer list by
                  district
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={districtQuery}
                  onChange={(e) => setDistrictQuery(e.target.value)}
                  placeholder="Search district..."
                  className="w-44 md:w-56 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                />
                <select
                  value={districtSort}
                  onChange={(e) => setDistrictSort(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="az">A–Z (Stable)</option>
                  <option value="za">Z–A</option>
                  <option value="count_desc">Count ↓</option>
                  <option value="count_asc">Count ↑</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 mb-2">
              {loadingRight
                ? "Loading..."
                : `${filteredDistricts.length} / ${districtTiles.length} districts`}
            </div>

            <div className="flex-1 overflow-auto pr-1 min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredDistricts.map((t, idx) => {
                  const key = t.id ?? t.label ?? idx;
                  const bg =
                    districtColorMap.get(String(key)) || DISTRICT_COLORS_36[0];
                  const isActive = selectedDistrict === t.label;

                  return (
                    <div
                      key={key}
                      className={`${bg} rounded-2xl p-4 font-extrabold
                        hover:ring-2 hover:ring-slate-200 transition-all duration-200
                        ${isActive ? "ring-4 ring-white/35" : ""}`}
                      title={t.label}
                    >
                      {/* tile click -> filter designations */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onDistrictClick(t.label)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            onDistrictClick(t.label);
                        }}
                        className="cursor-pointer text-center"
                      >
                        <div className="text-xs uppercase tracking-wide opacity-90 line-clamp-1">
                          {t.label || "Unknown"}
                        </div>
                        <div className="text-3xl mt-2 leading-none">
                          {t.count}
                        </div>
                      </div>

                      {/* ✅ NEW: District Details button */}
                      <button
                        type="button"
                        onClick={() => goToDistrictDetails(t.label)}
                        className="mt-3 w-full rounded-xl bg-white/15 text-white text-xs py-2 font-bold hover:bg-white/20 transition"
                        title="Open officer detail list for this district"
                      >
                        Details
                      </button>
                    </div>
                  );
                })}

                {!loadingRight && filteredDistricts.length === 0 && (
                  <div className="col-span-full text-center text-slate-500 py-10">
                    No data found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
