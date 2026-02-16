import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Api from "../API/Api"; // Adjust import path

export default function Dashboard({ onLogout }) {
  // ---------- State ----------
  const [totalJudgesData, setTotalJudgesData] = useState([]);
  /*const [districtPieData, setDistrictPieData] = useState([
    { name: "District A", value: 15 },
    { name: "District B", value: 20 },
    { name: "District C", value: 10 },
    { name: "District D", value: 10 },
    { name: "District E", value: 10 },
  ]);*/
  const [districtPieData, setDistrictPieData] = useState([]);
  const [tehsilPieData, setTehsilPieData] = useState([
    { name: "Tehsil 1", value: 12 },
    { name: "Tehsil 2", value: 15 },
    { name: "Tehsil 3", value: 18 },
    { name: "Tehsil 4", value: 10 },
  ]);

  // ---------- Colors ----------
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

  const PIE_COLORS = [
    "#06B6D4",
    "#0EA5E9",
    "#3B82F6",
    "#F59E0B",
    "#FBBF24",
    "#10B981",
    "#8B5CF6",
  ];

  const fetchDistrictPostingCount = async (designation) => {
    try {
      // Call API (passing designation as query param)
      const data = await Api.getOverallCount(designation);

      console.log("API data:", data);

      // Format for pie chart
      const formattedData = data.map((item) => ({
        name: item.DISTRICTNAME, // API returns DISTRICTNAME
        value: item.TOTAL, // API returns TOTAL count
      }));

      console.log("Formatted district data:", formattedData);

      setDistrictPieData(formattedData);
    } catch (error) {
      console.error("Error fetching district posting count:", error);
    }
  };

  // ---------- Fetch Overall Judges Data ----------
  const fetchOverallJudgesData = async () => {
    try {
      const data = await Api.getOverallCount();
      console.log("DATA:", data);

      const formattedData = data.map((item) => ({
        designation: item.DESIGNATIONDESC, // match API
        count: item.CNT,
        DESIGNATIONID: item.DESIGNATIONID, // add for key
      }));

      console.log(
        "Formatted data:",
        formattedData.map((i) => i)
      );

      setTotalJudgesData(formattedData);
    } catch (error) {
      console.error("Error fetching overall judges data:", error);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchOverallJudgesData();
    fetchDistrictPostingCount(2);
  }, []);

  const totalJudges = totalJudgesData.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-10">
        {/* ---------- Tiles ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 flex gap-4">
            {/* 1. Total Judges (Fixed Width Sidebar) */}
            <div
              className={`${TILE_COLORS[0]} w-40 flex-shrink-0 p-4 rounded-xl shadow-xl flex flex-col items-center justify-center
      text-white font-bold text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.7)]`}
            >
              <span className="text-xs tracking-wide uppercase opacity-90">
                Total Judges
              </span>
              <span className="text-3xl md:text-5xl mt-2 drop-shadow-lg">
                {totalJudges}
              </span>
            </div>

            {/* 2. Designation Grid (Fills remaining space) */}
            {/* flex-1 allows it to fill width, grid-cols-2 makes boxes large like the image */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 gap-4">
              {totalJudgesData.map((item, idx) => (
                <div
                  key={item.DESIGNATIONID}
                  className={`${
                    TILE_COLORS[idx % TILE_COLORS.length]
                  } p-4 rounded-xl shadow-xl flex flex-col items-center justify-center
          text-white font-bold text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.7)]`}
                >
                  <span className="text-xs tracking-wide uppercase opacity-90">
                    {item.designation || "Unknown"}
                  </span>
                  <span className="text-2xl md:text-3xl mt-1 drop-shadow-lg">
                    {item.count ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Judges by District
            </h2>
            <ResponsiveContainer width="100%" height={450}>
              <PieChart>
                <Pie
                  data={districtPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={160}
                  label
                >
                  {districtPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Judges by Tehsil
            </h2>
            <ResponsiveContainer width="100%" height={450}>
              <PieChart>
                <Pie
                  data={tehsilPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={160}
                  label
                >
                  {tehsilPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* ---------- Pie Charts ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* District Pie Chart */}

          {/* Tehsil Pie Chart */}
        </div>
      </div>
    </Layout>
  );
}
