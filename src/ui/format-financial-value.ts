export type FinancialValueFormatOptions = {
  currency?: string | null;
  maximumFractionDigits?: number;
  compact?: boolean;
};

function parseNumeric(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatFinancialValue(value: string | number | null | undefined, options: FinancialValueFormatOptions = {}) {
  const numeric = parseNumeric(value);
  if (numeric === null) return "Unavailable";
  const { currency = "USD", maximumFractionDigits = 1, compact = true } = options;
  const formatter = new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency ?? undefined,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? maximumFractionDigits : 0,
    minimumFractionDigits: 0,
  });
  return formatter.format(numeric);
}

export function formatExactFinancialValue(value: string | number | null | undefined, currency = "USD") {
  return formatFinancialValue(value, { currency, compact: false });
}
