import { Badge } from "@/components/ui/badge";
import {
  getLessonMediaTypeLabel,
  resolveLessonMediaType,
  type LessonMediaType,
} from "@/lib/lesson-media";
import { cn } from "@/lib/utils";

type LessonMediaBadgeProps = {
  mediaType?: LessonMediaType | null;
  vimeoUrl?: string | null;
  imageUrl?: string | null;
  className?: string;
};

export function LessonMediaBadge({
  mediaType,
  vimeoUrl,
  imageUrl,
  className,
}: LessonMediaBadgeProps) {
  const resolved = mediaType
    ?? resolveLessonMediaType({ media_type: mediaType, vimeo_url: vimeoUrl, image_url: imageUrl });

  return (
    <Badge
      className={cn(
        resolved === "image"
          ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
          : "border-blue-400/20 bg-blue-400/10 text-blue-200",
        className,
      )}
    >
      {getLessonMediaTypeLabel(resolved)}
    </Badge>
  );
}
