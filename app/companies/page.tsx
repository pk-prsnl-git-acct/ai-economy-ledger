import type { Metadata } from "next";
import { AppShell, DataQualityPanel, DataTable, HeroSection, SampleDataWarning } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/companies");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function CompaniesPage() { return <AppShell><HeroSection route={route} aside={<DataQualityPanel />} /><SampleDataWarning /><DataTable title="Company comparison preview" /></AppShell>; }
