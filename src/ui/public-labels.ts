const LABELS: Record<string, string> = {
  annual: "Annual",
  annual_slot: "Annual slot",
  available_with_limitations: "Available with limitations",
  capital_expenditure: "Capex",
  company_count: "Company count",
  company_wide_capex_intensity: "Capex intensity",
  company_wide_consolidated: "Company-wide consolidated",
  company_wide_structured_sec_fact: "Company-wide SEC fact",
  directly_comparable: "Comparable annual data",
  entity: "Entity",
  human_verified: "Human verified",
  included: "Included",
  included_with_limitations: "Included with limitations",
  not_applicable: "Not applicable",
  research_and_development: "R&D",
  revenue: "Revenue",
  source_attributed_unverified: "Source attributed, unverified",
  system_validated: "System validated",
  taxonomy_metadata_only: "Taxonomy metadata only",
  "taxonomy-v2@tranche-4": "Taxonomy v2",
  unavailable: "Unavailable",
  withheld: "Withheld",
  ytd_interim: "Year-to-date"
};

function titleCase(value: string) {
  return value
    .replace(/^entity:company:/, "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

export function publicLabel(value: string | null | undefined) {
  if (!value) return "Unavailable";
  if (/^ENTITY:COMPANY:[A-Z0-9]+:FY\d{4}$/.test(value)) return value.split(":").at(-1) ?? value;
  const lower = value.toLowerCase();
  return LABELS[value] ?? LABELS[lower] ?? titleCase(value);
}

export function publicMetricLabel(metricKey: string | null | undefined) {
  return publicLabel(metricKey);
}
