import type { Metadata } from "next";
import { AppShell, ConfidenceBadge, HeroSection, SampleDataWarning, SourceLink } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/methodology");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
const principles = [["Gross is not net", "Related-party revenue, circular flows, transfers, and excluded low-confidence values must remain visible."], ["Evidence before precision", "Reported, confirmed, estimated, and sample states are never silently blended."], ["Versions are part of the result", "Every future published metric will identify the methodology version used to calculate it."]];
export default function MethodologyPage() { return <AppShell><HeroSection route={route} /><SampleDataWarning /><section className="method-grid"><article className="panel equation-card"><p className="panel-label">Core equation · preview</p><h2>Adjusted external flow</h2><p className="equation">gross flow − related-party flow − circular or vendor-financed flow − excluded low-confidence values</p><ConfidenceBadge /></article>{principles.map(([title, copy]) => <article className="panel method-card" key={title}><h2>{title}</h2><p>{copy}</p><SourceLink href="/sources">Source policy</SourceLink></article>)}</section></AppShell>; }
