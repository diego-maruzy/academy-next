export function ClientsPageSkeleton() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded bg-white/10" />
          <div className="h-8 w-40 rounded bg-white/10" />
          <div className="h-4 w-80 max-w-full rounded bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 rounded-xl bg-white/10" />
          <div className="h-10 w-32 rounded-xl bg-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>

      <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.02]" />

      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-white/5 px-4 py-4"
            >
              <div className="h-9 w-9 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-white/10" />
                <div className="h-3 w-56 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-44 rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}
