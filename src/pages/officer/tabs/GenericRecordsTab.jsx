import React from "react";
import { ChevronRight } from "lucide-react";
import { safeText } from "../officerUtils/officerFormat";

const headerGradients = {
  default: "from-emerald-700 via-teal-600 to-sky-600",
  violet: "from-violet-600 via-fuchsia-600 to-indigo-600",
  amber: "from-amber-500 via-orange-500 to-rose-500",
  sky: "from-sky-600 via-cyan-500 to-teal-500",
  slate: "from-slate-700 via-slate-800 to-slate-950",
};

export default function GenericRecordsTab({
  title,
  subtitle,
  rows,
  loading,
  icon: Icon,
  primaryField,
  getPrimary,
  fields = [],
  tone = "default",
}) {
  const list = Array.isArray(rows) ? rows : [];
  const headerCls = headerGradients[tone] || headerGradients.default;

  const cell = (row, key) => safeText(row?.[key]);

  const fieldValue = (row, f) => {
    if (typeof f?.pick === "function") return safeText(f.pick(row));
    return cell(row, f.key);
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/40 overflow-hidden min-w-[280px]">
      <div className={`relative p-4 bg-gradient-to-r ${headerCls} text-white`}>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {Icon ? (
              <span className="mt-0.5 h-10 w-10 rounded-2xl bg-white/20 border border-white/30 grid place-items-center shrink-0 backdrop-blur-sm">
                <Icon size={20} className="text-white" strokeWidth={2.25} />
              </span>
            ) : null}
            <div className="min-w-0">
              <div className="text-[17px] font-black leading-tight truncate">
                {title}
              </div>
              {subtitle ? (
                <div className="text-[11.5px] font-bold text-white/90 mt-0.5">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-black/15 border border-white/25 shrink-0 backdrop-blur-sm">
            {list.length} {list.length === 1 ? "record" : "records"}
          </span>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-b from-slate-50/80 to-white">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
            <p className="mt-3 text-[13px] font-bold text-slate-500">
              Loading…
            </p>
          </div>
        ) : !list.length ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-[13px] font-bold text-slate-500">
              No records found.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((row, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm hover:shadow-md hover:border-emerald-200/60 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-[14px] font-black text-slate-900 break-words">
                    {getPrimary
                      ? safeText(getPrimary(row)) || "—"
                      : cell(row, primaryField) || "—"}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-0.5" />
                </div>
                {fields.length ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                    {fields.map((f) => (
                      <div key={f.key || f.label} className="min-w-0">
                        <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {f.label}
                        </dt>
                        <dd className="mt-0.5 font-semibold text-slate-800 break-words">
                          {fieldValue(row, f) || "—"}
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
