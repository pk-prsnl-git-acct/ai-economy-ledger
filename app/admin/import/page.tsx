import type { Metadata } from "next";
import { ProtectedAdminPage } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";
const route = findAdminRoute("/admin/import");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
const checks = [
  "CSV headers match the reviewed import contract",
  "Sample rows preserve review_state=sample and is_sample=true",
  "Demo import produces zero verified totals",
  "Formula-like spreadsheet cells are rejected before ingestion",
];
export default function AdminImportPage() {
  return (
    <ProtectedAdminPage route={route}>
      <section className="panel template-panel">
        <p className="panel-label">Import dry run</p>
        <h2>Sample templates validate locally before admin import exists</h2>
        <p>PR 5 adds the import contract and demo verification only. This protected route confirms reviewer access before any future upload workflow is added.</p>
        <div className="template-list">
          {checks.map((check) => <span key={check}>{check}</span>)}
        </div>
      </section>
    </ProtectedAdminPage>
  );
}
