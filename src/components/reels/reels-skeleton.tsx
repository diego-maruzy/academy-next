export function ReelsSkeleton() {
  return (
    <div className="h-[100dvh] w-full animate-pulse bg-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-zinc-900/40 to-black/60" />
      <div className="absolute bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 right-20 space-y-3">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-5 w-48 rounded bg-white/15" />
        <div className="h-4 w-full max-w-xs rounded bg-white/10" />
      </div>
      <div className="absolute bottom-[calc(130px+env(safe-area-inset-bottom))] right-4 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-11 w-11 rounded-full bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}
