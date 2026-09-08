import type { ReactNode } from "react";

export function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function ScreenTitle({
  action,
  subtitle,
  title,
}: {
  action?: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export function Alert({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <div
      className={`mb-5 rounded-md border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}
