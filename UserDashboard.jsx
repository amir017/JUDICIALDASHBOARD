import React, { useEffect, useMemo, useState } from "react";
import Layout from "./Layout";
import Api from "../API/Api";

export default function Dashboard({ onLogout }) {
  const [designationTiles, setDesignationTiles] = useState([]);
  const [districtTiles, setDistrictTiles] = useState([]);

  const TILE_COLORS = [
    "bg-gradient-to-br from-[#06B6D4] via-[#0EA5E9] to-[#3B82F6]",
    "bg-gradient-to-br from-[#F59E0B] via-[#FBBF24] to-[#FCD34D]",
    "bg-gradient-to-br from-[#10B981] via-[#34D399] to-[#6EE7B7]",
    "bg-gradient-to-br from-[#8B5CF6] via-[#A78BFA] to-[#C4B5FD]",
    "bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#FDBA74]",
    "bg-gradient-to-br from-[#EC4899] via-[#F472B6] to-[#F9A8D4]",
    "bg-gradient-to-br from-[#0EA5E9] via-[#3B82F6] to-[#60A5FA]",
    "bg-gradient-to-br from-[#FBBF24] via-[#FCD34D] to-[#FEF08A]",
  ];

  // 1) Load designation tiles (your existing API)
  const fetchDesignationTiles = async () => {
    try {
      const data = await Api.getOverallCount(); // <-- your existing designation-wise count api
      // expected: [{ DESIGNATIONDESC, CNT, DESIGNATIONID }, ...]
      const formatted = (data || []).map((x) => ({
        id: x.DESIGNATIONID,
        label: x.DESIGNATIONDESC,
        count: x.CNT,
      }));
      setDesignationTiles(formatted);
    } catch (e) {
      console.error("Error fetching designation tiles:", e);
      setDesignationTiles([]);
    }
  };

  // 2) Load district tiles (NEW API you shared)
  const fetchDistrictTiles = async () => {
    try {
      const data = await Api.getDistrictPostingCountoverAll();
      /**
       * Tell me exact fields if different.
       * I am assuming something like:
       * [{ DISTRICTNAME, TOTAL }, ...]
       */
      const formatted = (data || []).map((x) => ({
        // use DISTRICTID if backend provides it, otherwise name as fallback
        id: x.DISTRICTID ?? x.DISTRICTNAME,
        label: x.DISTRICTNAME,
        count: x.TOTAL ?? x.CNT ?? x.COUNT ?? 0,
      }));
      setDistrictTiles(formatted);
    } catch (e) {
      console.error("Error fetching district tiles:", e);
      setDistrictTiles([]);
    }
  };

  useEffect(() => {
    fetchDesignationTiles();
    fetchDistrictTiles();
  }, []);

  const totalJudges = useMemo(() => {
    return designationTiles.reduce((sum, t) => sum + (Number(t.count) || 0), 0);
  }, [designationTiles]);

  // Click handlers (navigation later)
  const onDesignationClick = (tile) => {
    console.log("Designation tile clicked:", tile);
    // later: navigate(`/next?designationId=${tile.id}`)
  };

  const onDistrictClick = (tile) => {
    console.log("District tile clicked:", tile);
    // later: navigate(`/next?districtId=${tile.id}`)
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-8">
        {/* TOP: Total + Designation tiles */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Total */}
            <div
              className={`${TILE_COLORS[0]} w-full lg:w-64 p-6 rounded-xl shadow-xl flex flex-col items-center justify-center text-white font-bold text-center`}
            >
              <span className="text-sm tracking-wide uppercase opacity-90">
                Total
              </span>
              <span className="text-4xl mt-2 drop-shadow-lg">
                {totalJudges}
              </span>
            </div>

            {/* Designation tiles: about 10 (responsive grid) */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Designation-wise
                </h2>
                <span className="text-sm text-gray-500">
                  {designationTiles.length} tiles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                {designationTiles.map((t, idx) => (
                  <div
                    key={t.id ?? idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => onDesignationClick(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        onDesignationClick(t);
                    }}
                    className={`${
                      TILE_COLORS[(idx + 1) % TILE_COLORS.length]
                    } p-4 rounded-xl shadow-xl
                      text-white font-bold text-center cursor-pointer transform transition-transform duration-200 hover:scale-105`}
                    title="Click (navigation later)"
                  >
                    <div className="text-xs tracking-wide uppercase opacity-90 line-clamp-2">
                      {t.label || "Unknown"}
                    </div>
                    <div className="text-2xl mt-2 drop-shadow-lg">
                      {t.count ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECOND: District tiles (up to 30) */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              District-wise
            </h2>
            <span className="text-sm text-gray-500">
              {districtTiles.length} districts
            </span>
          </div>

          {/* More tiles => denser grid on large screens */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {districtTiles.map((t, idx) => (
              <div
                key={t.id ?? idx}
                role="button"
                tabIndex={0}
                onClick={() => onDistrictClick(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onDistrictClick(t);
                }}
                className={`${
                  TILE_COLORS[idx % TILE_COLORS.length]
                } p-3 rounded-xl shadow-xl
                  text-white font-bold text-center cursor-pointer transform transition-transform duration-200 hover:scale-105`}
                title="Click (navigation later)"
              >
                <div className="text-[11px] tracking-wide uppercase opacity-90 line-clamp-2">
                  {t.label || "Unknown"}
                </div>
                <div className="text-xl mt-1 drop-shadow-lg">
                  {t.count ?? 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
