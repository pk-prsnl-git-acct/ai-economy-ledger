import "server-only";

import type postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

type DraftSnapshot = {
  slug: string;
  version: number;
  methodologyVersionId: string;
  payload: unknown;
  contentSha256: string;
  sourceCount: number;
  observationCount: number;
  generatedAt: string;
  isSample: false;
};

export function createPublicationRepository(sql: SqlClient) {
  return {
    async loadPublicationRows({ methodologyVersion }: { methodologyVersion: string }) {
      return sql`
        select
          observation.id::text as "observationId",
          observation.review_state as "observationReviewState",
          observation.is_sample as "observationIsSample",
          successor.id::text as "supersededByObservationId",
          company.slug as "companySlug",
          company.display_name as "companyName",
          company.is_sample as "companyIsSample",
          observation.metric_key as "metricKey",
          observation.numeric_value::text as "numericValue",
          observation.normalized_value::text as "normalizedValue",
          observation.text_value as "textValue",
          observation.boolean_value as "booleanValue",
          observation.unit,
          observation.normalized_currency as "normalizedCurrency",
          observation.period_type as "periodType",
          observation.period_start::text as "periodStart",
          observation.period_end::text as "periodEnd",
          observation.as_of_date::text as "asOfDate",
          observation.recognition_type as "recognitionType",
          observation.cash_flow_type as "cashFlowType",
          observation.confidence,
          claim.id::text as "claimId",
          claim.kind as "claimKind",
          claim.claim_text as "claimText",
          claim.review_state as "claimReviewState",
          claim.is_sample as "claimIsSample",
          document.id::text as "sourceDocumentId",
          document.title as "sourceTitle",
          document.document_url as "sourceUrl",
          document.published_at as "sourcePublishedAt",
          document.accessed_at as "sourceAccessedAt",
          document.is_sample as "sourceDocumentIsSample",
          registry.publisher,
          registry.source_type as "sourceType",
          registry.is_sample as "sourceRegistryIsSample",
          registry.redistribution_allowed as "redistributionAllowed"
        from ledger.metric_observations observation
        join ledger.companies company on company.id = observation.company_id
        join ledger.claims claim on claim.id = observation.claim_id
        join ledger.source_documents document on document.id = claim.source_document_id
        join ledger.source_registry registry on registry.id = document.source_registry_id
        left join ledger.metric_observations successor
          on successor.supersedes_observation_id = observation.id
          and successor.review_state = 'approved'
        where observation.methodology_version_id = ${methodologyVersion}
        order by observation.id
      `;
    },

    async nextSnapshotVersion(slug: string) {
      const [row] = await sql<{ nextVersion: number }[]>`
        select coalesce(max(version), 0)::integer + 1 as "nextVersion"
        from ledger.published_snapshots
        where slug = ${slug}
      `;
      return row.nextVersion;
    },

    async saveDraftSnapshot(snapshot: DraftSnapshot) {
      await sql`
        insert into ledger.published_snapshots (
          slug, version, state, methodology_version_id, payload, content_sha256,
          source_count, observation_count, generated_at, is_sample
        ) values (
          ${snapshot.slug}, ${snapshot.version}, 'draft', ${snapshot.methodologyVersionId},
          ${sql.json(snapshot.payload as never)}, ${snapshot.contentSha256}, ${snapshot.sourceCount},
          ${snapshot.observationCount}, ${snapshot.generatedAt}, false
        )
      `;
    },
  };
}
