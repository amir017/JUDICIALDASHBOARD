import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, IdCard, Phone, MapPin, Home } from "lucide-react";
import Layout from "./Layout";
import Api from "../API/Api";

import PostingTransfersTab from "../pages/officer/tabs/PostingTransfersTab";
import PostingHistoryTab from "../pages/officer/tabs/PostingHistoryTab";
import QualificationsTab from "../pages/officer/tabs/QualificationsTab";
import LeavesTab from "../pages/officer/tabs/LeavesTab";

import SkillsTab from "../pages/officer/tabs/SkillsTab";
import PublicationsTab from "../pages/officer/tabs/PublicationsTab";
import TrainingsTab from "../pages/officer/tabs/TrainingsTab";
import RelationshipsTab from "../pages/officer/tabs/RelationshipsTab";
import GamesTab from "../pages/officer/tabs/GamesTab";
import AchievementsTab from "../pages/officer/tabs/AchievementsTab";
import ComplaintsTab from "../pages/officer/tabs/ComplaintsTab";
import InquiryTab from "../pages/officer/tabs/InquiryTab";
import ExamsTab from "../pages/officer/tabs/ExamsTab.jsx";
import PerformanceTab from "../pages/officer/tabs/PerformanceTab.jsx";
import ACRTab from "../pages/officer/tabs/ACRTab.jsx";

import {
  safeText,
  safeDate,
  getInitials,
  hashString,
  toDDMMYYYY,
  parseDateSafe,
  daysBetween,
  fmtYMDLong,
} from "../pages/officer/officerUtils/officerFormat.js";

/* ---------------- UI Components ---------------- */

const badgeCls =
  "px-2 py-0.5 rounded-full text-[10px] font-semibold border border-white/25 bg-white/15 text-white backdrop-blur";

const ToggleBtn = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-white/25 transition",
      active
        ? "bg-white text-slate-900"
        : "bg-white/15 text-white hover:bg-white/20",
    ].join(" ")}
  >
    {children}
  </button>
);

const FancyCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-2.5 py-2.5 shadow-sm">
    <div className="flex items-start gap-2">
      <span className="h-8 w-8 rounded-xl bg-white/15 border border-white/20 grid place-items-center flex-shrink-0">
        <Icon size={14} className="text-white" />
      </span>
      <div className="min-w-0">
        <div className="text-[8px] font-bold uppercase tracking-wider text-white/70">
          {label}
        </div>
        <div className="mt-0.5 text-[12px] font-semibold text-white truncate">
          {safeText(value)}
        </div>
      </div>
    </div>
  </div>
);

const AddressCard = ({ address, label = "Address" }) => {
  const [open, setOpen] = useState(false);
  const addr = safeText(address);

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-2.5 py-2.5 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="h-8 w-8 rounded-xl bg-white/15 border border-white/20 grid place-items-center flex-shrink-0">
          <Home size={14} className="text-white" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-bold uppercase tracking-wider text-white/70">
              {label}
            </div>

            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="text-[10px] text-white/90"
            >
              {open ? "Hide" : "Show"}
            </button>
          </div>

          {!open ? (
            <div className="mt-0.5 text-[12px] font-semibold text-white truncate">
              {addr}
            </div>
          ) : (
            <div className="mt-1 text-[12px] font-semibold text-white break-words">
              {addr}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========================= CURRENT POSTING ========================= */

const getNotifNo = (r) =>
  r.NOTIFICATION_NO ||
  r.NOTIFICATIONNO ||
  r.NOTIF_NO ||
  r.NOTIFNO ||
  r.NOTIFICATIONNUMBER ||
  "";

const getNotifDate = (r) =>
  r.NOTIFY_DATE ||
  r.NOTIFYDATE ||
  r.NOTIFICATION_DATE ||
  r.NOTIF_DATE ||
  r.NOTIFICATIONDATE ||
  "";

const normalizePostingRows = (rows) => {
  const list = (rows || []).map((r) => {
    const from = parseDateSafe(r.FDATE || r.DATEOFPOSTING);
    const to = parseDateSafe(r.TDATE) || new Date();
    const durationDays = daysBetween(from, to);

    const fromTxt = toDDMMYYYY(r.FDATE || r.DATEOFPOSTING);
    const toTxt = r.TDATE ? toDDMMYYYY(r.TDATE) : "Present";

    return {
      ...r,
      _from: from,
      _to: to,
      _durationDays: durationDays,
      _period: `${fromTxt} → ${toTxt}`,
      _notifNo: getNotifNo(r),
      _notifDate: getNotifDate(r),
    };
  });

  list.sort(
    (a, b) => (a._from?.getTime?.() || 0) - (b._from?.getTime?.() || 0),
  );

  return list;
};

const pickCurrentPosting = (rows) => {
  const items = normalizePostingRows(rows);
  if (!items.length) return null;

  const present = items.filter((x) => !x.TDATE || !String(x.TDATE).trim());
  if (present.length) {
    present.sort(
      (a, b) => (b._from?.getTime?.() || 0) - (a._from?.getTime?.() || 0),
    );
    return present[0];
  }

  const copy = [...items];
  copy.sort((a, b) => (b._to?.getTime?.() || 0) - (a._to?.getTime?.() || 0));
  return copy[0] || null;
};

const CurrentPostingBannerInline = ({ rows, loading }) => {
  const current = useMemo(() => pickCurrentPosting(rows), [rows]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/70 bg-white shadow-sm">
      <div className="relative bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white px-4 py-3">
        {loading ? (
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
        ) : null}

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-extrabold tracking-[0.22em] uppercase text-white/90">
              Current Posting
            </div>

            <div className="mt-1 text-[15px] font-black leading-tight truncate">
              {current
                ? `${safeText(current.DISTRICTNAME)} / ${safeText(
                    current.SUBDIVNAME,
                  )}`
                : loading
                  ? "Loading..."
                  : "Not available"}
            </div>

            {current && !loading ? (
              <div className="mt-1 text-[11px] font-bold text-white/90 truncate">
                <span className="text-white/80">Period:</span>{" "}
                <span className="font-black text-white">{current._period}</span>
                <span className="mx-2 text-white/35">•</span>
                <span className="text-white/80">Notification:</span>{" "}
                <span className="font-black text-white">
                  {safeText(current._notifNo) || "—"}
                  {current._notifDate
                    ? ` / ${toDDMMYYYY(current._notifDate)}`
                    : ""}
                </span>
              </div>
            ) : null}
          </div>

          {!loading && current ? (
            <div className="shrink-0 text-right">
              <div className="px-3 py-2 rounded-2xl bg-white/15 border border-white/25 backdrop-blur">
                <div className="text-[9px] font-extrabold tracking-[0.22em] uppercase text-white/85">
                  Duration
                </div>
                <div className="text-[14px] font-black leading-tight">
                  {fmtYMDLong(current._durationDays)}
                </div>
                <div className="text-[10px] font-black text-white/85">
                  {current._durationDays || 0} days
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ========================= WEDLOCK ========================= */

const lowerSafe = (v) => {
  const s = safeText(v);
  if (s === "—") return "";
  return String(s).trim().toLowerCase();
};

const isSameDistrict = (districtA, districtB) => {
  const a = lowerSafe(districtA);
  const b = lowerSafe(districtB);
  if (!a || !b) return false;
  return a === b;
};

const WedlockProfileCard = ({
  profile,
  postingRows,
  postingLoading,
  navigate,
  location,
  officerHeroGradient = "from-emerald-700 via-teal-600 to-sky-600",
}) => {
  const spouseId = safeText(profile?.SPOUSE_OFFICERID);
  const spouseName = safeText(profile?.SPOUSE_OFFICERNAME);
  const spouseDesig = safeText(profile?.SPOUSE_DESIGNATIONDESC);

  const spousePF = safeText(profile?.SPOUSE_PFNO);
  const spouseCR = safeText(profile?.SPOUSE_CRNO);
  const spouseBlood = safeText(profile?.SPOUSE_BLOODG);

  const spouseCNIC = safeText(profile?.SPOUSE_NICNO);
  const spouseCell = safeText(profile?.SPOUSE_MOBILE);
  const spouseDomicile = safeText(profile?.SPOUSE_DOMICILE);
  const spouseDOB = safeDate(profile?.SPOUSE_DOB);

  const spouseDistrict = safeText(profile?.SPOUSE_DISTRICTNAME);
  const spouseTehsil = safeText(profile?.SPOUSE_SUBDIVNAME);

  const currentPosting = useMemo(
    () => pickCurrentPosting(postingRows),
    [postingRows],
  );

  const show =
    spouseId !== "—" &&
    spouseName !== "—" &&
    String(spouseId).trim().length > 0;

  if (!show) return null;

  const same = isSameDistrict(currentPosting?.DISTRICTNAME, spouseDistrict);

  const spouseHero = same
    ? officerHeroGradient
    : "from-violet-600 via-purple-600 to-fuchsia-700";

  return (
    <div className="rounded-2xl overflow-hidden border shadow-sm bg-white/80 backdrop-blur">
      <div className={`relative bg-gradient-to-r ${spouseHero} p-3`}>
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

        {postingLoading ? (
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
        ) : null}

        <div className="relative flex gap-2">
          <div className="h-[60px] w-[60px] rounded-xl bg-white/15 border border-white/25 overflow-hidden flex items-center justify-center text-white font-bold">
            {getInitials(spouseName)}
          </div>

          <div className="text-white flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              Wedlock / Spouse
            </div>

            <div className="text-[16px] font-bold truncate">
              {spouseName}
              <span className="ml-2 text-[11px] font-semibold text-white/80">
                (ID: {spouseId})
              </span>
            </div>

            <div className="text-[12px] font-medium text-white/85 truncate">
              {spouseDesig}
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(location.pathname, { state: { officerId: spouseId } })
              }
              className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-semibold hover:bg-white/90 transition"
            >
              View Full Profile →
            </button>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={badgeCls}>PF: {spousePF}</span>
              <span className={badgeCls}>CR: {spouseCR}</span>
              <span className={badgeCls}>{spouseBlood}</span>
              <span className={badgeCls}>
                Posting: {spouseDistrict} / {spouseTehsil}
              </span>

              <span
                className={[
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                  same
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-white/10 border-white/20 text-white/90",
                ].join(" ")}
              >
                {same ? "Same District" : "Different District"}
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FancyCard icon={IdCard} label="CNIC" value={spouseCNIC} />
          <FancyCard icon={Phone} label="Cell" value={spouseCell} />
          <FancyCard icon={MapPin} label="Domicile" value={spouseDomicile} />
          <FancyCard icon={Calendar} label="DOB" value={spouseDOB} />
        </div>

        <div className="relative mt-2">
          <AddressCard
            label="Spouse Posting"
            address={`${spouseDistrict} / ${spouseTehsil}`}
          />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------------- */

export default function OfficerProfilePage({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const officerId = location.state?.officerId;

  const [profile, setProfile] = useState(null);

  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [qualRows, setQualRows] = useState([]);
  const [qualLoading, setQualLoading] = useState(false);

  const [leaveRows, setLeaveRows] = useState([]);
  const [leaveYearRows, setLeaveYearRows] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveYearLoading, setLeaveYearLoading] = useState(false);

  const [skillRows, setSkillRows] = useState([]);
  const [skillLoading, setSkillLoading] = useState(false);

  const [publicationRows, setPublicationRows] = useState([]);
  const [publicationLoading, setPublicationLoading] = useState(false);

  const [trainingRows, setTrainingRows] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [relationshipRows, setRelationshipRows] = useState([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);

  const [gameRows, setGameRows] = useState([]);
  const [gameLoading, setGameLoading] = useState(false);

  const [achievementRows, setAchievementRows] = useState([]);
  const [achievementLoading, setAchievementLoading] = useState(false);

  const [examAttemptRows, setExamAttemptRows] = useState([]);
  const [examAttemptLoading, setExamAttemptLoading] = useState(false);

  const [examAttemptDetailRows, setExamAttemptDetailRows] = useState([]);
  const [examAttemptDetailLoading, setExamAttemptDetailLoading] =
    useState(false);

  const [examResultRows, setExamResultRows] = useState([]);
  const [examResultLoading, setExamResultLoading] = useState(false);

  const [examRemedyRows, setExamRemedyRows] = useState([]);
  const [examRemedyLoading, setExamRemedyLoading] = useState(false);

  const [acrRows, setAcrRows] = useState([]);
  const [acrLoading, setAcrLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("postingAnalysis");

  /** Which officerId each lazy tab last loaded for (cleared when officerId changes). */
  const tabDataOfficerRef = useRef({});

  useEffect(() => {
    tabDataOfficerRef.current = {};
    setQualRows([]);
    setQualLoading(false);
    setLeaveRows([]);
    setLeaveYearRows([]);
    setLeaveLoading(false);
    setLeaveYearLoading(false);
    setSkillRows([]);
    setSkillLoading(false);
    setPublicationRows([]);
    setPublicationLoading(false);
    setTrainingRows([]);
    setTrainingLoading(false);
    setRelationshipRows([]);
    setRelationshipLoading(false);
    setGameRows([]);
    setGameLoading(false);
    setAchievementRows([]);
    setAchievementLoading(false);
    setExamAttemptRows([]);
    setExamAttemptLoading(false);
    setExamAttemptDetailRows([]);
    setExamAttemptDetailLoading(false);
    setExamResultRows([]);
    setExamResultLoading(false);
    setExamRemedyRows([]);
    setExamRemedyLoading(false);
    setAcrRows([]);
    setAcrLoading(false);
  }, [officerId]);

  /* ---------------- API: profile + posting only on entry (default tabs need both) ---------------- */

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
        console.error("OfficerProfilePage profile load error:", e);
        if (!mounted) return;
        setProfile(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [officerId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setHistoryLoading(true);
        if (!officerId) {
          setHistoryRows([]);
          return;
        }
        const rows = await Api.getOfficerPostingHistory({ officerId });
        if (!mounted) return;
        setHistoryRows(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("OfficerProfilePage posting history load error:", e);
        if (!mounted) return;
        setHistoryRows([]);
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [officerId]);

  /* ---------------- API: lazy per tab (avoids ~15 parallel calls on every open) ---------------- */

  useEffect(() => {
    if (!officerId || activeTab !== "qual") return;
    if (tabDataOfficerRef.current.qual === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setQualLoading(true);
        const rows = await Api.getOfficerQualifications({ officerId });
        if (cancelled) return;
        setQualRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.qual = officerId;
      } catch (e) {
        console.error("OfficerProfilePage qualifications load error:", e);
        if (!cancelled) setQualRows([]);
      } finally {
        if (!cancelled) setQualLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "leaves") return;
    if (tabDataOfficerRef.current.leaves === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLeaveLoading(true);
        setLeaveYearLoading(true);
        const [rows, yrows] = await Promise.all([
          Api.getOfficerLeaves({ officerId }),
          Api.getOfficerLeavesYearly({ officerId }),
        ]);
        if (cancelled) return;
        setLeaveRows(Array.isArray(rows) ? rows : []);
        setLeaveYearRows(Array.isArray(yrows) ? yrows : []);
        tabDataOfficerRef.current.leaves = officerId;
      } catch (e) {
        console.error("OfficerProfilePage leaves load error:", e);
        if (!cancelled) {
          setLeaveRows([]);
          setLeaveYearRows([]);
        }
      } finally {
        if (!cancelled) {
          setLeaveLoading(false);
          setLeaveYearLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "skills") return;
    if (tabDataOfficerRef.current.skills === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setSkillLoading(true);
        const rows = await Api.getOfficerSkills({ officerId });
        if (cancelled) return;
        setSkillRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.skills = officerId;
      } catch (e) {
        console.error("OfficerProfilePage skills load error:", e);
        if (!cancelled) setSkillRows([]);
      } finally {
        if (!cancelled) setSkillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "publications") return;
    if (tabDataOfficerRef.current.publications === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setPublicationLoading(true);
        const rows = await Api.getOfficerPublications({ officerId });
        if (cancelled) return;
        setPublicationRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.publications = officerId;
      } catch (e) {
        console.error("OfficerProfilePage publications load error:", e);
        if (!cancelled) setPublicationRows([]);
      } finally {
        if (!cancelled) setPublicationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "trainings") return;
    if (tabDataOfficerRef.current.trainings === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setTrainingLoading(true);
        const rows = await Api.getOfficerTrainings({ officerId });
        if (cancelled) return;
        setTrainingRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.trainings = officerId;
      } catch (e) {
        console.error("OfficerProfilePage trainings load error:", e);
        if (!cancelled) setTrainingRows([]);
      } finally {
        if (!cancelled) setTrainingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "relationships") return;
    if (tabDataOfficerRef.current.relationships === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setRelationshipLoading(true);
        const rows = await Api.getOfficerRelationships({ officerId });
        if (cancelled) return;
        setRelationshipRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.relationships = officerId;
      } catch (e) {
        console.error("OfficerProfilePage relationships load error:", e);
        if (!cancelled) setRelationshipRows([]);
      } finally {
        if (!cancelled) setRelationshipLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "games") return;
    if (tabDataOfficerRef.current.games === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setGameLoading(true);
        const rows = await Api.getOfficerGames({ officerId });
        if (cancelled) return;
        setGameRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.games = officerId;
      } catch (e) {
        console.error("OfficerProfilePage games load error:", e);
        if (!cancelled) setGameRows([]);
      } finally {
        if (!cancelled) setGameLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "achievements") return;
    if (tabDataOfficerRef.current.achievements === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setAchievementLoading(true);
        const rows = await Api.getOfficerAchievements({ officerId });
        if (cancelled) return;
        setAchievementRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.achievements = officerId;
      } catch (e) {
        console.error("OfficerProfilePage achievements load error:", e);
        if (!cancelled) setAchievementRows([]);
      } finally {
        if (!cancelled) setAchievementLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "exams") return;
    if (tabDataOfficerRef.current.exams === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setExamAttemptLoading(true);
        setExamAttemptDetailLoading(true);
        setExamResultLoading(true);
        setExamRemedyLoading(true);
        const [attempts, details, results, remedy] = await Promise.all([
          Api.getOfficerExamAttempts({ officerId }),
          Api.getOfficerExamAttemptDetails({ officerId }),
          Api.getOfficerExamResults({ officerId }),
          Api.getOfficerExamRemedy({ officerId }),
        ]);
        if (cancelled) return;
        setExamAttemptRows(Array.isArray(attempts) ? attempts : []);
        setExamAttemptDetailRows(Array.isArray(details) ? details : []);
        setExamResultRows(Array.isArray(results) ? results : []);
        setExamRemedyRows(Array.isArray(remedy) ? remedy : []);
        tabDataOfficerRef.current.exams = officerId;
      } catch (e) {
        console.error("OfficerProfilePage exams load error:", e);
        if (!cancelled) {
          setExamAttemptRows([]);
          setExamAttemptDetailRows([]);
          setExamResultRows([]);
          setExamRemedyRows([]);
        }
      } finally {
        if (!cancelled) {
          setExamAttemptLoading(false);
          setExamAttemptDetailLoading(false);
          setExamResultLoading(false);
          setExamRemedyLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  useEffect(() => {
    if (!officerId || activeTab !== "acr") return;
    if (tabDataOfficerRef.current.acr === officerId) return;
    let cancelled = false;
    (async () => {
      try {
        setAcrLoading(true);
        const rows = await Api.getOfficerACR({ officerId });
        if (cancelled) return;
        setAcrRows(Array.isArray(rows) ? rows : []);
        tabDataOfficerRef.current.acr = officerId;
      } catch (e) {
        console.error("OfficerProfilePage ACR load error:", e);
        if (!cancelled) setAcrRows([]);
      } finally {
        if (!cancelled) setAcrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officerId, activeTab]);

  /* ---------------- Derived ---------------- */

  const pictureSrc = useMemo(() => {
    if (!profile) return null;
    const b64 = profile.PHOTO_BASE64 || profile.PHOTOBASE64;
    const mime = profile.PHOTO_MIME;
    if (b64) return `data:${mime || "image/jpeg"};base64,${b64}`;
    return profile.PHOTO_URL || null;
  }, [profile]);

  const palette = useMemo(() => {
    hashString(profile?.OFFICERNAME || "NA");
    return { hero: "from-emerald-700 via-teal-600 to-sky-600" };
  }, [profile]);

  const name = safeText(profile?.OFFICERNAME);
  const desig = safeText(profile?.DESIGNATIONDESC || profile?.DESIGNATION);
  const CNIC = safeText(profile?.CNICNO || profile?.NICNO);
  const CELL = safeText(profile?.CELLNO || profile?.MOBILE);
  const DOMICILE = safeText(profile?.DOMICILE);
  const DOB = safeDate(profile?.DOB);
  const ADDRESS = safeText(
    profile?.ADDRESS || profile?.HOMEADDRESS || profile?.PERMANENTADDRESS,
  );

  return (
    <Layout onLogout={onLogout}>
      <div className="min-h-[calc(100vh-88px)] bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50/40 p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-3">
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border shadow-sm bg-white/80 backdrop-blur">
              <div className={`relative bg-gradient-to-r ${palette.hero} p-3`}>
                <button
                  onClick={() => navigate(-1)}
                  className="absolute top-3 right-3 z-20 px-3 py-1 rounded-lg bg-white/20 border border-white/25 text-white text-[11px] font-semibold hover:bg-white/25 transition"
                >
                  ← Back
                </button>

                <div className="flex gap-2">
                  <div className="h-[60px] w-[60px] rounded-xl bg-white/20 overflow-hidden flex items-center justify-center text-white font-bold">
                    {pictureSrc ? (
                      <img
                        src={pictureSrc}
                        alt="Officer"
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      getInitials(name)
                    )}
                  </div>

                  <div className="text-white flex-1 min-w-0 pr-14">
                    <div className="text-[16px] font-bold truncate">{name}</div>
                    <div className="text-[12px] font-medium text-white/85 truncate">
                      {desig}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className={badgeCls}>
                        PF: {safeText(profile?.PFNO)}
                      </span>
                      <span className={badgeCls}>
                        CR: {safeText(profile?.CRNO)}
                      </span>
                      <span className={badgeCls}>
                        {safeText(profile?.BLOODG)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <FancyCard icon={IdCard} label="CNIC" value={CNIC} />
                  <FancyCard icon={Phone} label="Cell" value={CELL} />
                  <FancyCard icon={MapPin} label="Domicile" value={DOMICILE} />
                  <FancyCard icon={Calendar} label="DOB" value={DOB} />
                </div>

                <div className="mt-2">
                  <AddressCard address={ADDRESS} />
                </div>
              </div>
            </div>

            <CurrentPostingBannerInline
              rows={historyRows}
              loading={historyLoading}
            />

            <WedlockProfileCard
              profile={profile}
              postingRows={historyRows}
              postingLoading={historyLoading}
              navigate={navigate}
              location={location}
              officerHeroGradient={palette.hero}
            />
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white">
                <div className="font-semibold mb-2">Details</div>

                <div className="flex gap-2 flex-wrap">
                  <ToggleBtn
                    active={activeTab === "postingAnalysis"}
                    onClick={() => setActiveTab("postingAnalysis")}
                  >
                    Posting Analysis
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "postingHistory"}
                    onClick={() => setActiveTab("postingHistory")}
                  >
                    Posting History
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "qual"}
                    onClick={() => setActiveTab("qual")}
                  >
                    Qualifications
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "skills"}
                    onClick={() => setActiveTab("skills")}
                  >
                    Skills
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "publications"}
                    onClick={() => setActiveTab("publications")}
                  >
                    Publications
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "trainings"}
                    onClick={() => setActiveTab("trainings")}
                  >
                    Trainings
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "relationships"}
                    onClick={() => setActiveTab("relationships")}
                  >
                    Relationships
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "games"}
                    onClick={() => setActiveTab("games")}
                  >
                    Games & hobbies
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "achievements"}
                    onClick={() => setActiveTab("achievements")}
                  >
                    Achievements
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "complaints"}
                    onClick={() => setActiveTab("complaints")}
                  >
                    Complaints
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "inquiry"}
                    onClick={() => setActiveTab("inquiry")}
                  >
                    Inquiry
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "performance"}
                    onClick={() => setActiveTab("performance")}
                  >
                    Performance
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "exams"}
                    onClick={() => setActiveTab("exams")}
                  >
                    Exams
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "leaves"}
                    onClick={() => setActiveTab("leaves")}
                  >
                    Leaves
                  </ToggleBtn>

                  <ToggleBtn
                    active={activeTab === "acr"}
                    onClick={() => setActiveTab("acr")}
                  >
                    ACR
                  </ToggleBtn>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {activeTab === "postingAnalysis" ? (
                <PostingTransfersTab
                  historyRows={historyRows}
                  historyLoading={historyLoading}
                />
              ) : activeTab === "postingHistory" ? (
                <PostingHistoryTab
                  historyRows={historyRows}
                  historyLoading={historyLoading}
                />
              ) : activeTab === "qual" ? (
                <QualificationsTab
                  qualRows={qualRows}
                  qualLoading={qualLoading}
                />
              ) : activeTab === "skills" ? (
                <SkillsTab skillRows={skillRows} skillLoading={skillLoading} />
              ) : activeTab === "publications" ? (
                <PublicationsTab
                  publicationRows={publicationRows}
                  publicationLoading={publicationLoading}
                />
              ) : activeTab === "trainings" ? (
                <TrainingsTab
                  trainingRows={trainingRows}
                  trainingLoading={trainingLoading}
                />
              ) : activeTab === "relationships" ? (
                <RelationshipsTab
                  relationshipRows={relationshipRows}
                  relationshipLoading={relationshipLoading}
                />
              ) : activeTab === "games" ? (
                <GamesTab gameRows={gameRows} gameLoading={gameLoading} />
              ) : activeTab === "achievements" ? (
                <AchievementsTab
                  achievementRows={achievementRows}
                  achievementLoading={achievementLoading}
                />
              ) : activeTab === "complaints" ? (
                <ComplaintsTab
                  pfNoFromProfile={profile?.PFNO}
                  officerId={officerId}
                />
              ) : activeTab === "inquiry" ? (
                <InquiryTab officerId={officerId} />
              ) : activeTab === "performance" ? (
                <PerformanceTab pfNoFromProfile={profile?.PFNO} />
              ) : activeTab === "exams" ? (
                <ExamsTab
                  examAttemptRows={examAttemptRows}
                  examAttemptLoading={examAttemptLoading}
                  examAttemptDetailRows={examAttemptDetailRows}
                  examAttemptDetailLoading={examAttemptDetailLoading}
                  examResultRows={examResultRows}
                  examResultLoading={examResultLoading}
                  examRemedyRows={examRemedyRows}
                  examRemedyLoading={examRemedyLoading}
                />
              ) : activeTab === "acr" ? (
                <ACRTab acrRows={acrRows} acrLoading={acrLoading} />
              ) : (
                <LeavesTab
                  leaveRows={leaveRows}
                  leaveYearRows={leaveYearRows}
                  leaveLoading={leaveLoading}
                  leaveYearLoading={leaveYearLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
