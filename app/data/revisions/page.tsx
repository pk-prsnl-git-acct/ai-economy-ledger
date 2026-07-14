import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation } from "@/components/data-release";
import { getRevisions } from "@/src/server/data-releases/contract";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/revisions");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export default function RevisionsPage() {
  const { revisions } = getRevisions();
  return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><section className="panel empty-feed"><p className="panel-label">Current release delta</p><h2>{revisions.length === 0 ? "No prior release, so no semantic delta" : `${revisions.length} revision events`}</h2><p>The first candidate establishes immutable history. Future value, metadata, trust, visibility, eligibility, source, amendment, restatement, supersession, and withdrawal changes will appear here instead of rewriting it.</p></section></AppShell>;
}
