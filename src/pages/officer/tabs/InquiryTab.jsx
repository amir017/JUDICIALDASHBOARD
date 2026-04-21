import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import Api from "../../../API/Api";
import { parseDateSafe } from "../officerUtils/officerFormat.js";
import {
  InquiryFormStyleCard,
  isActiveInquiry,
  pickInquiryComplaintNo,
} from "./inquiryUi.jsx";

function stableRowKey(row, index) {
  const c = pickInquiryComplaintNo(row);
  const oid = row?.O_ID_A_INQUIRY ?? row?.OFFICER_ID ?? "";
  const hid = row?.INV_HEARING_DATE ?? "";
  const iid = row?.INV_OFF_ID ?? "";
  return `inq-${c}-${oid}-${iid}-${hid}-${index}`;
}

export default function InquiryTab({ officerId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const oid = officerId != null ? String(officerId).trim() : "";
    if (!oid) {
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
        const data = await Api.getOfficerInquiryJoined({ officerId: oid });
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              e?.message ||
              "Failed to load inquiry records.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [officerId]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = parseDateSafe(a?.INV_HEARING_DATE)?.getTime?.() ?? 0;
      const tb = parseDateSafe(b?.INV_HEARING_DATE)?.getTime?.() ?? 0;
      return tb - ta;
    });
  }, [rows]);

  const activeRows = useMemo(() => sortedRows.filter((r) => isActiveInquiry(r)), [sortedRows]);
  const closedCount = Math.max(0, sortedRows.length - activeRows.length);

  return (
    <div className="space-y-8 min-w-[320px]">
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_36px_-20px_rgba(6,95,70,0.22)]">
        <div className="flex flex-wrap items-center gap-3 px-1 py-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-700 text-white shadow-md">
            <ClipboardList className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-black uppercase tracking-widest text-emerald-950">
              Inquiries
            </p>
          </div>
          {!loading && officerId ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="rounded-full border border-emerald-300/80 bg-white/90 px-3 py-1.5 text-[11px] font-black text-emerald-950 shadow-sm">
                <span className="tabular-nums">{activeRows.length}</span> active
                {activeRows.length === 1 ? "" : " inquiries"}
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm">
                Closed <span className="tabular-nums">{closedCount}</span>
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm">
                Total <span className="tabular-nums">{rows.length}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/50 px-4 py-3 shadow-sm">
          <p className="text-sm font-bold text-amber-950">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-white py-16 shadow-sm">
          <div className="h-12 w-12 rounded-full border-[3px] border-emerald-200 border-t-emerald-700 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Loading inquiries…</p>
        </div>
      ) : null}

      {!loading && !error && officerId && !rows.length ? (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 py-14 text-center text-sm font-bold text-slate-600">
          No inquiry rows returned for this officer.
        </div>
      ) : null}

      {!officerId && !loading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm font-bold text-slate-500">
          Open a profile with an officer ID to load inquiries.
        </div>
      ) : null}

      {!loading && sortedRows.length > 0 ? (
        <>
          <div className="space-y-10">
            {sortedRows.map((row, i) => (
              <section
                key={stableRowKey(row, i)}
                id={`inquiry-record-${i + 1}`}
                className="scroll-mt-4"
              >
                <InquiryFormStyleCard
                  row={row}
                  index={i}
                  totalCount={sortedRows.length}
                  variant="standalone"
                />
              </section>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
