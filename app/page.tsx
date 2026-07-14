import type { Metadata } from "next";

import { AppShell, DataTable, FinancialChartCard, HeroSection, KpiCard, PublicTrustLedger, SampleDataWarning } from "@/components/ledger";
import { getHeadlineRecords, listPublicTrustRecords } from "@/src/server/admin/public-trust/contract";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/");

export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export default function HomePage() {
  const trustRecords = listPublicTrustRecords();
  const verifiedRecords = listPublicTrustRecords({ view: "verified" });
  const headlineRecords = getHeadlineRecords();
  return (
    <AppShell>
      <HeroSection route={route} />
      <SampleDataWarning />
      <section className="kpi-grid" aria-label="Illustrative key metrics">
        <KpiCard label="Total capital in" value="$— sample" />
        <KpiCard label="Gross AI revenue" value="$— sample" tone="violet" />
        <KpiCard label="Total obligations" value="$— sample" tone="amber" />
        <KpiCard label="Adjusted net flow" value="$— sample" tone="green" />
      </section>
      <section className="chart-grid">
        <FinancialChartCard title="Capital and revenue over time" />
        <FinancialChartCard title="Gross and adjusted flow" variant="bars" />
      </section>
      <PublicTrustLedger records={trustRecords} verifiedRecords={verifiedRecords} headlineCount={headlineRecords.length} />
      <DataTable />
    </AppShell>
  );
}
