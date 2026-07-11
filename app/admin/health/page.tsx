import type { Metadata } from "next";
import { AdminHealthPanel, ProtectedAdminPage } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";
const route = findAdminRoute("/admin/health");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default function AdminHealthPage() { return <ProtectedAdminPage route={route}><AdminHealthPanel /></ProtectedAdminPage>; }
