CREATE SCHEMA "ledger";
--> statement-breakpoint
CREATE SCHEMA "private";
--> statement-breakpoint
CREATE TYPE "private"."app_role" AS ENUM('reviewer', 'admin');--> statement-breakpoint
CREATE TYPE "ledger"."cash_flow_type" AS ENUM('equity', 'debt', 'grant', 'project_finance', 'cloud_credit', 'capex', 'lease', 'power_obligation', 'recognized_revenue', 'run_rate_revenue', 'customer_prepayment', 'vendor_financing', 'other');--> statement-breakpoint
CREATE TYPE "ledger"."claim_kind" AS ENUM('fact', 'estimate', 'commitment', 'assumption');--> statement-breakpoint
CREATE TYPE "ledger"."company_status" AS ENUM('active', 'acquired', 'inactive', 'unknown');--> statement-breakpoint
CREATE TYPE "ledger"."confidence_grade" AS ENUM('high', 'medium', 'low', 'unscored');--> statement-breakpoint
CREATE TYPE "ledger"."license_status" AS ENUM('permitted', 'attribution_required', 'restricted', 'unknown');--> statement-breakpoint
CREATE TYPE "ledger"."methodology_status" AS ENUM('draft', 'active', 'retired');--> statement-breakpoint
CREATE TYPE "ledger"."period_type" AS ENUM('instant', 'day', 'month', 'quarter', 'half_year', 'year', 'multi_year', 'run_rate', 'unspecified');--> statement-breakpoint
CREATE TYPE "ledger"."publication_state" AS ENUM('draft', 'published', 'withdrawn');--> statement-breakpoint
CREATE TYPE "ledger"."recognition_type" AS ENUM('announced', 'committed', 'received', 'recognized', 'run_rate', 'estimated', 'face_value', 'cash_equivalent');--> statement-breakpoint
CREATE TYPE "ledger"."review_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "ledger"."review_state" AS ENUM('sample', 'pending', 'approved', 'rejected', 'needs_more_sources', 'stale', 'superseded');--> statement-breakpoint
CREATE TYPE "ledger"."review_subject_type" AS ENUM('claim', 'observation', 'snapshot');--> statement-breakpoint
CREATE TYPE "ledger"."source_type" AS ENUM('regulatory_filing', 'company_release', 'official_dataset', 'court_record', 'research_report', 'news', 'transcript', 'website', 'other');--> statement-breakpoint
CREATE TYPE "ledger"."value_type" AS ENUM('monetary', 'percentage', 'count', 'ratio', 'text', 'boolean');--> statement-breakpoint
CREATE TABLE "ledger"."app_health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component" text NOT NULL,
	"status" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"latency_ms" integer,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "app_health_checks_status" CHECK ("ledger"."app_health_checks"."status" in ('ok', 'degraded', 'failed')),
	CONSTRAINT "app_health_checks_latency" CHECK ("ledger"."app_health_checks"."latency_ms" is null or "ledger"."app_health_checks"."latency_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "private"."app_user_roles" (
	"user_id" uuid NOT NULL,
	"role" "private"."app_role" NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "ledger"."claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_document_id" uuid,
	"company_id" uuid,
	"kind" "ledger"."claim_kind" NOT NULL,
	"claim_text" text NOT NULL,
	"asserted_at" timestamp with time zone,
	"period_start" date,
	"period_end" date,
	"confidence" "ledger"."confidence_grade" DEFAULT 'unscored' NOT NULL,
	"review_state" "ledger"."review_state" DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"created_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claims_source_required" CHECK ("ledger"."claims"."kind" = 'assumption' or "ledger"."claims"."source_document_id" is not null),
	CONSTRAINT "claims_period_order" CHECK ("ledger"."claims"."period_start" is null or "ledger"."claims"."period_end" is null or "ledger"."claims"."period_start" <= "ledger"."claims"."period_end")
);
--> statement-breakpoint
CREATE TABLE "ledger"."companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"jurisdiction_code" text,
	"website_url" text,
	"lei" text,
	"status" "ledger"."company_status" DEFAULT 'active' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_format" CHECK ("ledger"."companies"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "ledger"."company_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"alias_type" text DEFAULT 'name' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."methodology_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "ledger"."methodology_status" DEFAULT 'draft' NOT NULL,
	"summary" text NOT NULL,
	"effective_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."metric_definitions" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"value_type" "ledger"."value_type" NOT NULL,
	"default_unit" text,
	"methodology_version_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."metric_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"metric_key" text NOT NULL,
	"claim_id" uuid NOT NULL,
	"numeric_value" numeric(30, 8),
	"text_value" text,
	"boolean_value" boolean,
	"unit" text,
	"reported_currency" text,
	"normalized_value" numeric(30, 8),
	"normalized_currency" text,
	"period_type" "ledger"."period_type" DEFAULT 'unspecified' NOT NULL,
	"period_start" date,
	"period_end" date,
	"as_of_date" date,
	"recognition_type" "ledger"."recognition_type" NOT NULL,
	"cash_flow_type" "ledger"."cash_flow_type",
	"confidence" "ledger"."confidence_grade" DEFAULT 'unscored' NOT NULL,
	"review_state" "ledger"."review_state" DEFAULT 'pending' NOT NULL,
	"methodology_version_id" text NOT NULL,
	"supersedes_observation_id" uuid,
	"revision_reason" text,
	"created_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metric_observations_one_value" CHECK (num_nonnulls("ledger"."metric_observations"."numeric_value", "ledger"."metric_observations"."text_value", "ledger"."metric_observations"."boolean_value") = 1),
	CONSTRAINT "metric_observations_period_order" CHECK ("ledger"."metric_observations"."period_start" is null or "ledger"."metric_observations"."period_end" is null or "ledger"."metric_observations"."period_start" <= "ledger"."metric_observations"."period_end"),
	CONSTRAINT "metric_observations_revision_reason" CHECK ("ledger"."metric_observations"."supersedes_observation_id" is null or nullif(btrim("ledger"."metric_observations"."revision_reason"), '') is not null)
);
--> statement-breakpoint
CREATE TABLE "ledger"."metric_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prior_observation_id" uuid NOT NULL,
	"revised_observation_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metric_revisions_distinct_observations" CHECK ("ledger"."metric_revisions"."prior_observation_id" <> "ledger"."metric_revisions"."revised_observation_id")
);
--> statement-breakpoint
CREATE TABLE "ledger"."published_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"version" integer NOT NULL,
	"state" "ledger"."publication_state" DEFAULT 'draft' NOT NULL,
	"methodology_version_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"content_sha256" text NOT NULL,
	"source_count" integer DEFAULT 0 NOT NULL,
	"observation_count" integer DEFAULT 0 NOT NULL,
	"generated_by" uuid,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_snapshots_positive_version" CHECK ("ledger"."published_snapshots"."version" > 0),
	CONSTRAINT "published_snapshots_sha256_format" CHECK ("ledger"."published_snapshots"."content_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "published_snapshots_publishable" CHECK ("ledger"."published_snapshots"."state" <> 'published' or ("ledger"."published_snapshots"."published_at" is not null and not "ledger"."published_snapshots"."is_sample"))
);
--> statement-breakpoint
CREATE TABLE "ledger"."review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "ledger"."review_subject_type" NOT NULL,
	"claim_id" uuid,
	"observation_id" uuid,
	"snapshot_id" uuid,
	"priority" "ledger"."review_priority" DEFAULT 'normal' NOT NULL,
	"state" "ledger"."review_state" DEFAULT 'pending' NOT NULL,
	"assigned_to" uuid,
	"due_at" timestamp with time zone,
	"notes" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_queue_one_subject" CHECK (num_nonnulls("ledger"."review_queue"."claim_id", "ledger"."review_queue"."observation_id", "ledger"."review_queue"."snapshot_id") = 1),
	CONSTRAINT "review_queue_subject_matches" CHECK (("ledger"."review_queue"."subject_type" = 'claim' and "ledger"."review_queue"."claim_id" is not null)
        or ("ledger"."review_queue"."subject_type" = 'observation' and "ledger"."review_queue"."observation_id" is not null)
        or ("ledger"."review_queue"."subject_type" = 'snapshot' and "ledger"."review_queue"."snapshot_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "ledger"."source_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_registry_id" uuid NOT NULL,
	"title" text NOT NULL,
	"document_url" text NOT NULL,
	"published_at" timestamp with time zone,
	"accessed_at" timestamp with time zone NOT NULL,
	"content_sha256" text,
	"storage_locator" text,
	"excerpt" text,
	"captured_by" uuid,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_documents_sha256_format" CHECK ("ledger"."source_documents"."content_sha256" is null or "ledger"."source_documents"."content_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "ledger"."source_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher" text NOT NULL,
	"source_type" "ledger"."source_type" NOT NULL,
	"canonical_url" text,
	"license_status" "ledger"."license_status" DEFAULT 'unknown' NOT NULL,
	"redistribution_allowed" boolean DEFAULT false NOT NULL,
	"license_notes" text,
	"license_reviewed_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger"."update_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid,
	"actor_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger"."claims" ADD CONSTRAINT "claims_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "ledger"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."claims" ADD CONSTRAINT "claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "ledger"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."company_aliases" ADD CONSTRAINT "company_aliases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "ledger"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_definitions" ADD CONSTRAINT "metric_definitions_methodology_version_id_methodology_versions_id_fk" FOREIGN KEY ("methodology_version_id") REFERENCES "ledger"."methodology_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_observations" ADD CONSTRAINT "metric_observations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "ledger"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_observations" ADD CONSTRAINT "metric_observations_metric_key_metric_definitions_key_fk" FOREIGN KEY ("metric_key") REFERENCES "ledger"."metric_definitions"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_observations" ADD CONSTRAINT "metric_observations_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "ledger"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_observations" ADD CONSTRAINT "metric_observations_methodology_version_id_methodology_versions_id_fk" FOREIGN KEY ("methodology_version_id") REFERENCES "ledger"."methodology_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_observations" ADD CONSTRAINT "metric_observations_supersedes_observation_id_metric_observations_id_fk" FOREIGN KEY ("supersedes_observation_id") REFERENCES "ledger"."metric_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_revisions" ADD CONSTRAINT "metric_revisions_prior_observation_id_metric_observations_id_fk" FOREIGN KEY ("prior_observation_id") REFERENCES "ledger"."metric_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."metric_revisions" ADD CONSTRAINT "metric_revisions_revised_observation_id_metric_observations_id_fk" FOREIGN KEY ("revised_observation_id") REFERENCES "ledger"."metric_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."published_snapshots" ADD CONSTRAINT "published_snapshots_methodology_version_id_methodology_versions_id_fk" FOREIGN KEY ("methodology_version_id") REFERENCES "ledger"."methodology_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."review_queue" ADD CONSTRAINT "review_queue_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "ledger"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."review_queue" ADD CONSTRAINT "review_queue_observation_id_metric_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "ledger"."metric_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."review_queue" ADD CONSTRAINT "review_queue_snapshot_id_published_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "ledger"."published_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."source_documents" ADD CONSTRAINT "source_documents_source_registry_id_source_registry_id_fk" FOREIGN KEY ("source_registry_id") REFERENCES "ledger"."source_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_health_checks_component_checked_idx" ON "ledger"."app_health_checks" USING btree ("component","checked_at");--> statement-breakpoint
CREATE INDEX "claims_document_idx" ON "ledger"."claims" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "claims_company_state_idx" ON "ledger"."claims" USING btree ("company_id","review_state");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_key" ON "ledger"."companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "companies_display_name_idx" ON "ledger"."companies" USING btree ("display_name");--> statement-breakpoint
CREATE UNIQUE INDEX "company_aliases_company_alias_key" ON "ledger"."company_aliases" USING btree ("company_id","alias");--> statement-breakpoint
CREATE INDEX "company_aliases_alias_idx" ON "ledger"."company_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "metric_observations_company_metric_period_idx" ON "ledger"."metric_observations" USING btree ("company_id","metric_key","period_end");--> statement-breakpoint
CREATE INDEX "metric_observations_review_state_idx" ON "ledger"."metric_observations" USING btree ("review_state");--> statement-breakpoint
CREATE INDEX "metric_observations_claim_idx" ON "ledger"."metric_observations" USING btree ("claim_id");--> statement-breakpoint
CREATE UNIQUE INDEX "metric_observations_supersedes_key" ON "ledger"."metric_observations" USING btree ("supersedes_observation_id") WHERE "ledger"."metric_observations"."review_state" = 'approved';--> statement-breakpoint
CREATE UNIQUE INDEX "metric_revisions_revised_key" ON "ledger"."metric_revisions" USING btree ("revised_observation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "published_snapshots_slug_version_key" ON "ledger"."published_snapshots" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "published_snapshots_public_idx" ON "ledger"."published_snapshots" USING btree ("slug","state","published_at");--> statement-breakpoint
CREATE INDEX "review_queue_state_priority_idx" ON "ledger"."review_queue" USING btree ("state","priority","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "source_documents_url_hash_key" ON "ledger"."source_documents" USING btree ("document_url","content_sha256");--> statement-breakpoint
CREATE INDEX "source_documents_registry_idx" ON "ledger"."source_documents" USING btree ("source_registry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_registry_canonical_url_key" ON "ledger"."source_registry" USING btree ("canonical_url");--> statement-breakpoint
CREATE INDEX "update_log_subject_idx" ON "ledger"."update_log" USING btree ("subject_type","subject_id","occurred_at");
--> statement-breakpoint
CREATE SCHEMA "api";
--> statement-breakpoint
ALTER TABLE "private"."app_user_roles"
  ADD CONSTRAINT "app_user_roles_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "private"."app_user_roles"
  ADD CONSTRAINT "app_user_roles_granted_by_auth_users_id_fk"
  FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "ledger"."claims"
  ADD CONSTRAINT "claims_created_by_auth_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "claims_reviewed_by_auth_users_id_fk"
  FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "ledger"."metric_observations"
  ADD CONSTRAINT "metric_observations_created_by_auth_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "metric_observations_reviewed_by_auth_users_id_fk"
  FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "ledger"."review_queue"
  ADD CONSTRAINT "review_queue_assigned_to_auth_users_id_fk"
  FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE FUNCTION "private"."has_app_role"("required_role" "private"."app_role")
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "private"."app_user_roles" AS roles
    WHERE roles."user_id" = (SELECT "auth"."uid"())
      AND roles."role" = required_role
  );
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."has_any_app_role"("required_roles" "private"."app_role"[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "private"."app_user_roles" AS roles
    WHERE roles."user_id" = (SELECT "auth"."uid"())
      AND roles."role" = ANY(required_roles)
  );
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."has_app_role"("private"."app_role") FROM PUBLIC;
REVOKE ALL ON FUNCTION "private"."has_any_app_role"("private"."app_role"[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."has_app_role"("private"."app_role") TO authenticated;
GRANT EXECUTE ON FUNCTION "private"."has_any_app_role"("private"."app_role"[]) TO authenticated;
--> statement-breakpoint
CREATE FUNCTION "private"."set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."validate_reviewed_record"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW."is_sample" <> (NEW."review_state" = 'sample') THEN
    RAISE EXCEPTION 'sample rows must use the sample review state';
  END IF;

  IF NEW."review_state" = 'approved'
    AND (NEW."reviewed_by" IS NULL OR NEW."reviewed_at" IS NULL) THEN
    RAISE EXCEPTION 'approved rows require reviewer identity and timestamp';
  END IF;

  IF NEW."review_state" = 'approved'
    AND (SELECT "auth"."uid"()) IS NOT NULL
    AND NEW."reviewed_by" <> (SELECT "auth"."uid"()) THEN
    RAISE EXCEPTION 'reviewed_by must match the authenticated reviewer';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."protect_reviewed_record"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD."review_state" IN ('approved', 'superseded')
    AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin')
    AND NOT (SELECT "private"."has_app_role"('admin')) THEN
    RAISE EXCEPTION 'approved and superseded records are immutable; create a revision';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."record_observation_revision"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  prior "ledger"."metric_observations"%ROWTYPE;
BEGIN
  IF NEW."supersedes_observation_id" IS NULL
    OR NEW."review_state" <> 'approved'
    OR (TG_OP = 'UPDATE' AND OLD."review_state" = 'approved') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO prior
  FROM "ledger"."metric_observations"
  WHERE "id" = NEW."supersedes_observation_id";

  IF prior."id" IS NULL
    OR prior."company_id" <> NEW."company_id"
    OR prior."metric_key" <> NEW."metric_key"
    OR prior."review_state" NOT IN ('approved', 'stale') THEN
    RAISE EXCEPTION 'a revision must supersede an observation for the same company and metric';
  END IF;

  INSERT INTO "ledger"."metric_revisions" (
    "prior_observation_id",
    "revised_observation_id",
    "reason",
    "created_by"
  ) VALUES (
    NEW."supersedes_observation_id",
    NEW."id",
    NEW."revision_reason",
    COALESCE(NEW."created_by", (SELECT "auth"."uid"()))
  );

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."validate_observation_revision_target"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  prior "ledger"."metric_observations"%ROWTYPE;
BEGIN
  IF NEW."supersedes_observation_id" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO prior
  FROM "ledger"."metric_observations"
  WHERE "id" = NEW."supersedes_observation_id";

  IF prior."id" IS NULL
    OR prior."company_id" <> NEW."company_id"
    OR prior."metric_key" <> NEW."metric_key"
    OR prior."review_state" NOT IN ('approved', 'stale') THEN
    RAISE EXCEPTION 'a revision candidate must target a current observation for the same company and metric';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."supersede_prior_observation"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW."review_state" = 'approved'
    AND NEW."supersedes_observation_id" IS NOT NULL
    AND (TG_OP = 'INSERT' OR OLD."review_state" <> 'approved') THEN
    UPDATE "ledger"."metric_observations"
    SET "review_state" = 'superseded'
    WHERE "id" = NEW."supersedes_observation_id"
      AND "review_state" IN ('approved', 'stale');
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION "private"."prevent_mutation"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "companies_set_updated_at" BEFORE UPDATE ON "ledger"."companies"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "company_aliases_set_updated_at" BEFORE UPDATE ON "ledger"."company_aliases"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "source_registry_set_updated_at" BEFORE UPDATE ON "ledger"."source_registry"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "source_documents_set_updated_at" BEFORE UPDATE ON "ledger"."source_documents"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "claims_set_updated_at" BEFORE UPDATE ON "ledger"."claims"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "metric_definitions_set_updated_at" BEFORE UPDATE ON "ledger"."metric_definitions"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "metric_observations_set_updated_at" BEFORE UPDATE ON "ledger"."metric_observations"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "published_snapshots_set_updated_at" BEFORE UPDATE ON "ledger"."published_snapshots"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "review_queue_set_updated_at" BEFORE UPDATE ON "ledger"."review_queue"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "methodology_versions_set_updated_at" BEFORE UPDATE ON "ledger"."methodology_versions"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
--> statement-breakpoint
CREATE TRIGGER "claims_validate_review" BEFORE INSERT OR UPDATE ON "ledger"."claims"
FOR EACH ROW EXECUTE FUNCTION "private"."validate_reviewed_record"();
CREATE TRIGGER "metric_observations_validate_review" BEFORE INSERT OR UPDATE ON "ledger"."metric_observations"
FOR EACH ROW EXECUTE FUNCTION "private"."validate_reviewed_record"();
CREATE TRIGGER "claims_protect_reviewed" BEFORE UPDATE ON "ledger"."claims"
FOR EACH ROW EXECUTE FUNCTION "private"."protect_reviewed_record"();
CREATE TRIGGER "metric_observations_protect_reviewed" BEFORE UPDATE ON "ledger"."metric_observations"
FOR EACH ROW EXECUTE FUNCTION "private"."protect_reviewed_record"();
CREATE TRIGGER "metric_observations_validate_revision_target" BEFORE INSERT OR UPDATE OF "supersedes_observation_id", "company_id", "metric_key" ON "ledger"."metric_observations"
FOR EACH ROW EXECUTE FUNCTION "private"."validate_observation_revision_target"();
CREATE TRIGGER "metric_observations_record_revision" AFTER INSERT OR UPDATE OF "review_state" ON "ledger"."metric_observations"
FOR EACH ROW EXECUTE FUNCTION "private"."record_observation_revision"();
CREATE TRIGGER "metric_observations_supersede_prior" AFTER INSERT OR UPDATE OF "review_state" ON "ledger"."metric_observations"
FOR EACH ROW EXECUTE FUNCTION "private"."supersede_prior_observation"();
CREATE TRIGGER "metric_revisions_append_only" BEFORE UPDATE OR DELETE ON "ledger"."metric_revisions"
FOR EACH ROW EXECUTE FUNCTION "private"."prevent_mutation"();
CREATE TRIGGER "update_log_append_only" BEFORE UPDATE OR DELETE ON "ledger"."update_log"
FOR EACH ROW EXECUTE FUNCTION "private"."prevent_mutation"();
--> statement-breakpoint
ALTER TABLE "private"."app_user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."app_health_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."company_aliases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."methodology_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."metric_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."metric_observations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."metric_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."published_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."review_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."source_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."source_registry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."update_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON SCHEMA "ledger" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SCHEMA "private" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SCHEMA "api" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA "ledger" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA "private" FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA "ledger" TO authenticated, service_role;
GRANT USAGE ON SCHEMA "api" TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA "ledger" TO authenticated;
GRANT INSERT, UPDATE ON "ledger"."companies", "ledger"."company_aliases",
  "ledger"."source_registry", "ledger"."source_documents", "ledger"."claims",
  "ledger"."metric_observations", "ledger"."review_queue" TO authenticated;
GRANT INSERT ON "ledger"."metric_revisions", "ledger"."update_log" TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA "ledger" TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "private" TO service_role;
GRANT USAGE ON SCHEMA "private" TO service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "private" FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "private"."has_app_role"("private"."app_role") TO authenticated;
GRANT EXECUTE ON FUNCTION "private"."has_any_app_role"("private"."app_role"[]) TO authenticated;
--> statement-breakpoint
CREATE POLICY "reviewers_read_companies" ON "ledger"."companies" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_companies" ON "ledger"."companies" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_company_aliases" ON "ledger"."company_aliases" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_company_aliases" ON "ledger"."company_aliases" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_source_registry" ON "ledger"."source_registry" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_source_registry" ON "ledger"."source_registry" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_source_documents" ON "ledger"."source_documents" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_source_documents" ON "ledger"."source_documents" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_claims" ON "ledger"."claims" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_claims" ON "ledger"."claims" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_observations" ON "ledger"."metric_observations" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_observations" ON "ledger"."metric_observations" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_revisions" ON "ledger"."metric_revisions" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_insert_revisions" ON "ledger"."metric_revisions" FOR INSERT TO authenticated
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_queue" ON "ledger"."review_queue" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_queue" ON "ledger"."review_queue" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_update_log" ON "ledger"."update_log" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_insert_update_log" ON "ledger"."update_log" FOR INSERT TO authenticated
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_definitions" ON "ledger"."metric_definitions" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_methodology" ON "ledger"."methodology_versions" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_snapshots" ON "ledger"."published_snapshots" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "admins_write_definitions" ON "ledger"."metric_definitions" FOR ALL TO authenticated
USING ((SELECT "private"."has_app_role"('admin')))
WITH CHECK ((SELECT "private"."has_app_role"('admin')));
CREATE POLICY "admins_write_methodology" ON "ledger"."methodology_versions" FOR ALL TO authenticated
USING ((SELECT "private"."has_app_role"('admin')))
WITH CHECK ((SELECT "private"."has_app_role"('admin')));
CREATE POLICY "admins_write_snapshots" ON "ledger"."published_snapshots" FOR ALL TO authenticated
USING ((SELECT "private"."has_app_role"('admin')))
WITH CHECK ((SELECT "private"."has_app_role"('admin')));
--> statement-breakpoint
CREATE FUNCTION "api"."list_published_snapshots"()
RETURNS TABLE (
  "slug" text,
  "version" integer,
  "methodology_version_id" text,
  "source_count" integer,
  "observation_count" integer,
  "published_at" timestamptz,
  "content_sha256" text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT snapshots."slug", snapshots."version", snapshots."methodology_version_id",
    snapshots."source_count", snapshots."observation_count", snapshots."published_at",
    snapshots."content_sha256"
  FROM "ledger"."published_snapshots" AS snapshots
  WHERE snapshots."state" = 'published'
    AND NOT snapshots."is_sample"
  ORDER BY snapshots."published_at" DESC, snapshots."version" DESC;
$$;
--> statement-breakpoint
CREATE FUNCTION "api"."get_published_snapshot"("requested_slug" text, "requested_version" integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT snapshots."payload"
  FROM "ledger"."published_snapshots" AS snapshots
  WHERE snapshots."slug" = requested_slug
    AND snapshots."state" = 'published'
    AND NOT snapshots."is_sample"
    AND (requested_version IS NULL OR snapshots."version" = requested_version)
  ORDER BY snapshots."version" DESC
  LIMIT 1;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION "api"."list_published_snapshots"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "api"."get_published_snapshot"(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "api"."list_published_snapshots"() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION "api"."get_published_snapshot"(text, integer) TO anon, authenticated;
--> statement-breakpoint
INSERT INTO "ledger"."methodology_versions" ("id", "status", "summary", "effective_at")
VALUES ('v0.1.0', 'active', 'Initial source-linked ledger methodology', now());
