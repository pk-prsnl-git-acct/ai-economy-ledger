/** Public-only labels. Raw contract values remain available through APIs and downloads. */
export function humanizeEnum(value: string | null | undefined) {
  if (!value) return "Unavailable";
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatFiscalPeriod(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const normalized = value.replace(/^period:/i, "").replace(/^entity:company:[^:]+:/i, "").toUpperCase();
  const quarter = normalized.match(/^Q([1-4])(?:\s|_)?FY?(\d{4})$/);
  if (quarter) return `Q${quarter[1]} FY${quarter[2]}`;
  const fiscalYear = normalized.match(/^FY?(\d{4})$/);
  if (fiscalYear) return `FY${fiscalYear[1]}`;
  return humanizeEnum(normalized);
}

export function formatPublicDate(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Unavailable" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatReleaseStatus(status: string | null | undefined) { return status === "published" ? "Published" : humanizeEnum(status); }
export function formatReleaseLabel({ sequence, status, effectiveAt }: { sequence: number; status: string; effectiveAt: string }) { return `Release ${sequence} · ${formatReleaseStatus(status)} ${formatPublicDate(effectiveAt)}`; }
export function formatMethodologyVersion(value: string | null | undefined) { return value ? `Methodology version ${value.replace(/^methodology@/i, "")}` : "Methodology version unavailable"; }
export function formatSourceClass(value: string | null | undefined) { return humanizeEnum(value); }
export function formatRightsState(value: string | null | undefined) { return humanizeEnum(value); }
export function formatTrustState(value: string | null | undefined) { return value === "source_attributed_unverified" ? "Source-attributed" : humanizeEnum(value); }
