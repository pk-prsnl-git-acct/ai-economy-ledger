CREATE TYPE "ledger"."relationship_type" AS ENUM('investor', 'vendor', 'customer', 'cloud', 'compute', 'data_center', 'subsidiary', 'partner', 'lender', 'borrower', 'other');--> statement-breakpoint
CREATE TYPE "ledger"."scenario_run_state" AS ENUM('draft', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "ledger"."relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_company_id" uuid NOT NULL,
	"to_company_id" uuid NOT NULL,
	"relationship_type" "ledger"."relationship_type" NOT NULL,
	"claim_id" uuid NOT NULL,
	"observation_id" uuid,
	"amount" numeric(30, 8),
	"currency" text,
	"period_start" date,
	"period_end" date,
	"confidence" "ledger"."confidence_grade" DEFAULT 'unscored' NOT NULL,
	"review_state" "ledger"."review_state" DEFAULT 'pending' NOT NULL,
	"is_related_party" boolean DEFAULT false NOT NULL,
	"is_circular" boolean DEFAULT false NOT NULL,
	"is_vendor_financed" boolean DEFAULT false NOT NULL,
	"methodology_version_id" text NOT NULL,
	"created_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationships_distinct_companies" CHECK ("ledger"."relationships"."from_company_id" <> "ledger"."relationships"."to_company_id"),
	CONSTRAINT "relationships_period_order" CHECK ("ledger"."relationships"."period_start" is null or "ledger"."relationships"."period_end" is null or "ledger"."relationships"."period_start" <= "ledger"."relationships"."period_end"),
	CONSTRAINT "relationships_amount_currency" CHECK ("ledger"."relationships"."amount" is null or nullif(btrim("ledger"."relationships"."currency"), '') is not null)
);
--> statement-breakpoint
CREATE TABLE "ledger"."scenario_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_key" text NOT NULL,
	"methodology_version_id" text NOT NULL,
	"state" "ledger"."scenario_run_state" DEFAULT 'draft' NOT NULL,
	"assumptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb,
	"content_sha256" text,
	"created_by" uuid,
	"completed_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_runs_key_format" CHECK ("ledger"."scenario_runs"."scenario_key" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "scenario_runs_sha256_format" CHECK ("ledger"."scenario_runs"."content_sha256" is null or "ledger"."scenario_runs"."content_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "scenario_runs_completed_shape" CHECK ("ledger"."scenario_runs"."state" <> 'completed' or ("ledger"."scenario_runs"."result" is not null and "ledger"."scenario_runs"."content_sha256" is not null and "ledger"."scenario_runs"."completed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "ledger"."relationships" ADD CONSTRAINT "relationships_from_company_id_companies_id_fk" FOREIGN KEY ("from_company_id") REFERENCES "ledger"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."relationships" ADD CONSTRAINT "relationships_to_company_id_companies_id_fk" FOREIGN KEY ("to_company_id") REFERENCES "ledger"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."relationships" ADD CONSTRAINT "relationships_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "ledger"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."relationships" ADD CONSTRAINT "relationships_observation_id_metric_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "ledger"."metric_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."relationships" ADD CONSTRAINT "relationships_methodology_version_id_methodology_versions_id_fk" FOREIGN KEY ("methodology_version_id") REFERENCES "ledger"."methodology_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger"."scenario_runs" ADD CONSTRAINT "scenario_runs_methodology_version_id_methodology_versions_id_fk" FOREIGN KEY ("methodology_version_id") REFERENCES "ledger"."methodology_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "relationships_from_to_idx" ON "ledger"."relationships" USING btree ("from_company_id","to_company_id");--> statement-breakpoint
CREATE INDEX "relationships_observation_idx" ON "ledger"."relationships" USING btree ("observation_id");--> statement-breakpoint
CREATE INDEX "relationships_review_state_idx" ON "ledger"."relationships" USING btree ("review_state");--> statement-breakpoint
CREATE INDEX "scenario_runs_key_created_idx" ON "ledger"."scenario_runs" USING btree ("scenario_key","created_at");
--> statement-breakpoint
CREATE TRIGGER "relationships_set_updated_at" BEFORE UPDATE ON "ledger"."relationships"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "scenario_runs_set_updated_at" BEFORE UPDATE ON "ledger"."scenario_runs"
FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();
CREATE TRIGGER "relationships_validate_review" BEFORE INSERT OR UPDATE ON "ledger"."relationships"
FOR EACH ROW EXECUTE FUNCTION "private"."validate_reviewed_record"();
CREATE TRIGGER "relationships_protect_reviewed" BEFORE UPDATE ON "ledger"."relationships"
FOR EACH ROW EXECUTE FUNCTION "private"."protect_reviewed_record"();
--> statement-breakpoint
ALTER TABLE "ledger"."relationships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger"."scenario_runs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ledger"."relationships", "ledger"."scenario_runs" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON "ledger"."relationships" TO authenticated;
GRANT SELECT ON "ledger"."scenario_runs" TO authenticated;
GRANT ALL ON "ledger"."relationships", "ledger"."scenario_runs" TO service_role;
--> statement-breakpoint
CREATE POLICY "reviewers_read_relationships" ON "ledger"."relationships" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_write_relationships" ON "ledger"."relationships" FOR ALL TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])))
WITH CHECK ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "reviewers_read_scenario_runs" ON "ledger"."scenario_runs" FOR SELECT TO authenticated
USING ((SELECT "private"."has_any_app_role"(ARRAY['reviewer', 'admin']::"private"."app_role"[])));
CREATE POLICY "admins_write_scenario_runs" ON "ledger"."scenario_runs" FOR ALL TO authenticated
USING ((SELECT "private"."has_app_role"('admin')))
WITH CHECK ((SELECT "private"."has_app_role"('admin')));
