import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/downloads");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function DownloadsPage() { return <PlaceholderPage route={route} />; }
