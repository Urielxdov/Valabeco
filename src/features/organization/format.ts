export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function compactJson(value: unknown, max = 80) {
  if (value === null || value === undefined) {
    return "—";
  }

  const text = JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
