// src/pages/officer/OfficerProfileLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import Api from "../../API/Api";
import OfficerHeader from "./components/OfficerHeader";
import OfficerTabs from "./components/OfficerTabs";
import { hashString } from "./utils/officerFormat";

export default function OfficerProfileLayout({ onLogout }) {
  const navigate = useNavigate();
  const { officerId } = useParams();

  const [profile, setProfile] = useState(null);

  // shared data for tabs (kept here so tabs don't refetch when switching)
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRows, setHistoryRows] = useState([]);

  const [qualLoading, setQualLoading] = useState(true);
  const [qualRows, setQualRows] = useState([]);

  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveRows, setLeaveRows] = useState([]);

  const [leaveYearLoading, setLeaveYearLoading] = useState(true);
  const [leaveYearRows, setLeaveYearRows] = useState([]);

  // profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!officerId) {
          setProfile(null);
          return;
        }
        const res = await Api.getOfficerProfile({ officerId });
        if (!mounted) return;
        setProfile(res ?? null);
      } catch (e) {
        console.error("Officer profile load error:", e);
        if (mounted) setProfile(null);
      }
    })();
    return () => (mounted = false);
  }, [officerId]);

  // posting
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setHistoryLoading(true);
        if (!officerId) return setHistoryRows([]);
        const rows = await Api.getOfficerPostingHistory({ officerId });
        if (!mounted) return;
        setHistoryRows(rows || []);
      } catch (e) {
        console.error("Posting history load error:", e);
        if (mounted) setHistoryRows([]);
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [officerId]);

  // qualifications
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setQualLoading(true);
        if (!officerId) return setQualRows([]);
        const rows = await Api.getOfficerQualifications({ officerId });
        if (!mounted) return;
        setQualRows(rows || []);
      } catch (e) {
        console.error("Qualifications load error:", e);
        if (mounted) setQualRows([]);
      } finally {
        if (mounted) setQualLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [officerId]);

  // leaves list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLeaveLoading(true);
        if (!officerId) return setLeaveRows([]);
        const rows = await Api.getOfficerLeaves({ officerId });
        if (!mounted) return;
        setLeaveRows(rows || []);
      } catch (e) {
        console.error("Leaves load error:", e);
        if (mounted) setLeaveRows([]);
      } finally {
        if (mounted) setLeaveLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [officerId]);

  // leaves yearly
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLeaveYearLoading(true);
        if (!officerId) return setLeaveYearRows([]);
        const rows = await Api.getOfficerLeavesYearly({ officerId });
        if (!mounted) return;
        setLeaveYearRows(rows || []);
      } catch (e) {
        console.error("Leaves yearly load error:", e);
        if (mounted) setLeaveYearRows([]);
      } finally {
        if (mounted) setLeaveYearLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [officerId]);

  const palette = useMemo(() => {
    const key =
      profile?.DESIGNATIONDESC ||
      profile?.DESIGNATION ||
      profile?.OFFICERNAME ||
      officerId ||
      "NA";
    hashString(key);
    return {
      hero: "from-emerald-700 via-teal-600 to-sky-600",
      glow1: "bg-emerald-300/30",
      glow2: "bg-sky-300/25",
    };
  }, [profile, officerId]);

  const outletCtx = useMemo(
    () => ({
      officerId,
      profile,
      palette,

      historyLoading,
      historyRows,

      qualLoading,
      qualRows,

      leaveLoading,
      leaveRows,

      leaveYearLoading,
      leaveYearRows,
    }),
    [
      officerId,
      profile,
      palette,
      historyLoading,
      historyRows,
      qualLoading,
      qualRows,
      leaveLoading,
      leaveRows,
      leaveYearLoading,
      leaveYearRows,
    ],
  );

  return (
    <Layout onLogout={onLogout}>
      <div className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50/40 px-4 py-4">
        <div
          className={`pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full ${palette.glow1} blur-3xl`}
        />
        <div
          className={`pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full ${palette.glow2} blur-3xl`}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 font-extrabold shadow-sm hover:bg-white"
          >
            ← Back
          </button>
          <div className="flex-1">
            <div className="text-[11px] text-slate-600 font-extrabold tracking-wider">
              OFFICER PROFILE
            </div>
            <div className="text-xl md:text-2xl font-black text-slate-900">
              {profile?.OFFICERNAME || "Officer"}
              {officerId ? (
                <span className="ml-2 text-sm font-extrabold text-slate-500">
                  (ID: {officerId})
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ✅ PROFILE FIRST ROW (FULL WIDTH) */}
        <div className="relative z-10 space-y-4">
          <OfficerHeader
            profile={profile}
            officerId={officerId}
            palette={palette}
          />

          {/* ✅ TABS AFTER PROFILE */}
          <OfficerTabs />

          {/* ✅ TAB CONTENT */}
          <Outlet context={outletCtx} />
        </div>
      </div>
    </Layout>
  );
}
