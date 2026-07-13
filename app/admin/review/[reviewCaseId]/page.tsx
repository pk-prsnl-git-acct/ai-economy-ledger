import type { Metadata } from "next";

import { ProtectedAdminPage, TrustReviewDetail } from "@/components/admin";
import { routeMetadata } from "@/src/ui/metadata";
import { findAdminRoute } from "@/src/ui/site-map";

const route = findAdminRoute("/admin/review");

export const metadata: Metadata = routeMetadata("Review case", "Inspect safe evidence and decide one review case.", route.href);
export const dynamic = "force-dynamic";

export default async function AdminReviewDetailPage({ params }: { params: Promise<{ reviewCaseId: string }> }) {
  const { reviewCaseId } = await params;
  return <ProtectedAdminPage route={route}><TrustReviewDetail reviewCaseId={decodeURIComponent(reviewCaseId)} /></ProtectedAdminPage>;
}
