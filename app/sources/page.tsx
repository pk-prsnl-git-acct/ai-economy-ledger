import type { Metadata } from "next";
import { AppShell, ConfidenceBadge, HeroSection, SampleDataWarning } from "@/components/ledger";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/sources");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
const sourceTypes = [["Official filing", "Preferred primary evidence", "High"], ["Earnings material", "Corroborated company evidence", "High"], ["Company press release", "Claim requiring context", "Medium"], ["Reputable news report", "Discovery or secondary evidence", "Medium"]] as const;
export default function SourcesPage() { return <AppShell><HeroSection route={route} /><SampleDataWarning /><section className="panel table-panel"><div className="panel-heading"><div><p className="panel-label">Registry preview</p><h2>Source confidence policy</h2></div></div><div className="table-scroll"><table><thead><tr><th>Source type</th><th>Intended use</th><th>Default confidence</th></tr></thead><tbody>{sourceTypes.map(([type, use, confidence]) => <tr key={type}><td>{type}</td><td>{use}</td><td><ConfidenceBadge level={confidence} /></td></tr>)}</tbody></table></div></section></AppShell>; }
