import type { Metadata } from "next";
import { ProtectedAdminPage, ReviewQueuePanel } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";
const route = findAdminRoute("/admin/review-queue");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default function ReviewQueuePage() { return <ProtectedAdminPage route={route}><ReviewQueuePanel /></ProtectedAdminPage>; }
