import { readFileSync } from "node:fs";
import { join } from "node:path";

export const importTemplates = [
  {
    name: "companies",
    fileName: "companies.csv",
    required: ["slug", "legal_name", "display_name", "status", "is_sample"],
    headers: [
      "slug",
      "legal_name",
      "display_name",
      "description",
      "jurisdiction_code",
      "website_url",
      "lei",
      "status",
      "is_sample",
    ],
  },
  {
    name: "metric_definitions",
    fileName: "metric_definitions.csv",
    required: ["key", "label", "description", "value_type", "methodology_version_id", "is_active"],
    headers: [
      "key",
      "label",
      "description",
      "value_type",
      "default_unit",
      "methodology_version_id",
      "is_active",
    ],
  },
  {
    name: "source_registry",
    fileName: "source_registry.csv",
    required: ["source_key", "publisher", "source_type", "license_status", "redistribution_allowed", "is_sample"],
    headers: [
      "source_key",
      "publisher",
      "source_type",
      "canonical_url",
      "license_status",
      "redistribution_allowed",
      "license_notes",
      "license_reviewed_at",
      "is_sample",
    ],
  },
  {
    name: "source_documents",
    fileName: "source_documents.csv",
    required: ["document_key", "source_key", "title", "document_url", "accessed_at", "is_sample"],
    headers: [
      "document_key",
      "source_key",
      "title",
      "document_url",
      "published_at",
      "accessed_at",
      "content_sha256",
      "storage_locator",
      "excerpt",
      "is_sample",
    ],
  },
  {
    name: "claims",
    fileName: "claims.csv",
    required: ["claim_key", "company_slug", "kind", "claim_text", "confidence", "review_state", "is_sample"],
    headers: [
      "claim_key",
      "document_key",
      "company_slug",
      "kind",
      "claim_text",
      "asserted_at",
      "period_start",
      "period_end",
      "confidence",
      "review_state",
      "review_notes",
      "is_sample",
    ],
  },
  {
    name: "metric_observations",
    fileName: "metric_observations.csv",
    required: [
      "observation_key",
      "company_slug",
      "metric_key",
      "claim_key",
      "unit",
      "period_type",
      "recognition_type",
      "confidence",
      "review_state",
      "methodology_version_id",
      "is_sample",
    ],
    headers: [
      "observation_key",
      "company_slug",
      "metric_key",
      "claim_key",
      "numeric_value",
      "text_value",
      "boolean_value",
      "unit",
      "reported_currency",
      "normalized_value",
      "normalized_currency",
      "period_type",
      "period_start",
      "period_end",
      "as_of_date",
      "recognition_type",
      "cash_flow_type",
      "confidence",
      "review_state",
      "methodology_version_id",
      "is_sample",
    ],
  },
];

const byName = new Map(importTemplates.map((template) => [template.name, template]));

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function readCsv(path) {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const [headers, ...dataRows] = rows;
  if (!headers?.length) {
    throw new Error(`${path} is empty`);
  }

  return {
    headers,
    rows: dataRows
      .filter((row) => row.some((value) => value.trim() !== ""))
      .map((row, rowIndex) => {
        if (row.length !== headers.length) {
          throw new Error(`${path} row ${rowIndex + 2} has ${row.length} cells; expected ${headers.length}`);
        }
        return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
      }),
  };
}

export function validateTemplateHeaders(rootDir) {
  const errors = [];
  for (const template of importTemplates) {
    const path = join(rootDir, "data", "import-templates", template.fileName);
    const { headers } = readCsv(path);
    const expected = template.headers.join(",");
    const actual = headers.join(",");
    if (actual !== expected) {
      errors.push(`${template.fileName} headers changed. Expected ${expected}; found ${actual}`);
    }
  }
  return errors;
}

export function loadDemoImport(rootDir) {
  return Object.fromEntries(
    importTemplates.map((template) => {
      const path = join(rootDir, "data", "sample", "demo-import", template.fileName);
      return [template.name, readCsv(path).rows];
    }),
  );
}

export function validateImportRows(importSet) {
  const errors = [];

  for (const [name, rows] of Object.entries(importSet)) {
    const template = byName.get(name);
    if (!template) {
      errors.push(`Unknown import table ${name}`);
      continue;
    }

    rows.forEach((row, rowIndex) => {
      for (const header of template.required) {
        if (!row[header]?.trim()) {
          errors.push(`${name} row ${rowIndex + 2} missing required ${header}`);
        }
      }

      for (const [header, value] of Object.entries(row)) {
        if (/^[=+@]/.test(value.trim())) {
          errors.push(`${name} row ${rowIndex + 2} has spreadsheet-formula-like value in ${header}`);
        }
      }

      if ("is_sample" in row) {
        const isSample = parseBoolean(row.is_sample, `${name} row ${rowIndex + 2} is_sample`);
        if (row.review_state) {
          const isSampleState = row.review_state === "sample";
          if (isSample !== isSampleState) {
            errors.push(`${name} row ${rowIndex + 2} must keep is_sample and review_state=sample in lockstep`);
          }
        }
      }
    });
  }

  return errors;
}

export function metricTotalsForVerifiedObservations(observations) {
  const totals = new Map();

  for (const observation of observations) {
    const isSample = parseBoolean(observation.is_sample, `${observation.observation_key} is_sample`);
    if (isSample || observation.review_state !== "approved") {
      continue;
    }

    const rawValue = observation.normalized_value || observation.numeric_value;
    if (!rawValue) {
      continue;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`${observation.observation_key} has a non-numeric metric value`);
    }

    const previous = totals.get(observation.metric_key) ?? 0;
    totals.set(observation.metric_key, previous + numericValue);
  }

  return Object.fromEntries(totals);
}

export function assertDemoImportIsSampleOnly(importSet) {
  const nonSampleRows = [];
  for (const [name, rows] of Object.entries(importSet)) {
    rows.forEach((row, rowIndex) => {
      if ("is_sample" in row && row.is_sample !== "true") {
        nonSampleRows.push(`${name} row ${rowIndex + 2}`);
      }
      if (row.review_state && row.review_state !== "sample") {
        nonSampleRows.push(`${name} row ${rowIndex + 2} review_state=${row.review_state}`);
      }
      if (name === "metric_definitions" && !row.key?.startsWith("sample.")) {
        nonSampleRows.push(`${name} row ${rowIndex + 2} key=${row.key}`);
      }
    });
  }

  if (nonSampleRows.length) {
    throw new Error(`Demo import contains non-sample rows: ${nonSampleRows.join(", ")}`);
  }
}

function parseBoolean(value, context) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`${context} must be true or false`);
}
