import type { Metadata } from "next";

import { ProtectedAdminPage, TrustReviewDashboard } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";

const route = findAdminRoute("/admin/review");

export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";

export default function AdminReviewPage() {
  return <ProtectedAdminPage route={route}><TrustReviewDashboard /></ProtectedAdminPage>;
}
