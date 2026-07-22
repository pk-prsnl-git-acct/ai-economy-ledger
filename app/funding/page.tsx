import type { Metadata } from "next";
import { UnavailableCoveragePage } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/funding");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function FundingPage() { return <UnavailableCoveragePage route={route} blocker="No released financing events, terms, or evidence-bound capital-flow relationships." coverage="Current release covers company revenue and capital expenditure only." />; }
