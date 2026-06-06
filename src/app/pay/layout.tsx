import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Checkmate Property",
  description: "Ative sua conta Checkmate Property",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] px-4 py-10 text-white">
      <div className="mx-auto mb-10 flex max-w-5xl items-center justify-center">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
            Checkmate Academy
          </p>
          <p className="mt-2 text-lg font-medium text-slate-200">
            Checkout seguro
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
