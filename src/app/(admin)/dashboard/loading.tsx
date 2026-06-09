export default function DashboardLoading() {
  return (
    <div className="grid min-w-0 gap-6">
      <section className="min-w-0 animate-pulse">
        <div className="h-9 w-48 rounded-lg bg-white/10" />
        <div className="mt-3 h-4 w-64 rounded bg-white/5" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className="h-36 rounded-2xl border border-white/10 bg-white/[0.03]" />
      </section>
      <p className="text-sm text-slate-400">Carregando sua Academy...</p>
    </div>
  );
}
