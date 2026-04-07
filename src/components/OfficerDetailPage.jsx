import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import Api from "../API/Api";

export default function OfficerDetailPage({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const designationId = location.state?.designationId ?? "ALL";
  const designation = location.state?.designation ?? "ALL";
  const districtName = location.state?.districtName ?? null;
  const cadre = location.state?.cadre ?? "ALL";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");
  const [sort, setSort] = useState("designation_list");

  const [selectedDistrict, setSelectedDistrict] = useState(
    districtName ?? null,
  );
  const [selectedTehsil, setSelectedTehsil] = useState(null);
  const [selectedCadre, setSelectedCadre] = useState(
    cadre === "ALL" ? null : cadre === "IN_FIELD" ? "IN FIELD" : "EX CADRE",
  );

  const [showTehsilTiles, setShowTehsilTiles] = useState(true);
  const [showCadreTiles, setShowCadreTiles] = useState(true);

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

  const formatDDMMYYYY = (val) => {
    if (!val) return "";
    const s = String(val).trim();

    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      const dd = String(val.getDate()).padStart(2, "0");
      const mm = String(val.getMonth() + 1).padStart(2, "0");
      const yyyy = String(val.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    }

    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;

    const dmySlash = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
    if (dmySlash) return `${dmySlash[1]}-${dmySlash[2]}-${dmySlash[3]}`;

    const mon = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})/);
    if (mon) {
      const m = mon[2].toUpperCase();
      const map = {
        JAN: "01",
        FEB: "02",
        MAR: "03",
        APR: "04",
        MAY: "05",
        JUN: "06",
        JUL: "07",
        AUG: "08",
        SEP: "09",
        OCT: "10",
        NOV: "11",
        DEC: "12",
      };
      return `${mon[1]}-${map[m] ?? "01"}-${mon[3]}`;
    }

    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    }

    return s;
  };

  const parseToDate = (val) => {
    if (!val) return null;
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      return new Date(val.getFullYear(), val.getMonth(), val.getDate());
    }

    const s = String(val).trim();

    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }

    const dmy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
    if (dmy) {
      return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    }

    const mon = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})/);
    if (mon) {
      const m = mon[2].toUpperCase();
      const map = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11,
      };
      return new Date(Number(mon[3]), map[m] ?? 0, Number(mon[1]));
    }

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const toSortableTime = (val) => {
    const d = parseToDate(val);
    return d ? d.getTime() : 0;
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const addYearsClamped = (date, years) => {
    const y = date.getFullYear() + years;
    const m = date.getMonth();
    const d = Math.min(date.getDate(), daysInMonth(y, m));
    return new Date(y, m, d);
  };

  const addMonthsClamped = (date, months) => {
    const y0 = date.getFullYear();
    const m0 = date.getMonth();
    const total = m0 + months;
    const y = y0 + Math.floor(total / 12);
    const m = ((total % 12) + 12) % 12;
    const d = Math.min(date.getDate(), daysInMonth(y, m));
    return new Date(y, m, d);
  };

  const diffYMD = (fromVal, toVal = new Date()) => {
    const from = parseToDate(fromVal);
    if (!from) return { years: 0, months: 0, days: 0 };
    const to = new Date(toVal.getFullYear(), toVal.getMonth(), toVal.getDate());

    if (from.getTime() > to.getTime()) return { years: 0, months: 0, days: 0 };

    let years = to.getFullYear() - from.getFullYear();
    let anchor = addYearsClamped(from, years);
    if (anchor.getTime() > to.getTime()) {
      years -= 1;
      anchor = addYearsClamped(from, years);
    }

    let months =
      (to.getFullYear() - anchor.getFullYear()) * 12 +
      (to.getMonth() - anchor.getMonth());
    let anchor2 = addMonthsClamped(anchor, months);
    if (anchor2.getTime() > to.getTime()) {
      months -= 1;
      anchor2 = addMonthsClamped(anchor, months);
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(
      0,
      Math.round((to.getTime() - anchor2.getTime()) / msPerDay),
    );
    return { years, months, days };
  };

  const formatPostingTenure = (dop) => {
    const { years, months, days } = diffYMD(dop);
    return `${years}y ${months}m ${days}d`;
  };

  const getDesigId = (r) =>
    r.DESIGNATIONIDDRIVED ?? r.DESIGNATIONID_DRIVED ?? r.DESIGNATIONID ?? "";

  const getDesigDesc = (r) =>
    r.DESIGNATIONDESC ?? r.DESIGNATION ?? r.DESIGNATIONDESC_DRIVED ?? "";

  const getCadreValue = (r) =>
    r.ex_cader_Court ?? r.EX_CADER_COURT ?? r.ex_cader_court ?? "";

  const getCadreLabel = (r) => {
    const v = String(getCadreValue(r) || "")
      .trim()
      .toUpperCase();
    if (v === "OTHER COURTS") return "IN FIELD";
    return v || "EX CADRE";
  };

  const getDistrictId = (r) =>
    r.DISTRICTID ??
    r.DIST_ID ??
    r.DISTRICT_ID ??
    r.DISTRICTCODE ??
    r.DIST_CODE ??
    "";

  const getTehsilId = (r) =>
    r.TEHSILID ??
    r.SUBDIVID ??
    r.SUBDIV_ID ??
    r.TEHSIL_ID ??
    r.SUBDIVCODE ??
    r.TEHSILCODE ??
    "";

  const getListNo = (r) =>
    r.LIST_NO ?? r.LISTNO ?? r.LISTNUMBER ?? r.SENIORITY_NO ?? "";

  const normalizeText = (v) => String(v ?? "").trim();

  const toNumberSafe = (v) => {
    const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  const byAlpha = (a, b) =>
    String(a ?? "").localeCompare(String(b ?? ""), "en", {
      sensitivity: "base",
    });

  const desigIdToParts = (id) => {
    const s = String(id ?? "").trim();
    if (!s) return [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    const parts = s.split(".").map((p) => Number(p));
    return [
      Number.isFinite(parts[0]) ? parts[0] : Number.POSITIVE_INFINITY,
      Number.isFinite(parts[1]) ? parts[1] : Number.POSITIVE_INFINITY,
    ];
  };

  const normalizeDesignationText = (v) =>
    String(v ?? "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .trim();

  const isDSJDesignation = (r) => {
    const d = normalizeDesignationText(getDesigDesc(r));
    const id = String(getDesigId(r) ?? "")
      .trim()
      .toUpperCase();

    return (
      d === "D&SJ" ||
      d === "DSJ" ||
      d === "DISTRICT&SESSIONSJUDGE" ||
      d === "DISTRICTANDSESSIONSJUDGE" ||
      id === "1.1"
    );
  };

  const hashString = (s) => {
    const str = String(s ?? "");
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
    return Math.abs(h >>> 0);
  };

  const tileColorByName = (name) => {
    const idx = hashString(name) % DIVISION_COLORS_9.length;
    return DIVISION_COLORS_9[idx];
  };

  const dsjTehsilByDistrict = useMemo(() => {
    const map = new Map();

    rows.forEach((r) => {
      const district = normalizeText(r.DISTRICTNAME);
      const tehsil = normalizeText(r.SUBDIVNAME);

      if (!district || !tehsil) return;
      if (!isDSJDesignation(r)) return;

      if (!map.has(district)) {
        map.set(district, tehsil);
      }
    });

    return map;
  }, [rows]);

  const compareDistrictTehsilList = (a, b) => {
    const distDiff =
      toNumberSafe(getDistrictId(a)) - toNumberSafe(getDistrictId(b));
    if (distDiff !== 0) return distDiff;

    const districtA = normalizeText(a.DISTRICTNAME);
    const districtB = normalizeText(b.DISTRICTNAME);

    const aTehsil = normalizeText(a.SUBDIVNAME);
    const bTehsil = normalizeText(b.SUBDIVNAME);

    const dsjTehsilA = normalizeText(dsjTehsilByDistrict.get(districtA));
    const dsjTehsilB = normalizeText(dsjTehsilByDistrict.get(districtB));

    const aTehsilPriority = aTehsil === dsjTehsilA ? 0 : 1;
    const bTehsilPriority = bTehsil === dsjTehsilB ? 0 : 1;

    if (aTehsilPriority !== bTehsilPriority) {
      return aTehsilPriority - bTehsilPriority;
    }

    const tehsilDiff =
      toNumberSafe(getTehsilId(a)) - toNumberSafe(getTehsilId(b));
    if (tehsilDiff !== 0) return tehsilDiff;

    const tehsilNameDiff = byAlpha(aTehsil, bTehsil);
    if (tehsilNameDiff !== 0) return tehsilNameDiff;

    const [a1, a2] = desigIdToParts(getDesigId(a));
    const [b1, b2] = desigIdToParts(getDesigId(b));

    if (a1 !== b1) return a1 - b1;
    if (a2 !== b2) return a2 - b2;

    const listDiff = toNumberSafe(getListNo(a)) - toNumberSafe(getListNo(b));
    if (listDiff !== 0) return listDiff;

    return byAlpha(a.OFFICERNAME, b.OFFICERNAME);
  };

  const compareDesignationList = (a, b) => {
    const [a1, a2] = desigIdToParts(getDesigId(a));
    const [b1, b2] = desigIdToParts(getDesigId(b));

    if (a1 !== b1) return a1 - b1;
    if (a2 !== b2) return a2 - b2;

    const listDiff = toNumberSafe(getListNo(a)) - toNumberSafe(getListNo(b));
    if (listDiff !== 0) return listDiff;

    return byAlpha(a.OFFICERNAME, b.OFFICERNAME);
  };

  const ROW_PALETTES = [
    [
      "bg-sky-50/70 hover:bg-sky-100/80",
      "bg-indigo-50/60 hover:bg-indigo-100/70",
    ],
    [
      "bg-cyan-50/60 hover:bg-cyan-100/70",
      "bg-teal-50/60 hover:bg-teal-100/70",
    ],
    [
      "bg-emerald-50/60 hover:bg-emerald-100/70",
      "bg-lime-50/60 hover:bg-lime-100/70",
    ],
    [
      "bg-amber-50/50 hover:bg-amber-100/60",
      "bg-orange-50/50 hover:bg-orange-100/60",
    ],
    [
      "bg-slate-50/70 hover:bg-slate-100/80",
      "bg-zinc-50/70 hover:bg-zinc-100/80",
    ],
  ];

  const rowClassByDesignation = (r, i) => {
    const key = String(getDesigId(r) ?? getDesigDesc(r) ?? "NA");
    const p = ROW_PALETTES[hashString(key) % ROW_PALETTES.length];
    return p[i % 2];
  };

  const goToProfile = (officerId) => {
    navigate("/dashboard/officer-profile", {
      state: { officerId },
    });
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await Api.getOfficerPostingDetail({
          designationId,
          designation,
          districtName,
          cadre,
        });
        if (!mounted) return;
        setRows(data || []);
      } catch (e) {
        console.error("OfficerDetailPage load error:", e);
        if (!mounted) return;
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [designationId, designation, districtName, cadre]);

  useEffect(() => {
    if (selectedDistrict) {
      setSort("district_tehsil_list");
    } else {
      setSort("designation_list");
    }
  }, [selectedDistrict]);

  const districtTehsilTiles = useMemo(() => {
    if (!selectedDistrict) return [];

    const map = new Map();
    const selectedDistrictKey = normalizeText(selectedDistrict);
    const preferredTehsil = dsjTehsilByDistrict.get(selectedDistrictKey);

    rows.forEach((r) => {
      const district = normalizeText(r.DISTRICTNAME);
      const tehsil = normalizeText(r.SUBDIVNAME) || "Unknown";
      const tehsilId = getTehsilId(r);

      if (district !== selectedDistrictKey) return;

      if (!map.has(tehsil)) {
        map.set(tehsil, { name: tehsil, count: 0, tehsilId });
      }

      map.get(tehsil).count += 1;
    });

    return [...map.values()].sort((a, b) => {
      const aIsPreferred =
        normalizeText(a.name) === normalizeText(preferredTehsil);
      const bIsPreferred =
        normalizeText(b.name) === normalizeText(preferredTehsil);

      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;

      const idDiff = toNumberSafe(a.tehsilId) - toNumberSafe(b.tehsilId);
      if (idDiff !== 0) return idDiff;

      return byAlpha(a.name, b.name);
    });
  }, [rows, selectedDistrict, dsjTehsilByDistrict]);

  const cadreTiles = useMemo(() => {
    const map = new Map();

    rows.forEach((r) => {
      const districtOk = selectedDistrict
        ? normalizeText(r.DISTRICTNAME) === normalizeText(selectedDistrict)
        : true;

      const tehsilOk = selectedTehsil
        ? normalizeText(r.SUBDIVNAME) === normalizeText(selectedTehsil)
        : true;

      if (!districtOk || !tehsilOk) return;

      const c = getCadreLabel(r);

      if (!map.has(c)) {
        map.set(c, { name: c, count: 0 });
      }

      map.get(c).count += 1;
    });

    const preferredOrder = {
      "IN FIELD": 0,
      "EX CADRE": 1,
    };

    return [...map.values()].sort((a, b) => {
      const ao = preferredOrder[a.name] ?? 99;
      const bo = preferredOrder[b.name] ?? 99;
      if (ao !== bo) return ao - bo;
      return byAlpha(a.name, b.name);
    });
  }, [rows, selectedDistrict, selectedTehsil]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = rows;

    if (query) {
      const getColumnText = (r, col) => {
        switch (col) {
          case "name":
            return String(r.OFFICERNAME ?? "");
          case "fatherName":
            return String(r.FNAME ?? "");
          case "pf":
            return String(r.PFNO ?? "");
          case "cr":
            return String(r.CRNO ?? "");
          case "designation":
            return String(getDesigDesc(r) ?? "");
          case "designationId":
            return String(getDesigId(r) ?? "");
          case "district":
            return String(r.DISTRICTNAME ?? "");
          case "tehsil":
            return String(r.SUBDIVNAME ?? "");
          case "cadre":
            return String(getCadreLabel(r) ?? "");
          case "domicile":
            return String(r.DOMICILE ?? "");
          case "cnic":
            return String(r.NICNO ?? "");
          case "mobile":
            return String(r.MOBILE ?? "");
          case "dob":
            return String(formatDDMMYYYY(r.DOB) ?? "");
          case "doj":
            return String(formatDDMMYYYY(r.DOJ) ?? "");
          case "dop":
            return String(formatDDMMYYYY(r.DATEOFPOSTING) ?? "");
          case "listNo":
            return String(getListNo(r) ?? "");
          case "blood":
            return String(r.BLOODG ?? "");
          case "all":
          default:
            return "";
        }
      };

      list = list.filter((r) => {
        if (searchColumn && searchColumn !== "all") {
          return getColumnText(r, searchColumn).toLowerCase().includes(query);
        }

        const hay = [
          r.OFFICERNAME,
          r.PFNO,
          r.CRNO,
          r.DISTRICTNAME,
          r.SUBDIVNAME,
          r.FNAME,
          r.DOMICILE,
          r.NICNO,
          r.BLOODG,
          r.MOBILE,
          formatDDMMYYYY(r.DOB),
          formatDDMMYYYY(r.DOJ),
          formatDDMMYYYY(r.DATEOFPOSTING),
          getDesigId(r),
          getDesigDesc(r),
          getCadreLabel(r),
          getCadreValue(r),
          getListNo(r),
        ]
          .map((v) => String(v ?? "").toLowerCase())
          .filter(Boolean);

        return hay.some((t) => t.includes(query));
      });
    }

    if (selectedDistrict) {
      list = list.filter(
        (r) =>
          normalizeText(r.DISTRICTNAME) === normalizeText(selectedDistrict),
      );
    }

    if (selectedTehsil) {
      list = list.filter(
        (r) => normalizeText(r.SUBDIVNAME) === normalizeText(selectedTehsil),
      );
    }

    if (selectedCadre) {
      list = list.filter((r) => getCadreLabel(r) === selectedCadre);
    }

    const sorted = [...list];

    switch (sort) {
      case "district_tehsil_list":
        sorted.sort(compareDistrictTehsilList);
        break;

      case "designation_list":
        sorted.sort(compareDesignationList);
        break;

      case "desigId_asc":
        sorted.sort((a, b) => {
          const [a1, a2] = desigIdToParts(getDesigId(a));
          const [b1, b2] = desigIdToParts(getDesigId(b));
          if (a1 !== b1) return a1 - b1;
          return a2 - b2;
        });
        break;

      case "desigId_desc":
        sorted.sort((a, b) => {
          const [a1, a2] = desigIdToParts(getDesigId(a));
          const [b1, b2] = desigIdToParts(getDesigId(b));
          if (a1 !== b1) return b1 - a1;
          return b2 - a2;
        });
        break;

      case "desig_az":
        sorted.sort((a, b) => byAlpha(getDesigDesc(a), getDesigDesc(b)));
        break;

      case "desig_za":
        sorted.sort((a, b) => byAlpha(getDesigDesc(b), getDesigDesc(a)));
        break;

      case "cadre_az":
        sorted.sort((a, b) => byAlpha(getCadreLabel(a), getCadreLabel(b)));
        break;

      case "cadre_za":
        sorted.sort((a, b) => byAlpha(getCadreLabel(b), getCadreLabel(a)));
        break;

      case "name_az":
        sorted.sort((a, b) => byAlpha(a.OFFICERNAME, b.OFFICERNAME));
        break;

      case "name_za":
        sorted.sort((a, b) => byAlpha(b.OFFICERNAME, a.OFFICERNAME));
        break;

      case "pf_az":
        sorted.sort((a, b) => byAlpha(a.PFNO, b.PFNO));
        break;

      case "pf_za":
        sorted.sort((a, b) => byAlpha(b.PFNO, a.PFNO));
        break;

      case "district_az":
        sorted.sort((a, b) => byAlpha(a.DISTRICTNAME, b.DISTRICTNAME));
        break;

      case "district_za":
        sorted.sort((a, b) => byAlpha(b.DISTRICTNAME, a.DISTRICTNAME));
        break;

      case "dop_old":
        sorted.sort(
          (a, b) =>
            toSortableTime(a.DATEOFPOSTING) - toSortableTime(b.DATEOFPOSTING),
        );
        break;

      case "dop_new":
        sorted.sort(
          (a, b) =>
            toSortableTime(b.DATEOFPOSTING) - toSortableTime(a.DATEOFPOSTING),
        );
        break;

      default:
        break;
    }

    return sorted;
  }, [
    rows,
    q,
    searchColumn,
    sort,
    selectedDistrict,
    selectedTehsil,
    selectedCadre,
    dsjTehsilByDistrict,
  ]);

  const totalDistrictCount = districtTehsilTiles.reduce(
    (sum, t) => sum + t.count,
    0,
  );

  const totalCadreCount = cadreTiles.reduce((sum, t) => sum + t.count, 0);

  const preferredTehsilForSelectedDistrict = selectedDistrict
    ? dsjTehsilByDistrict.get(normalizeText(selectedDistrict))
    : null;

  const tdBase =
    "py-2 px-3 align-top text-slate-800 font-semibold border-b border-slate-200/60 whitespace-nowrap";
  const tdOfficer = `${tdBase} font-extrabold text-slate-900`;

  const pageTitle = districtName ? `District: ${districtName}` : designation;

  return (
    <Layout onLogout={onLogout}>
      <div className="relative bg-slate-50 px-4 py-3 h-[calc(100vh-88px)] overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative z-10 mb-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-slate-800 font-bold shadow-sm hover:bg-white"
          >
            Back
          </button>

          <div className="flex-1 text-center">
            <div className="text-[11px] text-slate-500 font-bold tracking-wider">
              Officer Details
            </div>
            <div className="text-lg md:text-xl font-extrabold text-slate-900">
              {pageTitle}
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">
              Cadre:{" "}
              {selectedCadre ??
                (cadre === "ALL"
                  ? "ALL"
                  : cadre === "IN_FIELD"
                    ? "IN FIELD"
                    : "EX CADRE")}
            </div>
          </div>

          <div className="w-[76px]" />
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 shadow-sm h-[calc(100%-52px)] flex flex-col min-h-0">
          <div className="mb-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="text-xs font-bold tracking-wide text-sky-700 uppercase">
                  Cadre Summary
                </div>
                <div className="text-sm md:text-base font-extrabold text-slate-900">
                  {selectedDistrict
                    ? selectedTehsil
                      ? `${selectedDistrict} / ${selectedTehsil}`
                      : selectedDistrict
                    : designationId === "ALL"
                      ? "All Officers"
                      : designation}
                </div>
                <div className="text-[11px] text-slate-500">
                  Click a cadre tile to filter table
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setShowCadreTiles((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-sm hover:bg-slate-50"
                >
                  {showCadreTiles ? "Hide Cadre" : "Show Cadre"}
                </button>

                {selectedCadre && (
                  <button
                    onClick={() => setSelectedCadre(null)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-sm hover:bg-slate-50"
                  >
                    Clear Cadre
                  </button>
                )}
              </div>
            </div>

            {showCadreTiles && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                <button
                  onClick={() => setSelectedCadre(null)}
                  className={`group relative overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-sm transition-all duration-200 border min-h-[58px] ${
                    selectedCadre === null
                      ? "ring-2 ring-fuchsia-900/30 scale-[1.01]"
                      : "border-fuchsia-200 hover:scale-[1.01]"
                  } bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 text-white`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="text-[11px] font-bold leading-tight break-words">
                      All
                    </div>
                    <div className="mt-1 text-base font-bold leading-none">
                      {totalCadreCount}
                    </div>
                  </div>
                </button>

                {cadreTiles.map((tile) => (
                  <button
                    key={tile.name}
                    onClick={() =>
                      setSelectedCadre((prev) =>
                        prev === tile.name ? null : tile.name,
                      )
                    }
                    className={`group relative overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-sm transition-all duration-200 border min-h-[58px] ${
                      selectedCadre === tile.name
                        ? "ring-2 ring-slate-900/30 scale-[1.01]"
                        : "border-white/20 hover:scale-[1.01]"
                    } ${tileColorByName(tile.name)}`}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition" />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="text-[11px] font-bold leading-tight break-words">
                        {tile.name}
                      </div>
                      <div className="mt-1 text-base font-bold leading-none">
                        {tile.count}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDistrict && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-xs font-bold tracking-wide text-sky-700 uppercase">
                    Tehsil Summary
                  </div>
                  <div className="text-sm md:text-base font-extrabold text-slate-900">
                    {selectedDistrict}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Click a tehsil tile to filter table
                    {preferredTehsilForSelectedDistrict
                      ? ` • D&SJ tehsil first: ${preferredTehsilForSelectedDistrict}`
                      : ""}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setShowTehsilTiles((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-sm hover:bg-slate-50"
                  >
                    {showTehsilTiles ? "Hide Tehsil" : "Show Tehsil"}
                  </button>

                  {selectedTehsil && (
                    <button
                      onClick={() => setSelectedTehsil(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-sm hover:bg-slate-50"
                    >
                      Clear Tehsil
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedDistrict(null);
                      setSelectedTehsil(null);
                      setSort("designation_list");
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-sm hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {showTehsilTiles && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                  <button
                    onClick={() => {
                      setSelectedTehsil(null);
                      setSort("district_tehsil_list");
                    }}
                    className={`group relative overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-sm transition-all duration-200 border min-h-[58px] ${
                      selectedTehsil === null
                        ? "ring-2 ring-fuchsia-900/30 scale-[1.01]"
                        : "border-fuchsia-200 hover:scale-[1.01]"
                    } bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 text-white`}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition" />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="text-[11px] font-bold leading-tight break-words">
                        All
                      </div>
                      <div className="mt-1 text-base font-bold leading-none">
                        {totalDistrictCount}
                      </div>
                    </div>
                  </button>

                  {districtTehsilTiles.map((tile) => {
                    const active = selectedTehsil === tile.name;
                    const isPreferred =
                      preferredTehsilForSelectedDistrict &&
                      normalizeText(tile.name) ===
                        normalizeText(preferredTehsilForSelectedDistrict);

                    return (
                      <button
                        key={tile.name}
                        onClick={() => {
                          setSelectedTehsil((prev) =>
                            prev === tile.name ? null : tile.name,
                          );
                          setSort("district_tehsil_list");
                        }}
                        className={`group relative overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-sm transition-all duration-200 border min-h-[58px] ${
                          active
                            ? "ring-2 ring-slate-900/30 scale-[1.01]"
                            : "border-white/20 hover:scale-[1.01]"
                        } ${tileColorByName(tile.name)}`}
                      >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition" />
                        <div className="relative z-10 flex h-full flex-col justify-between">
                          <div className="flex items-center justify-between gap-1">
                            <div className="text-[11px] font-bold leading-tight break-words">
                              {tile.name}
                            </div>
                            {isPreferred && (
                              <div className="text-[8px] font-bold opacity-95">
                                D&SJ
                              </div>
                            )}
                          </div>

                          <div className="mt-1 text-base font-bold leading-none">
                            {tile.count}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="leading-tight">
              <div className="font-extrabold text-slate-800">
                {designationId === "ALL" && !districtName
                  ? "All Officers"
                  : "Officers"}
              </div>
              <div className="text-[11px] text-slate-500">
                {loading ? "Loading..." : `${filtered.length} records`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                title="Search column"
              >
                <option value="all">All columns</option>
                <option value="name">Name</option>
                <option value="fatherName">Father Name</option>
                <option value="pf">PFNo</option>
                <option value="cr">CRNo</option>
                <option value="designation">Designation</option>
                <option value="designationId">Designation ID</option>
                <option value="district">District</option>
                <option value="tehsil">Tehsil</option>
                <option value="cadre">Cadre</option>
                <option value="domicile">Domicile</option>
                <option value="cnic">CNIC</option>
                <option value="mobile">Mobile</option>
                <option value="dob">DOB</option>
                <option value="doj">DOJ</option>
                <option value="dop">Date of Posting</option>
                <option value="listNo">List No</option>
                <option value="blood">Blood Group</option>
              </select>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  searchColumn === "all"
                    ? "Search in all columns…"
                    : "Search text…"
                }
                className="w-56 md:w-72 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="designation_list">
                  Designation ID → Seniority
                </option>
                <option value="district_tehsil_list">
                  D&SJ Tehsil First → Tehsil → Designation ID → Seniority
                </option>
                <option value="desigId_asc">Designation ID ↑</option>
                <option value="desigId_desc">Designation ID ↓</option>
                <option value="desig_az">Designation A–Z</option>
                <option value="desig_za">Designation Z–A</option>
                <option value="cadre_az">Cadre A–Z</option>
                <option value="cadre_za">Cadre Z–A</option>
                <option value="name_az">Name A–Z</option>
                <option value="name_za">Name Z–A</option>
                <option value="pf_az">PFNo A–Z</option>
                <option value="pf_za">PFNo Z–A</option>
                <option value="posting district_az">District A–Z</option>
                <option value="posting district_za">District Z–A</option>
                <option value="dop_new">Posting Newest</option>
                <option value="dop_old">Posting Oldest</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="table-fixed w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="text-left">
                  <th className="py-2 px-2 w-[130px] font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-700 !whitespace-normal break-words">
                    Name
                  </th>

                  <th className="py-2 px-2 w-[130px] font-bold text-white bg-gradient-to-r from-indigo-700 to-blue-700 !whitespace-normal break-words">
                    Father Name
                  </th>

                  <th className="py-2 px-2 w-[85px] font-bold text-white bg-gradient-to-r from-cyan-700 to-teal-700 !whitespace-normal break-words">
                    Designation
                  </th>

                  <th className="py-2 px-2 w-[85px] font-bold text-white bg-gradient-to-r from-teal-700 to-sky-700 !whitespace-normal break-words">
                    Cadre
                  </th>

                  <th className="py-2 px-2 w-[90px] font-bold text-white bg-gradient-to-r from-sky-700 to-indigo-700 !whitespace-normal break-words">
                    Domicile
                  </th>

                  <th className="py-2 px-2 w-[85px] font-bold text-white bg-gradient-to-r from-indigo-700 to-blue-700 whitespace-nowrap">
                    DOB
                  </th>

                  <th className="py-2 px-2 w-[85px] font-bold text-white bg-gradient-to-r from-blue-700 to-cyan-700 whitespace-nowrap">
                    DOJ
                  </th>

                  <th className="py-2 px-2 w-[115px] font-bold text-white bg-gradient-to-r from-cyan-700 to-teal-700 whitespace-nowrap">
                    CNIC
                  </th>

                  <th className="py-2 px-2 w-[95px] font-bold text-white bg-gradient-to-r from-sky-700 to-indigo-700 whitespace-nowrap">
                    Mobile
                  </th>

                  <th className="py-2 px-2 w-[90px] font-bold text-white bg-gradient-to-r from-indigo-700 to-blue-700 !whitespace-normal break-words">
                    Posting District
                  </th>

                  <th className="py-2 px-2 w-[90px] font-bold text-white bg-gradient-to-r from-blue-700 to-cyan-700 !whitespace-normal break-words">
                    Posting Tehsil
                  </th>

                  <th className="py-2 px-2 w-[85px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 whitespace-nowrap">
                    Posting Date
                  </th>

                  <th className="py-2 px-2 w-[95px] font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 whitespace-nowrap">
                    Posting Period
                  </th>

                  <th className="py-2 px-2 w-[65px] font-bold text-white bg-gradient-to-r from-fuchsia-600 to-rose-600">
                    Detail
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-8 text-center text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((r, i) => (
                    <tr
                      key={r.OFFICERID ?? i}
                      role="button"
                      tabIndex={0}
                      onClick={() => goToProfile(r.OFFICERID)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goToProfile(r.OFFICERID);
                        }
                      }}
                      className={`${rowClassByDesignation(r, i)} transition cursor-pointer hover:ring-1 hover:ring-sky-300`}
                    >
                      <td
                        className={`${tdOfficer} !whitespace-normal break-words leading-tight`}
                      >
                        {r.OFFICERNAME ?? "—"}
                      </td>

                      <td
                        className={`${tdBase} !whitespace-normal break-words leading-tight`}
                      >
                        {r.FNAME ?? "—"}
                      </td>

                      <td
                        className={`${tdBase} !whitespace-normal break-words`}
                      >
                        {String(getDesigDesc(r) ?? "").trim() || "—"}
                      </td>

                      <td
                        className={`${tdBase} !whitespace-normal break-words leading-tight`}
                      >
                        {getCadreLabel(r)}
                      </td>

                      <td
                        className={`${tdBase} !whitespace-normal break-words`}
                      >
                        {r.DOMICILE ?? "—"}
                      </td>

                      <td className={`${tdBase} whitespace-nowrap`}>
                        {formatDDMMYYYY(r.DOB) || "—"}
                      </td>

                      <td className={`${tdBase} whitespace-nowrap`}>
                        {formatDDMMYYYY(r.DOJ) || "—"}
                      </td>

                      <td className={`${tdBase} whitespace-nowrap`}>
                        {r.NICNO ?? "—"}
                      </td>

                      <td className={`${tdBase} whitespace-nowrap`}>
                        {r.MOBILE ?? "—"}
                      </td>

                      <td
                        className={`${tdBase} !whitespace-normal break-words`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrict(r.DISTRICTNAME ?? null);
                            setSelectedTehsil(null);
                            setShowTehsilTiles(true);
                            setSort("district_tehsil_list");
                          }}
                          className="text-left font-bold text-sky-700 hover:text-sky-900 hover:underline"
                        >
                          {r.DISTRICTNAME ?? "—"}
                        </button>
                      </td>

                      <td
                        className={`${tdBase} !whitespace-normal break-words`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.DISTRICTNAME) {
                              setSelectedDistrict(r.DISTRICTNAME);
                            }
                            setSelectedTehsil(r.SUBDIVNAME ?? null);
                            setShowTehsilTiles(true);
                            setSort("district_tehsil_list");
                          }}
                          className="text-left font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                        >
                          {r.SUBDIVNAME ?? "—"}
                        </button>
                      </td>

                      <td className={`${tdBase} whitespace-nowrap`}>
                        {formatDDMMYYYY(r.DATEOFPOSTING) || "—"}
                      </td>

                      <td className={`${tdBase} whitespace-nowrap`}>
                        {r.DATEOFPOSTING
                          ? formatPostingTenure(r.DATEOFPOSTING)
                          : "—"}
                      </td>

                      <td className={tdBase}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToProfile(r.OFFICERID);
                          }}
                          className="px-2 py-1 rounded-lg bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-[0.98] transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-8 text-center text-slate-500"
                    >
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            Default sorting is Designation ID → Seniority. When a district is
            selected, sorting becomes D&SJ Tehsil First → Tehsil → Designation
            ID → Seniority.
          </div>
        </div>
      </div>
    </Layout>
  );
}
