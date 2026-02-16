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

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  // ✅ default sort by designation id
  const [sort, setSort] = useState("desigId_asc");

  // -------------------- helpers --------------------
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

    const dmySlash = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
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
    if (iso)
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    const dmy = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (dmy)
      return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

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

  const formatAge = (dop) => {
    const { years, months, days } = diffYMD(dop);
    return `${years}y ${months}m ${days}d`;
  };

  // ✅ adjust these 2 getters if column names differ
  const getDesigId = (r) =>
    r.DESIGNATIONIDDRIVED ?? r.DESIGNATIONID_DRIVED ?? r.DESIGNATIONID ?? "";
  const getDesigDesc = (r) =>
    r.DESIGNATIONDESC ?? r.DESIGNATION ?? r.DESIGNATIONDESC_DRIVED ?? "";

  // ✅ designation id sort supports decimals: 3, 3.1, 3.2
  const desigIdToParts = (id) => {
    const s = String(id ?? "").trim();
    if (!s) return [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    const parts = s.split(".").map((p) => Number(p));
    return [
      Number.isFinite(parts[0]) ? parts[0] : Number.POSITIVE_INFINITY,
      Number.isFinite(parts[1]) ? parts[1] : Number.POSITIVE_INFINITY,
    ];
  };

  const hashString = (s) => {
    const str = String(s ?? "");
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
    return Math.abs(h >>> 0);
  };

  // ✅ row colors based on designation (stable)
  const ROW_PALETTES = [
    // blue-ish
    [
      "bg-sky-50/70 hover:bg-sky-100/80",
      "bg-indigo-50/60 hover:bg-indigo-100/70",
    ],
    // teal-ish
    [
      "bg-cyan-50/60 hover:bg-cyan-100/70",
      "bg-teal-50/60 hover:bg-teal-100/70",
    ],
    // green-ish
    [
      "bg-emerald-50/60 hover:bg-emerald-100/70",
      "bg-lime-50/60 hover:bg-lime-100/70",
    ],
    // amber-ish
    [
      "bg-amber-50/50 hover:bg-amber-100/60",
      "bg-orange-50/50 hover:bg-orange-100/60",
    ],
    // slate-ish
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

  // -------------------- load data --------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await Api.getOfficerPostingDetail({
          designationId,
          districtName,
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
  }, [designationId, districtName]);

  // -------------------- filter + sort --------------------
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = rows;

    if (query) {
      list = list.filter((r) => {
        const officer = String(r.OFFICERNAME ?? "").toLowerCase();
        const pf = String(r.PFNO ?? "").toLowerCase();
        const cr = String(r.CRNO ?? "").toLowerCase();
        const dist = String(r.DISTRICTNAME ?? "").toLowerCase();
        const subdiv = String(r.SUBDIVNAME ?? "").toLowerCase();
        const fname = String(r.FNAME ?? "").toLowerCase();
        const domicile = String(r.DOMICILE ?? "").toLowerCase();
        const nic = String(r.NICNO ?? "").toLowerCase();
        const blood = String(r.BLOODG ?? "").toLowerCase();
        const mobile = String(r.MOBILE ?? "").toLowerCase();
        const dob = String(formatDDMMYYYY(r.DOB) ?? "").toLowerCase();
        const doj = String(formatDDMMYYYY(r.DOJ) ?? "").toLowerCase();
        const dop = String(formatDDMMYYYY(r.DATEOFPOSTING) ?? "").toLowerCase();

        const desigId = String(getDesigId(r) ?? "").toLowerCase();
        const desigDesc = String(getDesigDesc(r) ?? "").toLowerCase();

        return (
          officer.includes(query) ||
          pf.includes(query) ||
          cr.includes(query) ||
          dist.includes(query) ||
          subdiv.includes(query) ||
          fname.includes(query) ||
          domicile.includes(query) ||
          nic.includes(query) ||
          blood.includes(query) ||
          mobile.includes(query) ||
          dob.includes(query) ||
          doj.includes(query) ||
          dop.includes(query) ||
          desigId.includes(query) ||
          desigDesc.includes(query)
        );
      });
    }

    const byStr = (a, b) =>
      String(a ?? "").localeCompare(String(b ?? ""), "en", {
        sensitivity: "base",
      });

    const sorted = [...list];

    switch (sort) {
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
        sorted.sort((a, b) => byStr(getDesigDesc(a), getDesigDesc(b)));
        break;

      case "desig_za":
        sorted.sort((a, b) => byStr(getDesigDesc(b), getDesigDesc(a)));
        break;

      case "name_az":
        sorted.sort((a, b) => byStr(a.OFFICERNAME, b.OFFICERNAME));
        break;
      case "name_za":
        sorted.sort((a, b) => byStr(b.OFFICERNAME, a.OFFICERNAME));
        break;
      case "pf_az":
        sorted.sort((a, b) => byStr(a.PFNO, b.PFNO));
        break;
      case "pf_za":
        sorted.sort((a, b) => byStr(b.PFNO, a.PFNO));
        break;
      case "district_az":
        sorted.sort((a, b) => byStr(a.DISTRICTNAME, b.DISTRICTNAME));
        break;
      case "district_za":
        sorted.sort((a, b) => byStr(b.DISTRICTNAME, a.DISTRICTNAME));
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
  }, [rows, q, sort]);

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
            <div className="text-xl font-extrabold text-slate-900">
              {pageTitle}
            </div>
          </div>

          <div className="w-[76px]" />
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-4 shadow-sm h-[calc(100%-52px)] flex flex-col min-h-0">
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
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search (name / PFNo / designation / district / mobile ...)"
                className="w-56 md:w-72 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="desigId_asc">Designation ID ↑ (Default)</option>
                <option value="desigId_desc">Designation ID ↓</option>
                <option value="desig_az">Designation A–Z</option>
                <option value="desig_za">Designation Z–A</option>

                <option value="name_az">Name A–Z</option>
                <option value="name_za">Name Z–A</option>
                <option value="pf_az">PFNo A–Z</option>
                <option value="pf_za">PFNo Z–A</option>
                <option value="district_az">District A–Z</option>
                <option value="district_za">District Z–A</option>
                <option value="dop_new">Posting Newest</option>
                <option value="dop_old">Posting Oldest</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1700px] w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="text-left">
                  {/* ✅ KEEP SAME HEADER COLORS */}
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-sky-600 to-indigo-700">
                    Name
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-indigo-700 to-blue-700">
                    Father Name
                  </th>

                  {/* ✅ NEW DESIGNATION COLUMNS (keep same gradient cycle) */}

                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-cyan-700 to-teal-700">
                    Designation
                  </th>

                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-teal-700 to-sky-700">
                    Domicile
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-sky-700 to-indigo-700">
                    DOB
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-indigo-700 to-blue-700">
                    DOJ
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-blue-700 to-cyan-700">
                    NIC No
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-cyan-700 to-teal-700">
                    Blood Group
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-teal-700 to-sky-700">
                    Mobile
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-sky-700 to-indigo-700">
                    Place of Posting(District)
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-indigo-700 to-blue-700">
                    Place of Posting(Tehsil)
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-600">
                    Posting Date
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-orange-600 to-amber-500">
                    Posting Age (Y/M/D)
                  </th>
                  <th className="py-3 px-3 font-extrabold text-white bg-gradient-to-r from-fuchsia-600 to-rose-600">
                    Detail
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-10 text-center text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((r, i) => (
                    <tr
                      key={r.OFFICERID ?? i}
                      className={`${rowClassByDesignation(r, i)} transition`}
                    >
                      <td className={tdOfficer}>{r.OFFICERNAME ?? "—"}</td>
                      <td className={`${tdBase} min-w-[190px]`}>
                        {r.FNAME ?? "—"}
                      </td>

                      {/* ✅ NEW: designation columns */}

                      <td className={`${tdBase} min-w-[230px]`}>
                        {String(getDesigDesc(r) ?? "").trim() || "—"}
                      </td>

                      <td className={`${tdBase} min-w-[130px]`}>
                        {r.DOMICILE ?? "—"}
                      </td>
                      <td className={`${tdBase} min-w-[115px]`}>
                        {formatDDMMYYYY(r.DOB) || "—"}
                      </td>
                      <td className={`${tdBase} min-w-[115px]`}>
                        {formatDDMMYYYY(r.DOJ) || "—"}
                      </td>
                      <td className={`${tdBase} min-w-[170px]`}>
                        {r.NICNO ?? "—"}
                      </td>
                      <td className={`${tdBase} min-w-[120px]`}>
                        {r.BLOODG ?? "—"}
                      </td>
                      <td className={`${tdBase} min-w-[130px]`}>
                        {r.MOBILE ?? "—"}
                      </td>
                      <td className={`${tdBase} min-w-[150px]`}>
                        {r.DISTRICTNAME ?? "—"}
                      </td>
                      <td className={`${tdBase} min-w-[160px]`}>
                        {r.SUBDIVNAME ?? "—"}
                      </td>
                      <td className={`${tdBase} min-w-[130px]`}>
                        {formatDDMMYYYY(r.DATEOFPOSTING) || "—"}
                      </td>
                      <td className={`${tdBase} min-w-[160px]`}>
                        {r.DATEOFPOSTING ? formatAge(r.DATEOFPOSTING) : "—"}
                      </td>
                      <td className={`${tdBase} min-w-[110px]`}>
                        <button
                          onClick={() =>
                            navigate("/dashboard/officer-profile", {
                              state: { officerId: r.OFFICERID },
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white font-extrabold shadow-sm hover:opacity-95 active:scale-[0.98] transition"
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
                      className="py-10 text-center text-slate-500"
                    >
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            Rows are color-coded by Designation (stable). Default sort is
            Designation ID ↑.
          </div>
        </div>
      </div>
    </Layout>
  );
}
