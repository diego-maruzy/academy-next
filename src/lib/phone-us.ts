export function extractUsPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function formatUsPhone(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const digits = extractUsPhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return `+1 (${digits}`;
  }

  if (digits.length <= 6) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatUsPhoneDisplay(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return formatUsPhone(value) || value;
}

export function normalizeUsPhoneForStorage(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const digits = extractUsPhoneDigits(value);

  if (!digits) {
    return null;
  }

  if (digits.length < 10) {
    return formatUsPhone(value) || value.trim() || null;
  }

  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
