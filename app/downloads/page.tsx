import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice } from "@/components/data-release";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/downloads");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function DownloadsPage() {
  return (
    <AppShell>
      <HeroSection route={route} />
      <CandidateNotice />
      <section className="panel template-panel">
        <p className="panel-label">PR34 dataset contract</p>
        <h2>Hash-verified release downloads are available</h2>
        <p>Open the dataset hub for separate source-attributed and verified JSON/CSV lanes, coverage, source manifests, immutable releases, revisions, and corrections.</p>
        <Link className="download-action" href={"/data" as Route}>Open dataset hub →</Link>
      </section>
    </AppShell>
  );
}
