export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "0 min";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours < 1) {
    return `${Math.max(minutes, 1)} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function formatRelativeOrDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) {
    return "Agora";
  }

  if (diffMinutes < 60) {
    return `Há ${diffMinutes} min`;
  }

  if (diffHours < 24) {
    return `Há ${diffHours}h`;
  }

  if (diffDays < 7) {
    return `Há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
