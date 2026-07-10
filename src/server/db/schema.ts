import { sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const ledger = pgSchema("ledger");
export const privateSchema = pgSchema("private");

export const companyStatus = ledger.enum("company_status", [
  "active",
  "acquired",
  "inactive",
  "unknown",
]);
export const sourceType = ledger.enum("source_type", [
  "regulatory_filing",
  "company_release",
  "official_dataset",
  "court_record",
  "research_report",
  "news",
  "transcript",
  "website",
  "other",
]);
export const licenseStatus = ledger.enum("license_status", [
  "permitted",
  "attribution_required",
  "restricted",
  "unknown",
]);
export const claimKind = ledger.enum("claim_kind", [
  "fact",
  "estimate",
  "commitment",
  "assumption",
]);
export const reviewState = ledger.enum("review_state", [
  "sample",
  "pending",
  "approved",
  "rejected",
  "needs_more_sources",
  "stale",
  "superseded",
]);
export const confidenceGrade = ledger.enum("confidence_grade", [
  "high",
  "medium",
  "low",
  "unscored",
]);
export const valueType = ledger.enum("value_type", [
  "monetary",
  "percentage",
  "count",
  "ratio",
  "text",
  "boolean",
]);
export const periodType = ledger.enum("period_type", [
  "instant",
  "day",
  "month",
  "quarter",
  "half_year",
  "year",
  "multi_year",
  "run_rate",
  "unspecified",
]);
export const recognitionType = ledger.enum("recognition_type", [
  "announced",
  "committed",
  "received",
  "recognized",
  "run_rate",
  "estimated",
  "face_value",
  "cash_equivalent",
]);
export const cashFlowType = ledger.enum("cash_flow_type", [
  "equity",
  "debt",
  "grant",
  "project_finance",
  "cloud_credit",
  "capex",
  "lease",
  "power_obligation",
  "recognized_revenue",
  "run_rate_revenue",
  "customer_prepayment",
  "vendor_financing",
  "other",
]);
export const methodologyStatus = ledger.enum("methodology_status", [
  "draft",
  "active",
  "retired",
]);
export const publicationState = ledger.enum("publication_state", [
  "draft",
  "published",
  "withdrawn",
]);
export const reviewSubjectType = ledger.enum("review_subject_type", [
  "claim",
  "observation",
  "snapshot",
]);
export const reviewPriority = ledger.enum("review_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);
export const appRole = privateSchema.enum("app_role", ["reviewer", "admin"]);

const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const methodologyVersions = ledger.table("methodology_versions", {
  id: text("id").primaryKey(),
  status: methodologyStatus("status").default("draft").notNull(),
  summary: text("summary").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  ...auditColumns,
});

export const companies = ledger.table(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    legalName: text("legal_name").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    jurisdictionCode: text("jurisdiction_code"),
    websiteUrl: text("website_url"),
    lei: text("lei"),
    status: companyStatus("status").default("active").notNull(),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex("companies_slug_key").on(table.slug),
    index("companies_display_name_idx").on(table.displayName),
    check("companies_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  ],
);

export const companyAliases = ledger.table(
  "company_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    aliasType: text("alias_type").default("name").notNull(),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex("company_aliases_company_alias_key").on(table.companyId, table.alias),
    index("company_aliases_alias_idx").on(table.alias),
  ],
);

export const sourceRegistry = ledger.table(
  "source_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publisher: text("publisher").notNull(),
    sourceType: sourceType("source_type").notNull(),
    canonicalUrl: text("canonical_url"),
    licenseStatus: licenseStatus("license_status").default("unknown").notNull(),
    redistributionAllowed: boolean("redistribution_allowed").default(false).notNull(),
    licenseNotes: text("license_notes"),
    licenseReviewedAt: timestamp("license_reviewed_at", { withTimezone: true }),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [uniqueIndex("source_registry_canonical_url_key").on(table.canonicalUrl)],
);

export const sourceDocuments = ledger.table(
  "source_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceRegistryId: uuid("source_registry_id")
      .notNull()
      .references(() => sourceRegistry.id),
    title: text("title").notNull(),
    documentUrl: text("document_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull(),
    contentSha256: text("content_sha256"),
    storageLocator: text("storage_locator"),
    excerpt: text("excerpt"),
    capturedBy: uuid("captured_by"),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex("source_documents_url_hash_key").on(table.documentUrl, table.contentSha256),
    index("source_documents_registry_idx").on(table.sourceRegistryId),
    check(
      "source_documents_sha256_format",
      sql`${table.contentSha256} is null or ${table.contentSha256} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const claims = ledger.table(
  "claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceDocumentId: uuid("source_document_id").references(() => sourceDocuments.id),
    companyId: uuid("company_id").references(() => companies.id),
    kind: claimKind("kind").notNull(),
    claimText: text("claim_text").notNull(),
    assertedAt: timestamp("asserted_at", { withTimezone: true }),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    confidence: confidenceGrade("confidence").default("unscored").notNull(),
    reviewState: reviewState("review_state").default("pending").notNull(),
    reviewNotes: text("review_notes"),
    createdBy: uuid("created_by"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [
    index("claims_document_idx").on(table.sourceDocumentId),
    index("claims_company_state_idx").on(table.companyId, table.reviewState),
    check(
      "claims_source_required",
      sql`${table.kind} = 'assumption' or ${table.sourceDocumentId} is not null`,
    ),
    check(
      "claims_period_order",
      sql`${table.periodStart} is null or ${table.periodEnd} is null or ${table.periodStart} <= ${table.periodEnd}`,
    ),
  ],
);

export const metricDefinitions = ledger.table("metric_definitions", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  valueType: valueType("value_type").notNull(),
  defaultUnit: text("default_unit"),
  methodologyVersionId: text("methodology_version_id")
    .notNull()
    .references(() => methodologyVersions.id),
  isActive: boolean("is_active").default(true).notNull(),
  ...auditColumns,
});

export const metricObservations = ledger.table(
  "metric_observations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    metricKey: text("metric_key")
      .notNull()
      .references(() => metricDefinitions.key),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id),
    numericValue: numeric("numeric_value", { precision: 30, scale: 8 }),
    textValue: text("text_value"),
    booleanValue: boolean("boolean_value"),
    unit: text("unit"),
    reportedCurrency: text("reported_currency"),
    normalizedValue: numeric("normalized_value", { precision: 30, scale: 8 }),
    normalizedCurrency: text("normalized_currency"),
    periodType: periodType("period_type").default("unspecified").notNull(),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    asOfDate: date("as_of_date"),
    recognitionType: recognitionType("recognition_type").notNull(),
    cashFlowType: cashFlowType("cash_flow_type"),
    confidence: confidenceGrade("confidence").default("unscored").notNull(),
    reviewState: reviewState("review_state").default("pending").notNull(),
    methodologyVersionId: text("methodology_version_id")
      .notNull()
      .references(() => methodologyVersions.id),
    supersedesObservationId: uuid("supersedes_observation_id").references(
      (): AnyPgColumn => metricObservations.id,
    ),
    revisionReason: text("revision_reason"),
    createdBy: uuid("created_by"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [
    index("metric_observations_company_metric_period_idx").on(
      table.companyId,
      table.metricKey,
      table.periodEnd,
    ),
    index("metric_observations_review_state_idx").on(table.reviewState),
    index("metric_observations_claim_idx").on(table.claimId),
    uniqueIndex("metric_observations_supersedes_key")
      .on(table.supersedesObservationId)
      .where(sql`${table.reviewState} = 'approved'`),
    check(
      "metric_observations_one_value",
      sql`num_nonnulls(${table.numericValue}, ${table.textValue}, ${table.booleanValue}) = 1`,
    ),
    check(
      "metric_observations_period_order",
      sql`${table.periodStart} is null or ${table.periodEnd} is null or ${table.periodStart} <= ${table.periodEnd}`,
    ),
    check(
      "metric_observations_revision_reason",
      sql`${table.supersedesObservationId} is null or nullif(btrim(${table.revisionReason}), '') is not null`,
    ),
  ],
);

export const metricRevisions = ledger.table(
  "metric_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    priorObservationId: uuid("prior_observation_id")
      .notNull()
      .references(() => metricObservations.id),
    revisedObservationId: uuid("revised_observation_id")
      .notNull()
      .references(() => metricObservations.id),
    reason: text("reason").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("metric_revisions_revised_key").on(table.revisedObservationId),
    check(
      "metric_revisions_distinct_observations",
      sql`${table.priorObservationId} <> ${table.revisedObservationId}`,
    ),
  ],
);

export const publishedSnapshots = ledger.table(
  "published_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    version: integer("version").notNull(),
    state: publicationState("state").default("draft").notNull(),
    methodologyVersionId: text("methodology_version_id")
      .notNull()
      .references(() => methodologyVersions.id),
    payload: jsonb("payload").notNull(),
    contentSha256: text("content_sha256").notNull(),
    sourceCount: integer("source_count").default(0).notNull(),
    observationCount: integer("observation_count").default(0).notNull(),
    generatedBy: uuid("generated_by"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    isSample: boolean("is_sample").default(false).notNull(),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex("published_snapshots_slug_version_key").on(table.slug, table.version),
    index("published_snapshots_public_idx").on(table.slug, table.state, table.publishedAt),
    check("published_snapshots_positive_version", sql`${table.version} > 0`),
    check(
      "published_snapshots_sha256_format",
      sql`${table.contentSha256} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "published_snapshots_publishable",
      sql`${table.state} <> 'published' or (${table.publishedAt} is not null and not ${table.isSample})`,
    ),
  ],
);

export const reviewQueue = ledger.table(
  "review_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectType: reviewSubjectType("subject_type").notNull(),
    claimId: uuid("claim_id").references(() => claims.id),
    observationId: uuid("observation_id").references(() => metricObservations.id),
    snapshotId: uuid("snapshot_id").references(() => publishedSnapshots.id),
    priority: reviewPriority("priority").default("normal").notNull(),
    state: reviewState("state").default("pending").notNull(),
    assignedTo: uuid("assigned_to"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    notes: text("notes"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...auditColumns,
  },
  (table) => [
    index("review_queue_state_priority_idx").on(table.state, table.priority, table.createdAt),
    check(
      "review_queue_one_subject",
      sql`num_nonnulls(${table.claimId}, ${table.observationId}, ${table.snapshotId}) = 1`,
    ),
    check(
      "review_queue_subject_matches",
      sql`(${table.subjectType} = 'claim' and ${table.claimId} is not null)
        or (${table.subjectType} = 'observation' and ${table.observationId} is not null)
        or (${table.subjectType} = 'snapshot' and ${table.snapshotId} is not null)`,
    ),
  ],
);

export const updateLog = ledger.table(
  "update_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: text("event_type").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: uuid("subject_id"),
    actorId: uuid("actor_id"),
    details: jsonb("details").default({}).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("update_log_subject_idx").on(table.subjectType, table.subjectId, table.occurredAt)],
);

export const appHealthChecks = ledger.table(
  "app_health_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    component: text("component").notNull(),
    status: text("status").notNull(),
    checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
    latencyMs: integer("latency_ms"),
    details: jsonb("details").default({}).notNull(),
  },
  (table) => [
    index("app_health_checks_component_checked_idx").on(table.component, table.checkedAt),
    check("app_health_checks_status", sql`${table.status} in ('ok', 'degraded', 'failed')`),
    check("app_health_checks_latency", sql`${table.latencyMs} is null or ${table.latencyMs} >= 0`),
  ],
);

export const appUserRoles = privateSchema.table(
  "app_user_roles",
  {
    userId: uuid("user_id").notNull(),
    role: appRole("role").notNull(),
    grantedBy: uuid("granted_by"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.role] })],
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type MetricObservation = typeof metricObservations.$inferSelect;
export type NewMetricObservation = typeof metricObservations.$inferInsert;
export type PublishedSnapshot = typeof publishedSnapshots.$inferSelect;
