// OfficerProfilePage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, IdCard, Phone, MapPin, Home } from "lucide-react";
import Layout from "./Layout";
import Api from "../API/Api";

import PostingTransfersTab from "../pages/officer/tabs/PostingTransfersTab";
import QualificationsTab from "../pages/officer/tabs/QualificationsTab";
import LeavesTab from "../pages/officer/tabs/LeavesTab";

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

  // ✅ NOT DARK (bright premium gradient)
  const spouseHero = same
    ? "from-sky-400 via-blue-400 to-indigo-400"
    : "from-blue-300 via-indigo-300 to-purple-400";

  const goToSpouse = () => {
    // ✅ route to same page; change officerId via state
    navigate(location.pathname, { state: { officerId: spouseId } });
  };

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

            {/* ✅ NEW BUTTON */}
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
  const [leaveRows, setLeaveRows] = useState([]);
  const [leaveYearRows, setLeaveYearRows] = useState([]);

  const [activeTab, setActiveTab] = useState("posting");

  /* ---------------- API Calls ---------------- */

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!officerId) return;
      const res = await Api.getOfficerProfile({ officerId });
      if (mounted) setProfile(res ?? null);
    })();
    return () => (mounted = false);
  }, [officerId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setHistoryLoading(true);
      if (!officerId) return;
      const rows = await Api.getOfficerPostingHistory({ officerId });
      if (mounted) setHistoryRows(rows || []);
      setHistoryLoading(false);
    })();
    return () => (mounted = false);
  }, [officerId]);

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

  /* ---------------- UI ---------------- */

  return (
    <Layout onLogout={onLogout}>
      <div className="min-h-[calc(100vh-88px)] bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50/40 p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-3">
          {/* LEFT SIDE */}
          <div className="space-y-3">
            {/* PROFILE CARD */}
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

            {/* CURRENT POSTING */}
            <CurrentPostingBannerInline
              rows={historyRows}
              loading={historyLoading}
            />

            {/* SPOUSE CARD + BUTTON */}
            <WedlockProfileCard
              profile={profile}
              postingRows={historyRows}
              postingLoading={historyLoading}
              navigate={navigate}
            />
          </div>

          {/* RIGHT SIDE (tabs) */}
          <div className="space-y-3">
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 text-white flex justify-between">
                <div className="font-semibold">Details</div>
                <div className="flex gap-2">
                  <ToggleBtn
                    active={activeTab === "posting"}
                    onClick={() => setActiveTab("posting")}
                  >
                    Posting
                  </ToggleBtn>
                  <ToggleBtn
                    active={activeTab === "qual"}
                    onClick={() => setActiveTab("qual")}
                  >
                    Qualifications
                  </ToggleBtn>
                  <ToggleBtn
                    active={activeTab === "leaves"}
                    onClick={() => setActiveTab("leaves")}
                  >
                    Leaves
                  </ToggleBtn>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {activeTab === "posting" ? (
                <PostingTransfersTab
                  historyRows={historyRows}
                  historyLoading={historyLoading}
                />
              ) : activeTab === "qual" ? (
                <QualificationsTab qualRows={qualRows} />
              ) : (
                <LeavesTab
                  leaveRows={leaveRows}
                  leaveYearRows={leaveYearRows}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
