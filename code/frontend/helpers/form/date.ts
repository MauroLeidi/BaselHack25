export function yearsAgo(n: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

export function formatDDMMYYYY(d: string | null) {
  if (!d) return "";
  const [year, month, day] = d.split("-");
  return `${day}.${month}.${year}`;
}

export function parseLooseDob(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split(".").map(Number);
    return new Date(y, m - 1, d);
  }
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
