import type { Metadata } from "next";

import { DataTrustSettingsPanel, ProtectedAdminPage } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";

const route = findAdminRoute("/admin/settings/data-trust");

export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";

export default function DataTrustSettingsPage() {
  return <ProtectedAdminPage route={route}><DataTrustSettingsPanel /></ProtectedAdminPage>;
}
