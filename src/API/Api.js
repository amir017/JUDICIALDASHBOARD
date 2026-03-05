// DashboardSinglePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Api from "../API/Api";

// ✅ recharts (kept as-is)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";

export default function DashboardSinglePage({ onLogout }) {
  const navigate = useNavigate();

  // LEFT (designation)
  const [designationTiles, setDesignationTiles] = useState([]);
  const [baseDesignationTiles, setBaseDesignationTiles] = useState([]);

  // ✅ raw designation rows (includes ex_cader_court)
  const [rawDesignationRows, setRawDesignationRows] = useState([]);

  // RIGHT (district)
  const [districtTiles, setDistrictTiles] = useState([]);
  const [masterDistrictTiles, setMasterDistrictTiles] = useState([]);

  const [loadingLeft, setLoadingLeft] = useState(true);
  const [loadingRight, setLoadingRight] = useState(true);

  const [selectedDesignation, setSelectedDesignation] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // ✅ Overall split filter: "ALL" | "IN_FIELD" | "EX_CADRE"
  const [selectedCadre, setSelectedCadre] = useState("ALL");

  // ✅ keep latest cadre immediately (avoid stale state)
  const selectedCadreRef = useRef("ALL");

  // District search + sort
  const [districtQuery, setDistrictQuery] = useState("");
  const [districtSort, setDistrictSort] = useState("division_az");

  // ✅ slim top bar zoom slider
  const [zoom, setZoom] = useState(0.9);

  // ---------------- helpers ----------------
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return Number.isFinite(val) ? val : 0;
    const cleaned = String(val).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const norm = (s) =>
    String(s ?? "")
      .trim()
      .toUpperCase();

  // ✅ rule:
  // ex_cader_court === "OTHER COURTS" => IN_FIELD
  // all other => EX_CADRE
  const rowToCadreType = (ex_cader_court) => {
    const v = norm(ex_cader_court);
    if (v === "OTHER COURTS") return "IN_FIELD";
    return "EX_CADRE";
  };

  const hashString = (s) => {
    const str = String(s ?? "");
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
    return Math.abs(h >>> 0);
  };

  const colorById = (id, palette) => palette[hashString(id) % palette.length];

  // ---------------- colors ----------------
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

  const DIVISION_COLORS_9 = [
    "bg-gradient-to-br from-sky-400/90 via-sky-500/90 to-blue-600/90 text-white",
    "bg-gradient-to-br from-indigo-400/90 via-indigo-500/90 to-indigo-600/90 text-white",
    "bg-gradient-to-br from-violet-400/90 via-violet-500/90 to-purple-600/90 text-white",
    "bg-gradient-to-br from-pink-400/90 via-pink-500/90 to-rose-500/90 text-white",
    "bg-gradient-to-br from-cyan-400/90 via-cyan-500/90 to-cyan-600/90 text-white",
    "bg-gradient-to-br from-teal-400/90 via-teal-500/90 to-teal-600/90 text-white",
    "bg-gradient-to-br from-orange-400/90 via-orange-500/90 to-orange-600/90 text-white",
    "bg-gradient-to-br from-amber-700/90 via-orange-800/90 to-stone-800/90 text-white",
    "bg-gradient-to-br from-yellow-400/90 via-yellow-500/90 to-yellow-700/90 text-white",
  ];

  const TOTAL_COLOR =
    "bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900";

  // ---------------- API fetchers ----------------

  // ✅ designation count with ex_cader_court
  const fetchDesignationRows = async () => {
    const data =
      typeof Api.getDesignationCount === "function"
        ? await Api.getDesignationCount()
        : await Api.getOverallCount();

    return (data || []).map((x) => ({
      designationId:
        x.designationid ??
        x.DESIGNATIONID ??
        x.DESIGNATIONIDDRIVED ??
        x.DESIGNATIONIDDRIVED,
      designationDesc:
        x.Designationdesc ??
        x.DESIGNATIONDESC ??
        x.DESIGNATIONDESCDRIVED ??
        x.DESIGNATION ??
        x.designation,
      cnt: toNumber(x.cnt ?? x.CNT ?? x.TOTAL ?? x.total),
      ex_cader_court: x.ex_cader_court ?? x.EX_CADER_COURT ?? x.exCadreCourt,
    }));
  };

  // Aggregate designation tiles from raw rows based on cadre filter
  const aggregateDesignationTiles = (rows, cadre) => {
    const filtered =
      cadre === "ALL"
        ? rows
        : rows.filter((r) => rowToCadreType(r.ex_cader_court) === cadre);

    const map = new Map();

    for (const r of filtered) {
      const id = String(r.designationId ?? r.designationDesc ?? "").trim();
      const label = String(r.designationDesc ?? "").trim();

      const key = `${id}||${label}`;
      const prev = map.get(key) ?? { id, label, count: 0 };
      prev.count += toNumber(r.cnt);
      map.set(key, prev);
    }

    // keep previous sorting by id numeric parts if possible
    const toIdParts = (id) => {
      const s = String(id ?? "").trim();
      if (!s) return [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      const parts = s.split(".").map((p) => Number(p));
      return [
        Number.isFinite(parts[0]) ? parts[0] : Number.POSITIVE_INFINITY,
        Number.isFinite(parts[1]) ? parts[1] : Number.POSITIVE_INFINITY,
      ];
    };

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const [a1, a2] = toIdParts(a.id);
      const [b1, b2] = toIdParts(b.id);
      if (a1 !== b1) return a1 - b1;
      return a2 - b2;
    });

    return list;
  };

  /**
   * ✅ IMPORTANT:
   * This API MUST accept cadre (ALL/IN_FIELD/EX_CADRE) via query param.
   * Api.js should call: /dj/getDistrictPostingCountoverAll?cadre=IN_FIELD
   */
  const fetchOverallDistrictTiles = async (cadre = "ALL") => {
    try {
      const data = await Api.getDistrictPostingCountoverAll(cadre);
      return (data || []).map((x) => ({
        id: x.DISTRICTID ?? x.DISTRICTNAME,
        label: x.DISTRICTNAME,
        count: toNumber(x.TOTAL ?? x.CNT ?? x.COUNT),
        division:
          x.DIVISIONNAME ?? x.DIVISION ?? x.divisionName ?? x.division ?? "",
      }));
    } catch (e) {
      console.error("fetchOverallDistrictTiles error:", e);
      return [];
    }
  };

  // designation -> districts (cadre aware)
  const fetchDistrictByDesignation = async (designationDesc, cadre = "ALL") => {
    try {
      const data = await Api.getDistrictPostingCount(designationDesc, cadre);
      return (data || []).map((x) => ({
        label: x.DISTRICTNAME,
        count: toNumber(x.TOTAL ?? x.CNT ?? x.COUNT),
        division:
          x.DIVISIONNAME ?? x.DIVISION ?? x.divisionName ?? x.division ?? "",
      }));
    } catch (error) {
      console.error("fetchDistrictByDesignation error:", error);
      return [];
    }
  };

  // district -> designations (✅ cadre aware)
  const fetchDesignationsByDistrict = async (districtName, cadre = "ALL") => {
    const data = await Api.getDesignationWiseCountWithDistrictFilter(
      districtName,
      cadre,
    );

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

  // ✅ keep district positions stable (master + counts + keep division)
  const applyDesignationToDistrictGrid = (countsList) => {
    const countsMap = new Map(
      (countsList || []).map((x) => [
        String(x.label ?? "").trim(),
        { count: toNumber(x.count), division: String(x.division ?? "").trim() },
      ]),
    );

    const stable = (masterDistrictTiles || []).map((d) => {
      const key = String(d.label ?? "").trim();
      const hit = countsMap.get(key);
      return {
        ...d,
        count: hit?.count ?? 0,
        division: String(hit?.division || d.division || "").trim(),
      };
    });

    setDistrictTiles(stable);
  };

  // ---------------- initial load ----------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingLeft(true);
        setLoadingRight(true);

        const [rows, d2] = await Promise.all([
          fetchDesignationRows(),
          fetchOverallDistrictTiles("ALL"),
        ]);

        if (!mounted) return;

        setRawDesignationRows(rows);

        const aggAll = aggregateDesignationTiles(rows, "ALL");
        setBaseDesignationTiles(aggAll);
        setDesignationTiles(aggAll);

        // ✅ MASTER: DIVISION → DISTRICT (default)
        const master = [...(d2 || [])].sort((a, b) => {
          const ad = String(a.division ?? "").localeCompare(
            String(b.division ?? ""),
            "en",
            { sensitivity: "base" },
          );
          if (ad !== 0) return ad;
          return String(a.label ?? "").localeCompare(
            String(b.label ?? ""),
            "en",
            {
              sensitivity: "base",
            },
          );
        });

        setMasterDistrictTiles(master);
        setDistrictTiles(master);

        selectedCadreRef.current = "ALL";
        setSelectedCadre("ALL");
        setSelectedDesignation("ALL");
        setSelectedDistrict(null);
        setDistrictSort("division_az");
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!mounted) return;
        setRawDesignationRows([]);
        setDesignationTiles([]);
        setBaseDesignationTiles([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- division color map (stable) ----------------
  const divisionColorMap = useMemo(() => {
    const divisions = [];
    const seen = new Set();

    for (const d of masterDistrictTiles) {
      const div = String(d?.division ?? "").trim();
      if (!div) continue;
      if (!seen.has(div)) {
        seen.add(div);
        divisions.push(div);
      }
    }

    divisions.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

    const map = new Map();
    divisions.forEach((divName, i) => {
      map.set(divName, DIVISION_COLORS_9[i % DIVISION_COLORS_9.length]);
    });

    return map;
  }, [masterDistrictTiles]);

  const fallbackDivisionColor = DIVISION_COLORS_9[0];

  // ---------------- cadre totals ----------------
  const totalOverall = useMemo(() => {
    const sum = rawDesignationRows.reduce((s, r) => s + toNumber(r.cnt), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [rawDesignationRows]);

  const totalInField = useMemo(() => {
    const sum = rawDesignationRows
      .filter((r) => rowToCadreType(r.ex_cader_court) === "IN_FIELD")
      .reduce((s, r) => s + toNumber(r.cnt), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [rawDesignationRows]);

  const totalExCadre = useMemo(() => {
    const sum = rawDesignationRows
      .filter((r) => rowToCadreType(r.ex_cader_court) === "EX_CADRE")
      .reduce((s, r) => s + toNumber(r.cnt), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [rawDesignationRows]);

  // ---------------- cadre click (top header) ----------------
  const onCadreClick = async (cadre) => {
    // ✅ set ref immediately
    selectedCadreRef.current = cadre;
    setSelectedCadre(cadre);

    // reset other filters
    setSelectedDesignation("ALL");
    setSelectedDistrict(null);
    setDistrictQuery("");
    setDistrictSort("division_az");

    // left: rebuild tiles from raw rows
    const agg = aggregateDesignationTiles(rawDesignationRows, cadre);
    setBaseDesignationTiles(agg);
    setDesignationTiles(agg);

    // ✅ right: reload districts overall for cadre
    setLoadingRight(true);
    try {
      const d2 = await fetchOverallDistrictTiles(cadre);

      const master = [...(d2 || [])].sort((a, b) => {
        const ad = String(a.division ?? "").localeCompare(
          String(b.division ?? ""),
          "en",
          { sensitivity: "base" },
        );
        if (ad !== 0) return ad;
        return String(a.label ?? "").localeCompare(
          String(b.label ?? ""),
          "en",
          {
            sensitivity: "base",
          },
        );
      });

      setMasterDistrictTiles(master);
      setDistrictTiles(master);
    } catch (e) {
      console.error("Load district overall by cadre error:", e);
      setDistrictTiles(masterDistrictTiles);
    } finally {
      setLoadingRight(false);
    }
  };

  // ---------------- designation click ----------------
  const onDesignationClick = async (labelOrAll) => {
    setSelectedDistrict(null);

    setSelectedDesignation(labelOrAll);
    setLoadingRight(true);

    setDistrictQuery("");
    setDistrictSort("division_az");

    setDesignationTiles(baseDesignationTiles);

    try {
      if (labelOrAll === "ALL") {
        setDistrictTiles(masterDistrictTiles);
        return;
      }

      const cadreToUse = selectedCadreRef.current || "ALL";
      const list = await fetchDistrictByDesignation(labelOrAll, cadreToUse);
      applyDesignationToDistrictGrid(list);
    } catch (e) {
      console.error("Load district by designation error:", e);
      setDistrictTiles(masterDistrictTiles);
    } finally {
      setLoadingRight(false);
    }
  };

  // ---------------- district click (✅ cadre-aware designation list) ----------------
  const onDistrictClick = async (districtName) => {
    if (!districtName) return;

    setSelectedDesignation("ALL");
    setDistrictTiles(masterDistrictTiles);
    setDistrictQuery("");
    setDistrictSort("division_az");

    setSelectedDistrict(districtName);
    setLoadingLeft(true);

    try {
      const cadreToUse = selectedCadreRef.current || "ALL";
      const tiles = await fetchDesignationsByDistrict(districtName, cadreToUse);
      setDesignationTiles(tiles);
    } catch (e) {
      console.error("Load designation by district error:", e);
      setDesignationTiles([]);
    } finally {
      setLoadingLeft(false);
    }
  };

  // details navigation
  const goToDesignationDetails = (designationId, designationLabel) => {
    navigate("/dashboard/officer-detail", {
      state: {
        designationId: designationId ?? "ALL",
        designation: designationLabel ?? "ALL",
        districtName: selectedDistrict ?? null,
        cadre: selectedCadreRef.current || selectedCadre,
      },
    });
  };

  const goToDistrictDetails = (districtName) => {
    navigate("/dashboard/officer-detail", {
      state: {
        designationId: "ALL",
        designation: "ALL",
        districtName: districtName ?? null,
        cadre: selectedCadreRef.current || selectedCadre,
      },
    });
  };

  // ---------------- totals ----------------
  const totalLeft = useMemo(() => {
    const sum = designationTiles.reduce((s, t) => s + toNumber(t.count), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [designationTiles]);

  const totalRight = useMemo(() => {
    const sum = districtTiles.reduce((s, t) => s + toNumber(t.count), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [districtTiles]);

  // (kept, even if not shown anymore)
  const headerLabel = selectedDistrict
    ? `Total in District: ${selectedDistrict}`
    : selectedDesignation === "ALL"
      ? selectedCadre === "ALL"
        ? "Total Judges (Overall)"
        : selectedCadre === "IN_FIELD"
          ? "Total Judges (IN FIELD)"
          : "Total Judges (EX-CADRE)"
      : `Total in ${selectedDesignation}`;

  // ---------------- district filter list ----------------
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

    const byDistrictName = (a, b) =>
      String(a.label ?? "").localeCompare(String(b.label ?? ""), "en", {
        sensitivity: "base",
      });

    const byDivisionThenDistrict = (a, b) => {
      const ad = String(a.division ?? "").localeCompare(
        String(b.division ?? ""),
        "en",
        { sensitivity: "base" },
      );
      if (ad !== 0) return ad;
      return byDistrictName(a, b);
    };

    const sorted = [...list];

    if (districtSort === "division_az") sorted.sort(byDivisionThenDistrict);
    if (districtSort === "division_za")
      sorted.sort((a, b) => byDivisionThenDistrict(b, a));

    if (districtSort === "district_az") sorted.sort(byDistrictName);
    if (districtSort === "district_za")
      sorted.sort((a, b) => byDistrictName(b, a));
    if (districtSort === "count_desc") sorted.sort((a, b) => byCount(b, a));
    if (districtSort === "count_asc") sorted.sort((a, b) => byCount(a, b));

    return sorted;
  }, [districtTiles, districtQuery, districtSort]);

  // ---------------- render ----------------
  return (
    <Layout onLogout={onLogout}>
      <div className="bg-slate-50 min-h-[calc(100vh-88px)] overflow-auto">
        {/* Slim top bar */}
        <div className="px-2 pt-2">
          <div className="flex items-center justify-end gap-2">
            <div className="text-[10px] font-extrabold text-slate-600">
              Zoom
            </div>
            <input
              type="range"
              min={75}
              max={125}
              step={5}
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-36 accent-indigo-600"
              title="Zoom dashboard"
            />
            <div className="text-[10px] font-extrabold text-slate-600 w-10 text-right">
              {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>

        {/* zoomed content */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${100 / zoom}%`,
          }}
          className="px-2 pb-2"
        >
          {/* Total bar */}
          <div
            className={`${TOTAL_COLOR} rounded-2xl text-white shadow-xl mb-3 border border-white/10`}
          >
            <div className="relative py-3 px-4">
              {/* ✅ Single row + tile style */}
              <div className="flex items-stretch justify-center gap-3 flex-nowrap overflow-x-auto">
                {/* TOTAL */}
                <button
                  onClick={() => onCadreClick("ALL")}
                  className={`min-w-[230px] px-5 py-2 rounded-2xl shadow-lg
                    flex flex-col justify-center items-center whitespace-nowrap transition
                    bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-700 hover:brightness-110
                    ${
                      selectedCadre === "ALL"
                        ? "ring-4 ring-yellow-300 scale-105"
                        : "ring-1 ring-white/20"
                    }`}
                >
                  <div className="text-[11px] uppercase tracking-widest font-bold text-white/90">
                    TOTAL
                  </div>
                  <div className="text-[20px] md:text-[22px] font-extrabold leading-none mt-1 text-white">
                    {totalOverall}
                  </div>
                </button>

                {/* IN FIELD */}
                <button
                  onClick={() => onCadreClick("IN_FIELD")}
                  className={`min-w-[230px] px-5 py-2 rounded-2xl shadow-lg
                    flex flex-col justify-center items-center whitespace-nowrap transition
                    bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-700 hover:brightness-110
                    ${
                      selectedCadre === "IN_FIELD"
                        ? "ring-4 ring-yellow-300 scale-105"
                        : "ring-1 ring-white/20"
                    }`}
                >
                  <div className="text-[11px] uppercase tracking-widest font-bold text-white/90">
                    IN FIELD
                  </div>
                  <div className="text-[20px] md:text-[22px] font-extrabold leading-none mt-1 text-white">
                    {totalInField}
                  </div>
                </button>

                {/* EX CADRE */}
                <button
                  onClick={() => onCadreClick("EX_CADRE")}
                  className={`min-w-[230px] px-5 py-2 rounded-2xl shadow-lg
                    flex flex-col justify-center items-center whitespace-nowrap transition
                    bg-gradient-to-br from-amber-400 via-orange-600 to-rose-700 hover:brightness-110
                    ${
                      selectedCadre === "EX_CADRE"
                        ? "ring-4 ring-yellow-300 scale-105"
                        : "ring-1 ring-white/20"
                    }`}
                >
                  <div className="text-[11px] uppercase tracking-widest font-bold text-white/90">
                    EX CADRE
                  </div>
                  <div className="text-[20px] md:text-[22px] font-extrabold leading-none mt-1 text-white">
                    {totalExCadre}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Layout updated: left = narrow, right = wide */}
          <div className="grid grid-cols-12 gap-3">
            {/* LEFT (designation) */}
            <div className="col-span-12 xl:col-span-3 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="leading-tight">
                  <div className="text-[13px] font-extrabold text-slate-800 tracking-tight">
                    {selectedDistrict
                      ? `Designation-wise ( ${selectedDistrict} )`
                      : selectedCadre === "ALL"
                        ? "Designation-wise"
                        : selectedCadre === "IN_FIELD"
                          ? "Designation-wise (IN FIELD)"
                          : "Designation-wise (EX-CADRE)"}
                  </div>
                  <div className="text-[9px] text-slate-500 -mt-0.5">
                    Click tile = filter | Details = officer list
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600">
                  {designationTiles.length + 1} tiles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* ALL */}
                <div
                  className={`bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-2xl p-[0.55rem] text-white font-extrabold
                    ${
                      selectedDesignation === "ALL" && !selectedDistrict
                        ? "ring-4 ring-white/35"
                        : ""
                    }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onDesignationClick("ALL")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        onDesignationClick("ALL");
                    }}
                    className="cursor-pointer text-center"
                  >
                    <div className="text-[10px] uppercase tracking-wide opacity-95">
                      ALL
                    </div>
                    <div className="text-[20px] mt-1 leading-none">
                      {loadingLeft
                        ? 0
                        : selectedDistrict
                          ? totalLeft
                          : selectedCadre === "ALL"
                            ? totalOverall
                            : selectedCadre === "IN_FIELD"
                              ? totalInField
                              : totalExCadre}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToDesignationDetails("ALL", "ALL")}
                    className="mt-2 w-full rounded-xl bg-white/15 text-white text-[11px] py-[0.425rem] font-bold hover:bg-white/20 transition"
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
                      className={`${bg} rounded-2xl p-[0.55rem] text-white font-extrabold`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onDesignationClick(t.label ?? "")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            onDesignationClick(t.label ?? "");
                        }}
                        className="cursor-pointer text-center"
                      >
                        <div className="text-[10px] uppercase tracking-wide opacity-95 line-clamp-2">
                          {t.label || "Unknown"}
                        </div>
                        <div className="text-[20px] mt-1 leading-none">
                          {t.count}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          goToDesignationDetails(t.id ?? "ALL", t.label ?? "")
                        }
                        className="mt-2 w-full rounded-xl bg-white/15 text-white text-[11px] py-[0.425rem] font-bold hover:bg-white/20 transition"
                      >
                        Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT (district) */}
            <div className="col-span-12 xl:col-span-9 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="leading-tight">
                  <div className="font-extrabold text-slate-800 text-[18px]">
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
                    className="w-40 md:w-56 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-sky-200"
                  />
                  <select
                    value={districtSort}
                    onChange={(e) => setDistrictSort(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="division_az">
                      Division → District (Default)
                    </option>
                    <option value="division_za">
                      Division → District (Reverse)
                    </option>
                    <option value="district_az">District A–Z</option>
                    <option value="district_za">District Z–A</option>
                    <option value="count_desc">Count ↓</option>
                    <option value="count_asc">Count ↑</option>
                  </select>
                </div>
              </div>

              <div className="text-[12px] text-slate-500 mb-3">
                {loadingRight
                  ? "Loading..."
                  : `${filteredDistricts.length} / ${districtTiles.length} districts`}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {filteredDistricts.map((t, idx) => {
                  const key = t.id ?? t.label ?? idx;

                  const div = String(t.division ?? "").trim();
                  const bg = divisionColorMap.get(div) || fallbackDivisionColor;

                  const isActive = selectedDistrict === t.label;

                  return (
                    <div
                      key={key}
                      className={`${bg} rounded-2xl p-4 font-extrabold
                        hover:ring-2 hover:ring-slate-200 transition-all duration-200
                        ${isActive ? "ring-4 ring-white/35" : ""}`}
                      title={`${t.label}${div ? ` | ${div}` : ""}`}
                    >
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
                        <div className="text-[11px] uppercase tracking-wide opacity-90 line-clamp-1">
                          {t.label || "Unknown"}
                        </div>

                        {div && (
                          <div className="text-[10px] font-bold opacity-90 mt-1 line-clamp-1">
                            {div}
                          </div>
                        )}

                        <div className="text-3xl mt-2 leading-none">
                          {t.count}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => goToDistrictDetails(t.label)}
                        className="mt-3 w-full rounded-xl bg-white/15 text-white text-[12px] py-2 font-bold hover:bg-white/20 transition"
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

          <div className="h-2" />
        </div>
      </div>
    </Layout>
  );
}
