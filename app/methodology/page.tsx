import type { Metadata } from "next";
import { AppShell, HeroSection } from "@/components/ledger";
import { ReleaseUnavailablePanel } from "@/components/data-release";
import { Methodology } from "@/components/release-trust";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/methodology");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function MethodologyPage() {
  let manifest;
  try {
    manifest = await getReleaseManifest(await currentReleaseId());
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="methodology" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><Methodology manifest={manifest} /></AppShell>;
}
