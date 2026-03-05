// src/pages/officer/components/OfficerTabs.jsx
import React from "react";
import { NavLink, useParams } from "react-router-dom";

const Tab = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "px-3 py-1.5 rounded-xl text-[12px] font-black border transition",
        isActive
          ? "bg-white text-slate-900 border-slate-200"
          : "bg-white/70 text-slate-700 border-slate-200/70 hover:bg-white",
      ].join(" ")
    }
  >
    {children}
  </NavLink>
);

export default function OfficerTabs() {
  const { officerId } = useParams();

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
      <div className="p-3 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white flex items-center justify-between">
        <div className="text-[14px] font-black">Details</div>
        <div className="flex flex-wrap gap-2">
          <Tab to={`/officer/${officerId}/posting`}>Posting / Transfers</Tab>
          <Tab to={`/officer/${officerId}/qualifications`}>Qualifications</Tab>
          <Tab to={`/officer/${officerId}/leaves`}>Leaves</Tab>
        </div>
      </div>
    </div>
  );
}
