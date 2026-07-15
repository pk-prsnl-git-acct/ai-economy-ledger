import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { listReleases } from "@/src/server/data-releases/runtime";
import type { PublicRecord } from "@/src/server/data-releases/runtime";

export async function CandidateNotice() {
  let published = false;
  try {
    published = (await listReleases()).some((release) => release.status === "published");
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
  }
  return (
    <section className="warning-banner release-notice" aria-label={published ? "Limited production release notice" : "Release candidate notice"}>
      <strong>{published ? "Limited production release" : "Local/CI release candidate"}</strong>
      <span>{published ? "This live bundle is hash verified, source-attributed, and intentionally limited. Review-pending data is disclosed and missing values are never converted to zero." : "This bundle is hash verified but not a live production publication. Coverage is intentionally limited and missing values are never converted to zero."}</span>
    </section>
  );
}

export function DataNavigation() {
  const links = [
    ["Downloads", "/data"], ["Releases", "/data/releases"], ["Coverage", "/data/coverage"],
    ["Quality", "/data/quality"], ["Sources", "/data/sources"], ["Revisions", "/data/revisions"], ["Corrections", "/data/corrections"]
  ];
  return <nav className="data-nav" aria-label="Dataset navigation">{links.map(([label, href]) => <Link href={href as Route} key={href}>{label}</Link>)}</nav>;
}

export function ReleaseUnavailablePanel({ surface = "release data" }: { surface?: string }) {
  return (
    <section className="panel unavailable-view" role="status" aria-live="polite">
      <span className="unavailable-glyph" aria-hidden="true">∅</span>
      <p className="panel-label">Publication gate closed</p>
      <h2>Production {surface} is not published yet</h2>
      <p>The public application reached the private release service, but no current release pointer is enabled. No embedded fixture, candidate-only, or partial private data has been substituted.</p>
      <div className="reason-list"><span>publication disabled</span><span>no current release pointer</span><span>fail closed</span></div>
      <dl><div><dt>Public state</dt><dd>Unavailable</dd></div><div><dt>Next gate</dt><dd>Atomic promotion</dd></div></dl>
    </section>
  );
}

export function DecisionBadges({ record }: { record: PublicRecord }) {
  const decisions = [
    ["Visible", record.visibilityEligible],
    ["Verified", record.verifiedLaneEligible],
    ["Headline", record.headlineEligible],
    ["Publish", record.publicationExecutionEligible]
  ] as const;
  return <div className="decision-stack">{decisions.map(([label, enabled]) => <span className={`decision-pill decision-${enabled ? "yes" : "no"}`} key={label}>{label}: {enabled ? "yes" : "no"}</span>)}</div>;
}

export function TrustLabel({ record }: { record: PublicRecord }) {
  const label = record.verificationMethod === "human_reviewed"
    ? "Human verified"
    : record.verificationMethod === "certified_system_validation"
      ? "System validated"
      : "Source-attributed, review pending";
  return <span className={`badge trust-${record.trustState}`}>{label}</span>;
}

export function DownloadLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="download-action" href={href}>{children}<span aria-hidden="true">↓</span></a>;
}
