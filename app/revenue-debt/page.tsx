import type { Metadata } from "next";
import { UnavailableCoveragePage } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/revenue-debt");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function RevenueDebtPage() { return <UnavailableCoveragePage route={route} blocker="Debt, obligations, and financing disclosures are not sufficiently represented for comparable analysis." coverage="Revenue observations are available for selected companies; mixed financial values are not aggregated." />; }
