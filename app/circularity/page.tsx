import type { Metadata } from "next";
import { UnavailableCoveragePage } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/circularity");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function CircularityPage() { return <UnavailableCoveragePage route={route} blocker="No released, evidence-bound directed economic relationships are available for circular-flow analysis." coverage="Company observations stay separate; no circularity or adjusted-flow total is calculated." />; }
