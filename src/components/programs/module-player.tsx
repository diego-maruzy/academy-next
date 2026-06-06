import { Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVimeoEmbedUrl } from "@/lib/vimeo";

type ModulePlayerProps = {
  title: string;
  videoUrl: string | null;
  duration?: string;
  coverUrl?: string | null;
};

export function ModulePlayer({
  title,
  videoUrl,
  duration,
  coverUrl,
}: ModulePlayerProps) {
  const embedUrl = getVimeoEmbedUrl(videoUrl);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl shadow-black/30 md:rounded-2xl">
      <div className="relative aspect-video w-full max-w-full">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full max-w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-cover bg-center",
              !coverUrl &&
                "bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.24),transparent_34%),linear-gradient(135deg,#111827,#020617)]",
            )}
            style={
              coverUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(2,6,23,.35), rgba(2,6,23,.86)), url(${coverUrl})`,
                  }
                : undefined
            }
          >
            <div className="flex max-w-full flex-col items-center gap-3 px-4 text-center sm:gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur sm:h-20 sm:w-20">
                <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-base font-semibold text-white sm:text-lg">
                  {title}
                </p>
                {duration ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="h-4 w-4 shrink-0" />
                    {duration}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-1/3 rounded-full bg-blue-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
