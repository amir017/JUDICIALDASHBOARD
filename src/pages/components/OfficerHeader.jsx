import React, { useMemo } from "react";
import { Home } from "lucide-react";
import {
  safeText,
  safeDate,
  safeJoin,
  getInitials,
} from "../utils/officerFormat";

export default function OfficerHeader({ profile, officerId, palette }) {
  const pictureSrc = useMemo(() => {
    if (!profile) return null;
    const b64 = profile.PHOTO_BASE64 || profile.PHOTOBASE64;
    const mime = profile.PHOTO_MIME;

    if (b64 && String(b64).trim()) {
      if (mime === "image/tiff") return null;
      const safeMime = mime || "image/jpeg";
      return `data:${safeMime};base64,${String(b64).trim()}`;
    }
    return profile.PHOTO_URL || profile.PHOTOURL || null;
  }, [profile]);

  const name = safeText(profile?.OFFICERNAME) || "Officer";
  const desig = safeText(profile?.DESIGNATIONDESC || profile?.DESIGNATION);

  const CNIC = safeText(profile?.CNICNO || profile?.CNIC || profile?.NICNO);
  const CELL = safeText(profile?.CELLNO || profile?.CELL || profile?.MOBILE);
  const ADDRESS = safeText(
    profile?.ADDRESS ||
      profile?.HOMEADDRESS ||
      profile?.POSTALADDRESS ||
      profile?.PRESENTADDRESS ||
      profile?.PERMANENTADDRESS,
  );

  const POSTING = safeJoin(profile?.DISTRICTNAME, profile?.SUBDIVNAME);

  const Chip = ({ label, value }) => (
    <div className="shrink-0 rounded-xl bg-white/15 border border-white/25 px-3 py-2">
      <div className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/80">
        {label}
      </div>
      <div className="text-[13px] font-black text-white whitespace-nowrap">
        {safeText(value)}
      </div>
    </div>
  );

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm bg-white/80 backdrop-blur">
      {/* HEADER */}
      <div className={`p-4 bg-gradient-to-r ${palette.hero} text-white`}>
        {/* one tight row */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center overflow-hidden shrink-0">
            {pictureSrc ? (
              <img
                src={pictureSrc}
                alt="Officer"
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 5%" }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white font-black">
                {getInitials(name)}
              </div>
            )}
          </div>

          {/* Name + designation (fixed block, no stretching) */}
          <div className="shrink-0 min-w-[180px]">
            <div className="text-lg font-black leading-tight truncate">
              {name}
            </div>
            <div className="text-[13px] font-bold text-white/90 truncate">
              {desig}
            </div>
          </div>

          {/* chips in ONE LINE with scroll (no wrapping, no big gaps) */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Chip label="PF" value={profile?.PFNO} />
              <Chip label="CR" value={profile?.CRNO} />
              <Chip label="Blood" value={profile?.BLOODG} />
              <Chip label="CNIC" value={CNIC} />
              <Chip label="Cell" value={CELL} />
              <Chip label="Posting" value={POSTING} />
              <Chip label="DOB" value={safeDate(profile?.DOB)} />
            </div>
          </div>
        </div>
      </div>

      {/* ADDRESS SECTION */}
      <div className="p-3 bg-white/70 border-t border-slate-200/60">
        <div className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2">
          <div className="flex items-start gap-2">
            <span className="h-9 w-9 rounded-2xl grid place-items-center bg-slate-100 border border-slate-200">
              <Home size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Address
              </div>
              <div className="text-[13px] font-black text-slate-950 break-words">
                {ADDRESS}
              </div>
            </div>
          </div>
        </div>

        {!officerId && (
          <div className="mt-2 text-slate-600 font-bold">
            No officerId received.
          </div>
        )}
      </div>
    </div>
  );
}
