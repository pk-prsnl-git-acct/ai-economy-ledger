begin;

select plan(36);

select has_schema('ledger');
select has_schema('private');
select has_schema('api');

select has_table('ledger', 'companies', 'companies table exists');
select has_table('ledger', 'source_registry', 'source registry table exists');
select has_table('ledger', 'source_documents', 'source documents table exists');
select has_table('ledger', 'claims', 'claims table exists');
select has_table('ledger', 'metric_definitions', 'metric definitions table exists');
select has_table('ledger', 'metric_observations', 'metric observations table exists');
select has_table('ledger', 'metric_revisions', 'metric revisions table exists');
select has_table('ledger', 'review_queue', 'review queue table exists');
select has_table('ledger', 'published_snapshots', 'published snapshots table exists');
select has_table('ledger', 'update_log', 'update log table exists');
select has_table('private', 'app_user_roles', 'application role table exists');

select has_function('private', 'has_app_role', array['private.app_role']);
select has_function('private', 'has_any_app_role', array['private.app_role[]']);
select has_function('api', 'list_published_snapshots', array[]::text[]);
select has_function('api', 'get_published_snapshot', array['text', 'integer']);

select results_eq(
  $$select relrowsecurity from pg_class where oid = 'ledger.companies'::regclass$$,
  array[true],
  'companies has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'ledger.claims'::regclass$$,
  array[true],
  'claims has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'ledger.metric_observations'::regclass$$,
  array[true],
  'observations have RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'ledger.published_snapshots'::regclass$$,
  array[true],
  'snapshots have RLS enabled'
);

select policies_are('ledger', 'claims', array['reviewers_read_claims', 'reviewers_write_claims']);
select policies_are(
  'ledger',
  'metric_observations',
  array['reviewers_read_observations', 'reviewers_write_observations']
);
select policies_are(
  'ledger',
  'published_snapshots',
  array['admins_write_snapshots', 'reviewers_read_snapshots']
);

select is_empty(
  $$select * from api.list_published_snapshots()$$,
  'no snapshot is public before explicit publication'
);
select is(
  api.get_published_snapshot('missing', null),
  null::jsonb,
  'missing public snapshots return null'
);

set local role anon;
select lives_ok(
  $$select * from api.list_published_snapshots()$$,
  'anonymous users can call the narrow publication API'
);
select throws_ok(
  $$select * from ledger.companies$$,
  '42501',
  null,
  'anonymous users cannot read canonical ledger tables'
);
reset role;

set local role authenticated;
select is_empty(
  $$select * from ledger.companies$$,
  'authenticated users without an application role see no canonical rows'
);
reset role;

select throws_ok(
  $$insert into ledger.published_snapshots (
      slug, version, methodology_version_id, payload, content_sha256, state, published_at, is_sample
    ) values (
      'sample', 1, 'v0.1.0', '{}'::jsonb, repeat('a', 64), 'published', now(), true
    )$$,
  '23514',
  null,
  'sample snapshots cannot be published'
);

select throws_ok(
  $$insert into ledger.metric_observations (
      company_id, metric_key, claim_id, numeric_value, text_value,
      recognition_type, methodology_version_id
    ) values (
      gen_random_uuid(), 'missing', gen_random_uuid(), 1, 'two values',
      'estimated', 'v0.1.0'
    )$$,
  '23514',
  null,
  'an observation must contain exactly one typed value'
);

select lives_ok(
  $$select id, status from ledger.methodology_versions where id = 'v0.1.0'$$,
  'initial methodology version exists'
);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'reviewer@example.test', '', now());

insert into ledger.companies (id, slug, legal_name, display_name)
values ('10000000-0000-0000-0000-000000000001', 'test-company', 'Test Company', 'Test Company');

insert into ledger.source_registry (id, publisher, source_type)
values ('20000000-0000-0000-0000-000000000001', 'Test Publisher', 'official_dataset');

insert into ledger.source_documents (
  id, source_registry_id, title, document_url, accessed_at
) values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Test Document',
  'https://example.test/document',
  now()
);

insert into ledger.claims (
  id, source_document_id, company_id, kind, claim_text, review_state, reviewed_by, reviewed_at
) values (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'fact',
  'Test claim',
  'approved',
  '00000000-0000-0000-0000-000000000001',
  now()
);

insert into ledger.metric_definitions (
  key, label, description, value_type, methodology_version_id
) values ('test_metric', 'Test metric', 'Test-only metric', 'monetary', 'v0.1.0');

insert into ledger.metric_observations (
  id, company_id, metric_key, claim_id, numeric_value, unit, reported_currency,
  recognition_type, review_state, methodology_version_id, reviewed_by, reviewed_at
) values (
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'test_metric',
  '40000000-0000-0000-0000-000000000001',
  10,
  'USD',
  'USD',
  'recognized',
  'approved',
  'v0.1.0',
  '00000000-0000-0000-0000-000000000001',
  now()
);

insert into ledger.metric_observations (
  id, company_id, metric_key, claim_id, numeric_value, unit, reported_currency,
  recognition_type, review_state, methodology_version_id, supersedes_observation_id,
  revision_reason
) values (
  '50000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'test_metric',
  '40000000-0000-0000-0000-000000000001',
  11,
  'USD',
  'USD',
  'recognized',
  'rejected',
  'v0.1.0',
  '50000000-0000-0000-0000-000000000001',
  'Rejected correction candidate'
);

insert into ledger.metric_observations (
  id, company_id, metric_key, claim_id, numeric_value, unit, reported_currency,
  recognition_type, review_state, methodology_version_id, supersedes_observation_id,
  revision_reason, reviewed_by, reviewed_at
) values (
  '50000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'test_metric',
  '40000000-0000-0000-0000-000000000001',
  12,
  'USD',
  'USD',
  'recognized',
  'approved',
  'v0.1.0',
  '50000000-0000-0000-0000-000000000001',
  'Corrected source value',
  '00000000-0000-0000-0000-000000000001',
  now()
);

select results_eq(
  $$select review_state::text from ledger.metric_observations where id = '50000000-0000-0000-0000-000000000001'$$,
  array['superseded'],
  'approving a revision supersedes the prior observation'
);
select results_eq(
  $$select count(*)::integer from ledger.metric_revisions where revised_observation_id = '50000000-0000-0000-0000-000000000002'$$,
  array[1],
  'revision lineage is recorded once'
);
select results_eq(
  $$select count(*)::integer from ledger.metric_revisions where revised_observation_id = '50000000-0000-0000-0000-000000000003'$$,
  array[0],
  'rejected candidates do not enter revision history'
);

select * from finish();
rollback;
