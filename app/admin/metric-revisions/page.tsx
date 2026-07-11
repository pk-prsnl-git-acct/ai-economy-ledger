import type { Metadata } from "next";
import { AdminToolPanel, ProtectedAdminPage } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";
const route = findAdminRoute("/admin/metric-revisions");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default function MetricRevisionsPage() { return <ProtectedAdminPage route={route}><AdminToolPanel route={route} /></ProtectedAdminPage>; }
