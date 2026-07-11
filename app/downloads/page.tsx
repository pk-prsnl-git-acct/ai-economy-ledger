import type { Metadata } from "next";
import { AppShell, HeroSection, SampleDataWarning } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/downloads");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
const templates = ["companies", "metric definitions", "source registry", "source documents", "claims", "metric observations"];
export default function DownloadsPage() {
  return (
    <AppShell>
      <HeroSection route={route} />
      <SampleDataWarning />
      <section className="panel template-panel">
        <p className="panel-label">PR 5 import contract</p>
        <h2>Contributor templates are available in the repository</h2>
        <p>The CSV headers and sample workbook are demo-only inputs for review. They are not published data exports and are excluded from verified totals.</p>
        <div className="template-list">
          {templates.map((template) => <span key={template}>{template}</span>)}
        </div>
        <p className="path-note">Repository paths: data/import-templates and data/sample/ai_economy_ledger_sample_import.xlsx</p>
      </section>
    </AppShell>
  );
}
