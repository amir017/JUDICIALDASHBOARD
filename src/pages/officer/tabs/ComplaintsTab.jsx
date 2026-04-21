import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  MapPin,
  Calendar,
  Hash,
  Gavel,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import Api from "../../../API/Api";
import { safeText, toDDMMYYYY, parseDateSafe } from "../officerUtils/officerFormat.js";
import { DONUT_PIE_PROPS, DONUT_CELL_STROKE } from "../officerUtils/chartColors.js";
import { normComplaintKey } from "./inquiryUi.jsx";

/** Sharp, saturated slices — no red (blue / teal / green / purple / amber / cyan). */
const COMPLAINT_DONUT_COLORS = [
  "#2962FF",
  "#00C853",
  "#FFAB00",
  "#AA00FF",
  "#00B8D4",
  "#FFD600",
  "#651FFF",
  "#00BFA5",
  "#304FFE",
  "#00E676",
  "#7C4DFF",
  "#18FFFF",
];

/** Column names returned by complaint-records API (Oracle uppercase). */
const C = {
  complaint: "COMPLAINT",
  result: "RESULT",
  date: "DATE_OF_COMPLAINT",
  complaintNo: "COMPLAINT_NO",
  district: "POSTING_DISTRICT_AT_COMPLAINT",
  tehsil: "POSTING_TEHSIL_AT_COMPLAINT",
};

function fmtComplaintDate(val) {
  if (val == null || val === "") return "—";
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${d}-${m}-${y}`;
  }
  return toDDMMYYYY(val);
}

function pickComplaintNo(row) {
  const v =
    row?.[C.complaintNo] ??
    row?.["COMPLAINT#"] ??
    row?.COMPLAINTNO ??
    row?.COMPLAINT_NO;
  return v != null && String(v).trim() !== "" ? String(v).trim() : "";
}

export default function ComplaintsTab({ pfNoFromProfile, officerId }) {
  const [personalNo, setPersonalNo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setPersonalNo(
      pfNoFromProfile != null ? String(pfNoFromProfile).trim() : "",
    );
  }, [pfNoFromProfile]);

  useEffect(() => {
    const pn = personalNo.trim();
    if (!pn) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await Api.getComplaintSchemaComplaints({ personalNo: pn });
        if (!cancelled) {
          const list = Array.isArray(data?.rows) ? data.rows : [];
          setRows(list);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              e?.message ||
              "Failed to load complaint records.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [personalNo]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = parseDateSafe(a?.[C.date])?.getTime?.() ?? 0;
      const db = parseDateSafe(b?.[C.date])?.getTime?.() ?? 0;
      return db - da;
    });
  }, [rows]);

  const resultStats = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const label = safeText(r?.[C.result]) || "(No result)";
      map.set(label, (map.get(label) || 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const pieFromResults = useMemo(
    () => resultStats.map(({ name, count }) => ({ name, value: count })),
    [resultStats],
  );

  const complaintTotal = rows.length;

  const complaintKeySet = useMemo(() => {
    const s = new Set();
    for (const r of rows) {
      const k = normComplaintKey(pickComplaintNo(r));
      if (k) s.add(k);
    }
    return s;
  }, [rows]);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const viewBtnBase =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition-all duration-200";
  const viewBtnInactive =
    "text-slate-600 hover:bg-white/90 hover:text-slate-900 border border-slate-200/80 bg-white/70";
  const viewBtnActive =
    "bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md ring-2 ring-emerald-200/60";

  const [vizMode, setVizMode] = useState("both");

  return (
    <div className="space-y-6 min-w-[320px]">
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/35 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_40px_-24px_rgba(6,95,70,0.18)]">
        <div className="flex flex-wrap items-center gap-3 px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-700 text-white shadow-md">
            <Scale className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Complaints
            </p>
            <p className="text-xs font-bold text-slate-700">
              {personalNo.trim()
                ? ` Personal No. ${personalNo.trim()} for complaint records.`
                : " No personal number — complaint list unavailable."}
            </p>
          </div>
          {!loading && rows.length > 0 ? (
            <span className="rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-black text-emerald-950 shadow-sm">
              <span className="tabular-nums">{complaintTotal}</span> complaint
              {complaintTotal === 1 ? "" : "s"}{" "}
              <span className="font-bold text-emerald-800/80">(by result below)</span>
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50 to-orange-50/50 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(225,29,72,0.25)]">
          <p className="text-sm font-bold text-rose-900">{error}</p>
        </div>
      ) : null}


      {loading ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-white py-16 shadow-sm">
          <div className="h-12 w-12 rounded-full border-[3px] border-emerald-200 border-t-emerald-700 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Loading complaints…</p>
        </div>
      ) : null}


      {!loading && personalNo.trim() && !rows.length && !error ? (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 py-14 text-center text-sm font-bold text-slate-500">
          No complaint records for this officer in the complaint database.
        </div>
      ) : null}

      {/* Inquiry rows intentionally removed from this tab (see dedicated Inquiry tab). */}

      {!loading && rows.length > 0 ? (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/15 to-teal-50/20 p-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Visualization
              </span>
              <button
                type="button"
                className={[viewBtnBase, vizMode === "both" ? viewBtnActive : viewBtnInactive].join(" ")}
                onClick={() => setVizMode("both")}
              >
                Charts + timeline
              </button>
              <button
                type="button"
                className={[viewBtnBase, vizMode === "charts" ? viewBtnActive : viewBtnInactive].join(" ")}
                onClick={() => setVizMode("charts")}
              >
                Charts only
              </button>
              <button
                type="button"
                className={[viewBtnBase, vizMode === "timeline" ? viewBtnActive : viewBtnInactive].join(" ")}
                onClick={() => setVizMode("timeline")}
              >
                Timeline only
              </button>
            </div>
          </div>

          {(vizMode === "both" || vizMode === "charts") && resultStats.length ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-teal-200/50 bg-white p-4 shadow-[0_16px_44px_-22px_rgba(13,148,136,0.2)] ring-1 ring-teal-100/40">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
                  By result
                </h3>
                <div className="relative h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieFromResults}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        {...DONUT_PIE_PROPS}
                        labelLine={false}
                      >
                        {pieFromResults.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              COMPLAINT_DONUT_COLORS[
                                i % COMPLAINT_DONUT_COLORS.length
                              ]
                            }
                            {...DONUT_CELL_STROKE}
                          />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="inside"
                          fill="#ffffff"
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            textShadow:
                              "0 0 3px rgba(0,0,0,.75), 0 1px 2px rgba(0,0,0,.5)",
                          }}
                          formatter={(v) => (Number(v) > 0 ? String(v) : "")}
                        />
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [
                          `${v} complaint(s) for “${n}” (${complaintTotal} total rows)`,
                          "Count",
                        ]}
                        contentStyle={{ borderRadius: 12, fontWeight: 700, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6">
                    <div className="max-w-[min(200px,46%)] text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Total (all results)
                      </p>
                      <p className="text-2xl font-black tabular-nums text-teal-700 sm:text-3xl">
                        {complaintTotal}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-teal-100/80 pt-3">
                  <span className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Count by result
                  </span>
                  {resultStats.map(({ name, count }, i) => {
                    const hue =
                      COMPLAINT_DONUT_COLORS[
                        i % COMPLAINT_DONUT_COLORS.length
                      ];
                    return (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 text-[11px] font-black text-slate-900 shadow-sm"
                        style={{ borderColor: hue }}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: hue }}
                          aria-hidden
                        />
                        <span className="max-w-[200px] truncate" title={name}>
                          {name}
                        </span>
                        <span className="tabular-nums text-slate-800">
                          {count}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-200/50 bg-white p-4 shadow-[0_16px_44px_-22px_rgba(99,102,241,0.18)] ring-1 ring-indigo-100/40">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
                  By result
                </h3>
                <div
                  className="w-full"
                  style={{ height: Math.max(220, resultStats.length * 40 + 80) }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={resultStats}
                      margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11, fontWeight: 700 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 10, fontWeight: 700 }}
                        interval={0}
                      />
                      <Tooltip
                        formatter={(value, _name, props) => {
                          const resultLabel =
                            props?.payload?.name ?? "Result";
                          return [
                            `${value} complaint(s) — ${resultLabel}`,
                            "Count",
                          ];
                        }}
                        contentStyle={{ borderRadius: 12, fontWeight: 700, fontSize: 12 }}
                      />
                      <Bar dataKey="count" name="Complaints" radius={[0, 8, 8, 0]}>
                        {resultStats.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              COMPLAINT_DONUT_COLORS[
                                i % COMPLAINT_DONUT_COLORS.length
                              ]
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="right"
                          fill="#0f172a"
                          style={{ fontSize: 12, fontWeight: 900 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}

          {(vizMode === "both" || vizMode === "timeline") ? (
            <div className="relative">
              <h3 className="mb-4 inline-flex items-center gap-2 px-1 text-sm font-black uppercase tracking-widest text-slate-500">
                <span className="h-0.5 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                Timeline
                <span className="h-0.5 w-6 rounded-full bg-gradient-to-l from-emerald-500 to-teal-500" />
              </h3>
              <div className="pointer-events-none absolute left-[19px] top-12 bottom-6 w-px bg-gradient-to-b from-emerald-300 via-teal-200 to-transparent hidden sm:block" />
              <ul className="space-y-4">
                {sortedRows.map((row, idx) => {
                  const no = pickComplaintNo(row) || `Row ${idx + 1}`;
                  const key = `${no}-${idx}`;
                  const isOpen = expanded[key];
                  const complaintText = safeText(row?.[C.complaint]);
                  const longText = complaintText.length > 220;
                  const displayComplaint =
                    !longText || isOpen ? complaintText : `${complaintText.slice(0, 220)}…`;
                  // Inquiry rows intentionally removed from this tab (see dedicated Inquiry tab).

                  return (
                    <li
                      key={key}
                      className="relative rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm ring-1 ring-white/80 sm:ml-10"
                    >
                      <div className="absolute -left-[31px] top-5 hidden h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow sm:block" />

                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-950 ring-1 ring-emerald-100">
                            <Hash className="h-3 w-3" strokeWidth={2.5} />
                            {no}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-900 ring-1 ring-teal-100">
                            <Calendar className="h-3 w-3" strokeWidth={2.5} />
                            {fmtComplaintDate(row?.[C.date])}
                          </span>
                        </div>
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black text-indigo-950 ring-1 ring-indigo-100">
                          <Gavel className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                          <span className="truncate">{safeText(row?.[C.result]) || "—"}</span>
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
                        <div className="flex items-start gap-2 rounded-xl bg-slate-50/90 px-3 py-2 ring-1 ring-slate-100">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2.25} />
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                              District where complaint was logged
                            </div>
                            <div className="font-bold text-slate-800">
                              {safeText(row?.[C.district]) || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-xl bg-slate-50/90 px-3 py-2 ring-1 ring-slate-100">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" strokeWidth={2.25} />
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                              Tehsil where complaint was logged
                            </div>
                            <div className="font-bold text-slate-800">
                              {safeText(row?.[C.tehsil]) || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {complaintText ? (
                        <div className="mt-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
                          <div className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1">
                            Complaint
                          </div>
                          <p className="text-[13px] font-semibold leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                            {displayComplaint || "—"}
                          </p>
                          {longText ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(key)}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900"
                            >
                              {isOpen ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Show full text
                                </>
                              )}
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
