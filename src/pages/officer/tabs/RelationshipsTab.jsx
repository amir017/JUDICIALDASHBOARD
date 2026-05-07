import React from "react";
import { Users } from "lucide-react";
import { safeText } from "../officerUtils/officerFormat";

const relationName = (row) =>
  safeText(
    row?.NAME ??
      row?.BS_NAME ??
      row?.BROTHER_SISTER_NAME ??
      row?.CHILD_NAME,
  );

const relationLabel = (row) =>
  safeText(
    row?.RELATION ??
      row?.RELATION_TYPE ??
      row?.RELATIONTYPE ??
      row?.RELATION_DESC ??
      (safeText(row?.CHILD_NAME) !== "—" ? "Child" : ""),
  );

export default function RelationshipsTab({
  relationshipRows,
  relationshipLoading,
}) {
  const list = Array.isArray(relationshipRows) ? relationshipRows : [];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-violet-200/30 overflow-hidden min-w-[280px] ring-1 ring-violet-100/60">
      <div className="relative p-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-700 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_80%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-11 w-11 rounded-2xl bg-white/20 border border-white/35 grid place-items-center shrink-0 shadow-inner backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="text-[17px] font-black leading-tight tracking-tight">
                Relationships
              </h2>
              <p className="text-[11px] font-bold text-white/85 mt-0.5">
                Name and relation type
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black bg-black/20 border border-white/25 backdrop-blur-sm tabular-nums">
            {list.length} {list.length === 1 ? "person" : "people"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 bg-gradient-to-b from-violet-50/40 via-slate-50/50 to-white">
        {relationshipLoading ? (
          <div className="py-14 text-center rounded-2xl border border-violet-100/80 bg-white/70">
            <div className="inline-block h-9 w-9 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="mt-4 text-[13px] font-bold text-violet-900/70">
              Loading relationships…
            </p>
          </div>
        ) : !list.length ? (
          <div className="py-14 text-center rounded-2xl border-2 border-dashed border-violet-200/70 bg-white/80">
            <p className="text-[13px] font-bold text-slate-500">
              No relationship records found.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden ring-1 ring-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 via-violet-900 to-indigo-900 text-white">
                    <th className="py-3.5 px-4 text-left text-[11px] font-black uppercase tracking-[0.14em]">
                      Name
                    </th>
                    <th className="py-3.5 px-4 text-left text-[11px] font-black uppercase tracking-[0.14em]">
                      Relationship
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, idx) => {
                    const name = relationName(row);
                    const rel = relationLabel(row);
                    return (
                      <tr
                        key={`${idx}-${name}-${rel}`}
                        className={[
                          "border-b border-slate-100/90 transition-colors duration-150",
                          idx % 2 === 0 ? "bg-white" : "bg-violet-50/35",
                          "hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50/80",
                        ].join(" ")}
                      >
                        <td className="py-3.5 px-4 align-middle">
                          <span className="font-extrabold text-slate-900 tracking-tight">
                            {name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 px-3 py-1 text-[12px] font-bold text-violet-950 border border-violet-200/70 shadow-sm">
                            {rel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
