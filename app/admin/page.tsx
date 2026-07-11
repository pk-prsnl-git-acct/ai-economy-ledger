import type { Metadata } from "next";
import { AdminToolPanel, ProtectedAdminPage, ReviewQueuePanel } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";
const route = findAdminRoute("/admin");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default function AdminPage() { return <ProtectedAdminPage route={route}><ReviewQueuePanel /><AdminToolPanel route={route} /></ProtectedAdminPage>; }
