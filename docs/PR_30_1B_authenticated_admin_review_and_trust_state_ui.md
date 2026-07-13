# Logical PR 30.1B — Authenticated Admin Review and Trust-State UI

Status: **PLANNED**
Repository: `ai-economy-ledger`
Depends on: Logical PR 30.1A in `ai-economy-ledger-data-engine`
Blocks: Logical PR 31 until merged and verified
Companion PR: Logical PR 30.1A

## 1. Objective

Extend the existing public application with:

1. an authenticated internal admin review area;
2. trust-state and visibility-policy controls;
3. public rendering of source-attributed, system-validated, and human-verified data;
4. explicit disclosure for unverified data;
5. safe integration with the versioned private-engine admin/public-record contract.

The public application repository may contain the admin UI code, but admin data and actions must remain protected and inaccessible to unauthorized users.

## 2. Authoritative dependencies

Treat these as authoritative:

- the merged Logical PR 30.1A cross-repository contract;
- existing public-application architecture and route conventions;
- existing Supabase authentication, admin bootstrap, RLS, and authorization mechanisms;
- existing design system and data-rendering conventions;
- existing public/private repository boundary;
- publication-safety and source-rights contracts;
- repository one-PR lifecycle and metadata rules.

Do not create a second independent login system.

## 3. Required architecture review

Before implementation, inspect and document:

- current Next.js route structure;
- existing admin bootstrap;
- Supabase auth/session flow;
- admin role representation;
- RLS policies and server-side authorization helpers;
- API/server-action conventions;
- design system and reusable components;
- test framework;
- Cloudflare/OpenNext deployment boundaries;
- public data rendering;
- environment-variable handling;
- browser/server bundle separation.

Reuse existing mechanisms wherever possible.

## 4. Admin routes

Prefer these routes unless repository conventions require equivalent names:

- `/admin`
- `/admin/review`
- `/admin/review/[reviewCaseId]`
- `/admin/settings/data-trust`

The admin area must not be linked as a public navigation destination for unauthorized users.

## 5. Authentication and authorization

Implement:

- login using the existing auth system;
- server-side session validation;
- server-side admin-role validation;
- unauthenticated redirect or `401`;
- authenticated non-admin `403`;
- secure logout;
- safe expired-session handling;
- protection against direct route access;
- protection for every admin mutation;
- no reliance solely on client-side role checks or hidden links.

Never expose:

- service-role keys;
- private database credentials;
- private-engine secrets;
- connector credentials;
- model-provider credentials;
- unrestricted evidence-storage paths.

Use existing Supabase/admin/RLS mechanisms.

## 6. Admin review dashboard

Implement a usable review queue with:

- unresolved queue count;
- oldest unresolved item;
- daily inflow;
- daily adjudication throughput;
- count by trust state;
- count by source;
- count by priority;
- filters for company, metric, source, trust state, review priority, conflict, anomaly, model-assisted provenance, and queue age;
- sorting by priority, age, confidence where provided, and source date;
- pagination;
- grouped duplicates/corroborating observations;
- batch selection only when the API marks cases safe and homogeneous;
- explicit loading, empty, error, stale, and unauthorized states.

The queue should support efficient repeated review without requiring manual return to the list after every decision.

## 7. Review detail

Display:

- proposed value;
- metric;
- entity;
- period;
- unit;
- source;
- filing/publication date;
- lawful source link;
- exact evidence excerpt where rights permit;
- otherwise safe evidence coordinates/reference;
- prior and current verified values;
- conflicts;
- amendments;
- restatements;
- duplicates;
- anomaly reasons;
- deterministic versus model-assisted provenance;
- model/prompt/policy metadata where safe and relevant;
- grouped source observations;
- complete review-decision history;
- trust-state history;
- stale-version warning;
- record, evidence, and policy versions.

Do not render raw copyrighted documents unless existing rights policy permits it.

## 8. Review actions

Support:

- approve as `human_verified`;
- reject;
- request more evidence;
- defer;
- reopen where allowed;
- supersede;
- batch approve/reject only when explicitly marked safe and homogeneous.

Every consequential action must:

- require a reason code;
- allow an optional note;
- show a confirmation step;
- send exact record/evidence/policy versions;
- include an idempotency key;
- handle stale-version rejection;
- show success/failure without leaking internal details;
- load the next appropriate review item after success.

## 9. Trust and visibility settings UI

Implement controls for:

- `show_source_attributed_unverified`
- `show_system_validated`
- `show_human_verified`
- `show_conflicted_records`
- `exclude_conflicted_from_headlines`
- `exclude_unverified_from_verified_aggregates`
- `show_superseded_history`
- `preview_disclosure_required`

For each setting, show:

- current value;
- safe default;
- explanatory text;
- impact summary;
- last changed by;
- changed at;
- policy version;
- audit/history view.

Changing visibility settings must not mutate underlying trust state, evidence, or review decisions.

## 10. Public trust-state rendering

Render trust state consistently wherever a data value appears.

Required user-facing labels:

- `Source-attributed — not yet human verified`
- `System validated`
- `Human verified`
- `Conflict detected`
- `Superseded / historical`

For `source_attributed_unverified`, always show:

- visible status badge;
- source name;
- source date;
- last updated date;
- explicit disclosure that the value has not yet been human verified.

Do not hide this disclosure only in a tooltip.

## 11. Public display behavior

Default behavior must:

- display all public-eligible records permitted by visibility policy;
- allow unverified data to display with prominent attribution;
- exclude rejected records;
- exclude superseded records from current-value views;
- exclude conflicted records from headline totals by default;
- exclude unverified records from verified-only aggregates;
- never label unreviewed data as verified, confirmed, audited, or certified;
- preserve source and trust-state attribution in every relevant view.

Provide clear distinctions between:

- latest/source-attributed views;
- verified-only views;
- current values;
- historical/superseded values.

## 12. Integration contract

Consume the versioned Logical PR 30.1A contract through a typed client/server adapter.

Requirements:

- fixture-backed or mocked transport in CI;
- no live private-engine endpoint required for CI;
- no production secret required for CI;
- fail closed on contract-version mismatch;
- validate payloads at the server boundary;
- sanitize safe user-facing error messages;
- keep private error details server-side;
- never trust client-provided admin identity or role.

## 13. Accessibility and usability

Implement:

- semantic headings;
- form labels;
- keyboard navigation;
- visible focus states;
- accessible status announcements;
- error summaries;
- confirmation dialogs;
- table/list semantics;
- non-color-only trust-state indicators;
- usable desktop layout;
- usable tablet layout;
- safe responsive degradation.

Review operations should be efficient enough for repeated daily use.

## 14. Required tests

Tests must cover:

- authenticated admin access;
- unauthenticated redirect or denial;
- authenticated non-admin denial;
- server-side admin authorization;
- review queue rendering, filters, sorting, pagination, and metrics;
- review detail and evidence-safe bundle rendering;
- grouped duplicates, conflicts, and anomaly display;
- approve, reject, request-more-evidence, defer, reopen, and supersede flows;
- stale-decision handling;
- batch-action safety;
- trust-setting updates;
- trust-state badge rendering;
- unverified public rendering and visible disclosure;
- verified-only filtering;
- rejected exclusion;
- superseded-current exclusion;
- conflicted headline exclusion;
- contract-version mismatch;
- safe error handling;
- absence of service-role/private credentials in browser bundles;
- accessibility of forms, labels, status, and keyboard navigation;
- responsive behavior at supported widths;
- build and Cloudflare/OpenNext compatibility.

Run existing auth/RLS smoke checks and database checks where applicable.

## 15. Repository and metadata updates

Update the public repository’s own:

- roadmap or project tracker;
- PR log;
- decision log where applicable;
- architecture notes;
- data-contract documentation;
- admin-operation documentation;
- manifest/index files where applicable.

Do not alter the private repository from this PR.

## 16. Acceptance criteria

- Existing auth/admin mechanisms are reused.
- Admin routes are protected server-side.
- Review queue and review detail are usable.
- Review actions are version-bound and stale-safe.
- Visibility policy is manageable through the admin UI.
- Unverified data renders publicly with explicit attribution.
- Verified-only views exclude unverified records.
- Rejected and superseded current values are excluded.
- Conflicted data is excluded from headlines by default.
- No private secrets or unrestricted evidence are exposed.
- Cross-repository contract is consumed safely.
- All tests, build, auth/RLS checks, and repository validation pass.
- One focused GitHub PR is used.
- PR is squash-merged, branch deleted, `main` synchronized, and merged-main verification passes.
- Logical PR 31 is not started.

## 17. Explicit boundaries

Do not:

- create a second auth system;
- expose private-engine operational data publicly;
- expose raw source documents without rights approval;
- include service-role or private credentials in browser code;
- enable production publication merely by merging this PR;
- provision new production infrastructure without owner approval;
- modify the private repository;
- begin Logical PR 31.

## 18. Owner-attention conditions

Stop for owner attention when:

- existing auth/admin foundations are insufficient or contradictory;
- new production secrets are required;
- a new production database or API deployment is required;
- RLS or admin authorization cannot be proven safely;
- the private/public boundary would be violated;
- contract incompatibility cannot be resolved without changing PR 30.1A;
- validation or deployment checks cannot be safely corrected.

## 19. Completion report

Report:

- GitHub PR number and URL;
- squash merge commit;
- authentication mechanism reused;
- admin routes;
- review queue and detail capabilities;
- review actions;
- trust and visibility settings;
- public trust-state rendering;
- tests added;
- auth/RLS validation;
- build and CI result;
- merged-main verification;
- residual risks;
- confirmation that Logical PR 31 was not started.
