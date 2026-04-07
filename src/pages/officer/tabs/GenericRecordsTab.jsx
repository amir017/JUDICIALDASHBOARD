import React from "react";
import { safeText } from "../officerUtils/officerFormat";

const headerGradients = {
  default: "from-emerald-700 via-teal-600 to-sky-600",
  violet: "from-violet-600 via-fuchsia-600 to-indigo-600",
};

export default function GenericRecordsTab({
  title,
  subtitle,
  rows,
  loading,
  primaryField,
  fields = [],
  tone = "default",
}) {
  const list = Array.isArray(rows) ? rows : [];
  const headerCls = headerGradients[tone] || headerGradients.default;

  const cell = (row, key) => safeText(row?.[key]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden min-w-[280px]">
      <div className={`p-4 bg-gradient-to-r ${headerCls} text-white`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[16px] font-black truncate">{title}</div>
            {subtitle ? (
              <div className="text-[11px] font-bold text-white/90 mt-0.5">
                {subtitle}
              </div>
            ) : null}
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 border border-white/25 shrink-0">
            {list.length} Records
          </span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            Loading…
          </div>
        ) : !list.length ? (
          <div className="py-10 text-center text-slate-500 font-bold">
            No records found.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((row, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-3 shadow-sm"
              >
                <div className="text-[13px] font-black text-slate-900 mb-2 break-words">
                  {cell(row, primaryField) || "—"}
                </div>
                {fields.length ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                    {fields.map((f) => (
                      <div key={f.key} className="min-w-0">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {f.label}
                        </dt>
                        <dd className="font-semibold text-slate-800 break-words">
                          {cell(row, f.key) || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
