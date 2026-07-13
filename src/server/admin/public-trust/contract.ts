import "server-only";

import contractFixture from "@/data/contracts/public-trust/pr30_1a_public_trust_admin_review_contract.json";

export const PUBLIC_TRUST_CONTRACT_VERSION = "public-trust-admin-review@30.1A.0";
export const PUBLIC_TRUST_POLICY_VERSION = "public-trust-policy@30.1A.0";

export type TrustState =
  | "source_attributed_unverified"
  | "system_validated"
  | "human_verified"
  | "rejected"
  | "superseded";

export type ReviewAction =
  | "approve_human_verified"
  | "reject"
  | "request_more_evidence"
  | "defer"
  | "reopen"
  | "supersede";

export type PublicTrustRecord = {
  stableRecordId: string;
  recordVersion: string;
  entity: { entityId: string; displayName: string };
  metric: { metricId: string; displayLabel: string };
  period: { periodId: string; label: string };
  value: string;
  unit: string;
  source: {
    name: string;
    url: string;
    reference: string;
    documentType: string;
    filingOrPublicationDate: string;
  };
  evidence: {
    documentVersion: string;
    safeEvidenceRef: string;
    coordinates: Record<string, string | number>;
    rawContentAvailable: false;
  };
  extraction: {
    method: string;
    pipelineRunId: string;
    modelAssisted: boolean;
    provider?: string;
    model?: string;
    promptVersion?: string;
  };
  trustState: TrustState;
  reviewRequired: boolean;
  humanVerified: boolean;
  conflictStatus: "none" | "unresolved_conflict";
  amendmentStatus: "original" | "restated_current" | "superseded_by_amendment";
  duplicateGroupStatus: string;
  anomalyStatus: string;
  firstSeenAt: string;
  lastUpdatedAt: string;
  disclosure: { code: string; label: string };
  policyVersion: string;
  contractVersion: string;
  publicationLane: "latest_source_attributed" | "verified";
  publicationEnabled: false;
  current: boolean;
};

export type TrustReviewCase = {
  reviewCaseId: string;
  reviewQueueStatus: "open" | "deferred" | "closed";
  reviewPriority: "normal" | "high" | "urgent";
  queueAge: string;
  firstSeenAt: string;
  deferredUntil: string | null;
  groupedObservationCount: number;
  currentRecord: PublicTrustRecord;
  evidenceSafeBundle: {
    mode: "safe_reference";
    safeEvidenceRef: string;
    coordinates: Record<string, string | number>;
    documentVersion: string;
    rawContentAvailable: false;
  };
  reviewHistory: Array<{ action: string; actor: string; reasonCode: string; decidedAt: string }>;
  safeForBatch: boolean;
};

export type VisibilityPolicy = {
  policyVersion: string;
  contractVersion: string;
  settings: Record<string, boolean>;
  defaults: Record<string, boolean>;
  updatedBy: string;
  updatedAt: string;
  auditHistory: Array<{ actor: string; changedAt: string; reasonCode: string }>;
};

const DEFAULT_VISIBILITY_SETTINGS = Object.freeze({
  show_source_attributed_unverified: true,
  show_system_validated: true,
  show_human_verified: true,
  show_conflicted_records: true,
  exclude_conflicted_from_headlines: true,
  exclude_unverified_from_verified_aggregates: true,
  show_superseded_history: false,
  preview_disclosure_required: true,
});

function assertContractVersion(contractVersion = PUBLIC_TRUST_CONTRACT_VERSION) {
  if (contractVersion !== PUBLIC_TRUST_CONTRACT_VERSION) {
    throw new Error("contract_version_mismatch");
  }
}

function disclosureFor(trustState: TrustState, conflictStatus = "none") {
  if (conflictStatus !== "none") {
    return {
      code: "conflict_disclosure",
      label: "Conflict detected; excluded from headline totals by default.",
    };
  }
  if (trustState === "human_verified") return { code: "human_verified_disclosure", label: "Human verified." };
  if (trustState === "system_validated") {
    return { code: "system_validated_disclosure", label: "System validated; human review may still be pending." };
  }
  if (trustState === "superseded") {
    return { code: "superseded_history_disclosure", label: "Superseded historical value; not current." };
  }
  return {
    code: "source_attributed_unverified_disclosure",
    label: "Source-attributed value that has not yet been human verified.",
  };
}

function record(input: Omit<PublicTrustRecord, "policyVersion" | "contractVersion" | "publicationLane" | "publicationEnabled" | "current" | "disclosure"> & { current?: boolean; publicationLane?: "latest_source_attributed" | "verified" }): PublicTrustRecord {
  return {
    ...input,
    evidence: { ...input.evidence, rawContentAvailable: false },
    disclosure: disclosureFor(input.trustState, input.conflictStatus),
    policyVersion: PUBLIC_TRUST_POLICY_VERSION,
    contractVersion: PUBLIC_TRUST_CONTRACT_VERSION,
    publicationLane: input.publicationLane ?? "latest_source_attributed",
    publicationEnabled: false,
    current: input.current ?? !["rejected", "superseded"].includes(input.trustState),
  };
}

const records = [
  record({
    stableRecordId: "public-record:nvidia:ai-capex:fy2025",
    recordVersion: "record-version:nvidia:ai-capex:fy2025:v1",
    entity: { entityId: "entity:nvidia", displayName: "NVIDIA Corporation" },
    metric: { metricId: "metric:ai-capex", displayLabel: "AI capital expenditure" },
    period: { periodId: "period:fy2025", label: "FY 2025" },
    value: "1250000.00",
    unit: "USD",
    source: {
      name: "SEC EDGAR",
      url: "https://www.sec.gov/Archives/fixture/nvidia-10k-index.html",
      reference: "sec:fixture:nvidia:10-k:2025",
      documentType: "10-K",
      filingOrPublicationDate: "2025-02-26",
    },
    evidence: {
      documentVersion: "evidence-version:nvidia:10-k:2025:v1",
      safeEvidenceRef: "safe-ref:nvidia:capex:fy2025",
      coordinates: { section: "MD&A", table: "Capital expenditures", row: 1, column: "amount" },
      rawContentAvailable: false,
    },
    extraction: { method: "deterministic_xbrl", pipelineRunId: "pipeline-run:pr30-1b:fixture", modelAssisted: false },
    trustState: "source_attributed_unverified",
    reviewRequired: true,
    humanVerified: false,
    conflictStatus: "none",
    amendmentStatus: "original",
    duplicateGroupStatus: "unique",
    anomalyStatus: "none",
    firstSeenAt: "2026-07-13T00:00:00.000Z",
    lastUpdatedAt: "2026-07-13T00:00:00.000Z",
  }),
  record({
    stableRecordId: "public-record:microsoft:ai-capex:fy2025",
    recordVersion: "record-version:microsoft:ai-capex:fy2025:v2",
    entity: { entityId: "entity:microsoft", displayName: "Microsoft Corporation" },
    metric: { metricId: "metric:ai-capex", displayLabel: "AI capital expenditure" },
    period: { periodId: "period:fy2025", label: "FY 2025" },
    value: "5000000.00",
    unit: "USD",
    source: {
      name: "SEC EDGAR",
      url: "https://www.sec.gov/Archives/fixture/microsoft-10k-index.html",
      reference: "sec:fixture:microsoft:10-k:2025",
      documentType: "10-K",
      filingOrPublicationDate: "2025-07-30",
    },
    evidence: {
      documentVersion: "evidence-version:microsoft:10-k:2025:v2",
      safeEvidenceRef: "safe-ref:microsoft:capex:fy2025",
      coordinates: { section: "Notes", table: "Property and equipment", row: 2 },
      rawContentAvailable: false,
    },
    extraction: { method: "deterministic_xbrl", pipelineRunId: "pipeline-run:pr30-1b:fixture", modelAssisted: false },
    trustState: "human_verified",
    reviewRequired: false,
    humanVerified: true,
    conflictStatus: "none",
    amendmentStatus: "original",
    duplicateGroupStatus: "unique",
    anomalyStatus: "none",
    firstSeenAt: "2026-07-13T00:00:00.000Z",
    lastUpdatedAt: "2026-07-13T00:00:00.000Z",
    publicationLane: "verified",
  }),
  record({
    stableRecordId: "public-record:tesla:ai-compute:fy2025",
    recordVersion: "record-version:tesla:ai-compute:fy2025:v1",
    entity: { entityId: "entity:tesla", displayName: "Tesla, Inc." },
    metric: { metricId: "metric:ai-compute-capacity", displayLabel: "AI compute capacity" },
    period: { periodId: "period:fy2025", label: "FY 2025" },
    value: "10000",
    unit: "GPU",
    source: {
      name: "Company IR",
      url: "https://example.com/rights-safe/tesla-ai-compute",
      reference: "ir:fixture:tesla:ai-compute",
      documentType: "company_release",
      filingOrPublicationDate: "2025-05-05",
    },
    evidence: {
      documentVersion: "evidence-version:tesla:ir:ai-compute:v1",
      safeEvidenceRef: "safe-ref:tesla:ai-compute",
      coordinates: { section: "Release summary", paragraph: 2 },
      rawContentAvailable: false,
    },
    extraction: { method: "deterministic_release_parser", pipelineRunId: "pipeline-run:pr30-1b:fixture", modelAssisted: false },
    trustState: "source_attributed_unverified",
    reviewRequired: true,
    humanVerified: false,
    conflictStatus: "unresolved_conflict",
    amendmentStatus: "original",
    duplicateGroupStatus: "unique",
    anomalyStatus: "contradictory_source",
    firstSeenAt: "2026-07-13T00:00:00.000Z",
    lastUpdatedAt: "2026-07-13T00:00:00.000Z",
  }),
  record({
    stableRecordId: "public-record:meta:ai-capex:fy2025:prior",
    recordVersion: "record-version:meta:ai-capex:fy2025:v1",
    entity: { entityId: "entity:meta", displayName: "Meta Platforms, Inc." },
    metric: { metricId: "metric:ai-capex", displayLabel: "AI capital expenditure" },
    period: { periodId: "period:fy2025", label: "FY 2025" },
    value: "3000000.00",
    unit: "USD",
    source: {
      name: "SEC EDGAR",
      url: "https://www.sec.gov/Archives/fixture/meta-10k-index.html",
      reference: "sec:fixture:meta:10-k:2025",
      documentType: "10-K",
      filingOrPublicationDate: "2025-01-30",
    },
    evidence: {
      documentVersion: "evidence-version:meta:10-k:2025:v1",
      safeEvidenceRef: "safe-ref:meta:capex:prior",
      coordinates: { section: "Prior filing", table: "Capital expenditures", row: 1 },
      rawContentAvailable: false,
    },
    extraction: { method: "deterministic_xbrl", pipelineRunId: "pipeline-run:pr30-1b:fixture", modelAssisted: false },
    trustState: "superseded",
    reviewRequired: true,
    humanVerified: false,
    conflictStatus: "none",
    amendmentStatus: "superseded_by_amendment",
    duplicateGroupStatus: "unique",
    anomalyStatus: "none",
    firstSeenAt: "2026-07-13T00:00:00.000Z",
    lastUpdatedAt: "2026-07-13T00:00:00.000Z",
    current: false,
  }),
  record({
    stableRecordId: "public-record:oracle:rejected:fy2025",
    recordVersion: "record-version:oracle:rejected:fy2025:v1",
    entity: { entityId: "entity:oracle", displayName: "Oracle Corporation" },
    metric: { metricId: "metric:ai-cloud-contract-value", displayLabel: "AI cloud contract value" },
    period: { periodId: "period:fy2025", label: "FY 2025" },
    value: "99999999.00",
    unit: "USD",
    source: {
      name: "Company IR",
      url: "https://example.com/rights-safe/oracle-rejected",
      reference: "ir:fixture:oracle:rejected",
      documentType: "company_release",
      filingOrPublicationDate: "2025-06-05",
    },
    evidence: {
      documentVersion: "evidence-version:oracle:ir:rejected:v1",
      safeEvidenceRef: "safe-ref:oracle:rejected",
      coordinates: { section: "Release summary", paragraph: 3 },
      rawContentAvailable: false,
    },
    extraction: { method: "deterministic_release_parser", pipelineRunId: "pipeline-run:pr30-1b:fixture", modelAssisted: false },
    trustState: "rejected",
    reviewRequired: true,
    humanVerified: false,
    conflictStatus: "none",
    amendmentStatus: "original",
    duplicateGroupStatus: "unique",
    anomalyStatus: "review_rejected",
    firstSeenAt: "2026-07-13T00:00:00.000Z",
    lastUpdatedAt: "2026-07-13T00:00:00.000Z",
    current: false,
  }),
];

function caseFor(currentRecord: PublicTrustRecord, overrides: Partial<TrustReviewCase> = {}): TrustReviewCase {
  return {
    reviewCaseId: `review-case:${currentRecord.stableRecordId.replace("public-record:", "")}`,
    reviewQueueStatus: "open",
    reviewPriority: currentRecord.conflictStatus === "unresolved_conflict" ? "urgent" : "normal",
    queueAge: currentRecord.conflictStatus === "unresolved_conflict" ? "P3D" : "P1D",
    firstSeenAt: currentRecord.firstSeenAt,
    deferredUntil: null,
    groupedObservationCount: currentRecord.duplicateGroupStatus === "unique" ? 1 : 2,
    currentRecord,
    evidenceSafeBundle: {
      mode: "safe_reference",
      safeEvidenceRef: currentRecord.evidence.safeEvidenceRef,
      coordinates: currentRecord.evidence.coordinates,
      documentVersion: currentRecord.evidence.documentVersion,
      rawContentAvailable: false,
    },
    reviewHistory: [],
    safeForBatch: currentRecord.conflictStatus === "none" && currentRecord.extraction.modelAssisted === false,
    ...overrides,
  };
}

const reviewCases = records.filter((item) => item.reviewRequired && item.current).map((item) => caseFor(item));

export function validatePublicTrustContract(contractVersion = contractFixture.contractVersion) {
  assertContractVersion(contractVersion);
  return {
    contractVersion: PUBLIC_TRUST_CONTRACT_VERSION,
    policyVersion: PUBLIC_TRUST_POLICY_VERSION,
    trustStates: contractFixture.trustStateEnum,
    disclosureCodes: contractFixture.disclosureCodeEnum,
  };
}

export function getVisibilityPolicy(): VisibilityPolicy {
  validatePublicTrustContract();
  return {
    policyVersion: PUBLIC_TRUST_POLICY_VERSION,
    contractVersion: PUBLIC_TRUST_CONTRACT_VERSION,
    settings: { ...DEFAULT_VISIBILITY_SETTINGS },
    defaults: { ...DEFAULT_VISIBILITY_SETTINGS },
    updatedBy: "system:fixture",
    updatedAt: "2026-07-13T00:00:00.000Z",
    auditHistory: [{ actor: "system:fixture", changedAt: "2026-07-13T00:00:00.000Z", reasonCode: "default_safe_visibility" }],
  };
}

export function listPublicTrustRecords({ view = "latest_source_attributed" }: { view?: "latest_source_attributed" | "verified" } = {}) {
  validatePublicTrustContract();
  return records.filter((item) => {
    if (!item.current) return false;
    if (["rejected", "superseded"].includes(item.trustState)) return false;
    if (view === "verified") return item.trustState === "human_verified";
    return ["source_attributed_unverified", "system_validated", "human_verified"].includes(item.trustState);
  });
}

export function getHeadlineRecords() {
  const policy = getVisibilityPolicy();
  return listPublicTrustRecords().filter((item) => !(policy.settings.exclude_conflicted_from_headlines && item.conflictStatus !== "none"));
}

export function listTrustReviewCases({
  filters = {},
  sort = "priority",
  page = 1,
  pageSize = 10,
}: {
  filters?: Partial<Record<"company" | "metric" | "source" | "trustState" | "reviewPriority" | "conflict" | "anomaly" | "modelAssisted" | "queueAge", string>>;
  sort?: "priority" | "age" | "source_date" | "confidence";
  page?: number;
  pageSize?: number;
} = {}) {
  validatePublicTrustContract();
  const filtered = reviewCases.filter((item) => {
    const record = item.currentRecord;
    if (filters.company && !record.entity.displayName.toLowerCase().includes(filters.company.toLowerCase())) return false;
    if (filters.metric && record.metric.metricId !== filters.metric) return false;
    if (filters.source && record.source.name !== filters.source) return false;
    if (filters.trustState && record.trustState !== filters.trustState) return false;
    if (filters.reviewPriority && item.reviewPriority !== filters.reviewPriority) return false;
    if (filters.conflict && record.conflictStatus !== filters.conflict) return false;
    if (filters.anomaly && record.anomalyStatus !== filters.anomaly) return false;
    if (filters.modelAssisted && String(record.extraction.modelAssisted) !== filters.modelAssisted) return false;
    if (filters.queueAge && item.queueAge !== filters.queueAge) return false;
    return true;
  });
  const sorted = [...filtered].sort((left, right) => {
    if (sort === "source_date") return right.currentRecord.source.filingOrPublicationDate.localeCompare(left.currentRecord.source.filingOrPublicationDate);
    if (sort === "age") return right.queueAge.localeCompare(left.queueAge);
    const rank = { urgent: 0, high: 1, normal: 2 };
    return rank[left.reviewPriority] - rank[right.reviewPriority];
  });
  const start = (page - 1) * pageSize;
  return {
    cases: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
    sort,
    filters,
    metrics: backlogMetrics(reviewCases),
  };
}

export function getTrustReviewCase(reviewCaseId: string) {
  validatePublicTrustContract();
  const found = reviewCases.find((item) => item.reviewCaseId === reviewCaseId);
  if (!found) throw new Error("review_case_not_found");
  return found;
}

export function getGroupedObservations(duplicateGroupStatus: string) {
  return records.filter((item) => item.duplicateGroupStatus === duplicateGroupStatus);
}

export function backlogMetrics(cases: TrustReviewCase[]) {
  const countBy = (selector: (item: TrustReviewCase) => string) =>
    cases.reduce<Record<string, number>>((counts, item) => {
      const key = selector(item);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
  return {
    unresolvedQueueCount: cases.length,
    oldestUnresolvedItem: cases[0]?.reviewCaseId ?? null,
    dailyInflow: cases.length,
    dailyAdjudicationThroughput: 0,
    byTrustState: countBy((item) => item.currentRecord.trustState),
    bySource: countBy((item) => item.currentRecord.source.name),
    byPriority: countBy((item) => item.reviewPriority),
  };
}

export function evaluateDecisionRequest(input: {
  action: ReviewAction;
  reviewCaseId: string;
  reasonCode: string;
  expectedRecordVersion: string;
  expectedEvidenceVersion: string;
  policyVersion: string;
  idempotencyKey: string;
}) {
  const reviewCase = getTrustReviewCase(input.reviewCaseId);
  if (!input.reasonCode || !input.idempotencyKey) throw new Error("invalid_admin_decision");
  if (input.expectedRecordVersion !== reviewCase.currentRecord.recordVersion) throw new Error("stale_record_or_evidence_version");
  if (input.expectedEvidenceVersion !== reviewCase.currentRecord.evidence.documentVersion) throw new Error("stale_record_or_evidence_version");
  if (input.policyVersion !== PUBLIC_TRUST_POLICY_VERSION) throw new Error("policy_version_mismatch");
  return {
    decisionAccepted: true,
    action: input.action,
    resultingTrustState: input.action === "approve_human_verified" ? "human_verified" : reviewCase.currentRecord.trustState,
    publicationEnabled: false,
    safeMessage: "Decision accepted by fixture transport. Production mutations remain disabled in CI.",
  };
}
