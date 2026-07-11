import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";
const route = findAdminRoute("/admin/companies");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function AdminCompaniesPage() { return <AdminPlaceholderPage route={route} />; }
