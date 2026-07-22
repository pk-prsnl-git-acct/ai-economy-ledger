import type { Metadata } from "next";
import { UnavailableCoveragePage } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/compute-infra");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function ComputeInfraPage() { return <UnavailableCoveragePage route={route} blocker="No released compute-capacity, energy, data-centre, or infrastructure-commitment series." coverage="Infrastructure is represented by company taxonomy roles, not allocated infrastructure financial values." />; }
