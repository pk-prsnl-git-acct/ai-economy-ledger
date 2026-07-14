import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import type { PublicRecord } from "@/src/server/data-releases/contract";

export function CandidateNotice() {
  return (
    <section className="warning-banner release-notice" aria-label="Release candidate notice">
      <strong>Local/CI release candidate</strong>
      <span>This bundle is hash verified but not a live production publication. Coverage is intentionally limited and missing values are never converted to zero.</span>
    </section>
  );
}

export function DataNavigation() {
  const links = [
    ["Downloads", "/data"], ["Releases", "/data/releases"], ["Coverage", "/data/coverage"],
    ["Sources", "/data/sources"], ["Revisions", "/data/revisions"], ["Corrections", "/data/corrections"]
  ];
  return <nav className="data-nav" aria-label="Dataset navigation">{links.map(([label, href]) => <Link href={href as Route} key={href}>{label}</Link>)}</nav>;
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
