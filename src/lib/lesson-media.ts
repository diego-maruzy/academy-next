export type LessonMediaType = "video" | "image";

type LessonMediaSource = {
  media_type?: string | null;
  vimeo_url?: string | null;
  image_url?: string | null;
};

export function resolveLessonMediaType(lesson: LessonMediaSource): LessonMediaType {
  if (lesson.media_type === "image" || lesson.media_type === "video") {
    return lesson.media_type;
  }

  const hasVimeo = Boolean(lesson.vimeo_url?.trim());
  const hasImage = Boolean(lesson.image_url?.trim());

  if (hasVimeo) {
    return "video";
  }

  if (hasImage) {
    return "image";
  }

  return "video";
}

export function normalizeLesson<T extends LessonMediaSource>(lesson: T): T & { media_type: LessonMediaType } {
  return {
    ...lesson,
    media_type: resolveLessonMediaType(lesson),
  };
}

export function getLessonMediaTypeLabel(mediaType: LessonMediaType): string {
  return mediaType === "image" ? "Imagem" : "Vídeo";
}
