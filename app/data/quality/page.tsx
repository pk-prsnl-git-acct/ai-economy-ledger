import type { Metadata } from "next";
import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation } from "@/components/data-release";
import { PublicQualitySummary } from "@/components/quality-observability";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/quality");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default function QualityPage() { return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><PublicQualitySummary /></AppShell>; }
