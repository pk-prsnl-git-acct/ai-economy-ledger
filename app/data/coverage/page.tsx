import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation, ReleaseUnavailablePanel } from "@/components/data-release";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { getCoverage } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/coverage");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  let coverage;
  try {
    coverage = await getCoverage();
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><DataNavigation /><ReleaseUnavailablePanel surface="coverage" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><section className="release-metrics"><article className="panel release-stat"><span>Expected cells</span><strong>{coverage.expectedCellCount}</strong><small>Canonical matrix</small></article><article className="panel release-stat"><span>Covered</span><strong>{coverage.coveredNumerator}</strong><small>of {coverage.applicableDenominator} applicable</small></article><article className="panel release-stat"><span>Coverage</span><strong>{coverage.coveragePercentage === null ? "Not defined" : `${coverage.coveragePercentage}%`}</strong><small>{coverage.denominatorLimitationReason ?? "Limited denominator"}</small></article></section><section className="warning-banner coverage-limitation"><strong>Denominator limits</strong><span>{coverage.knownDenominatorLimitations.join(" ")}</span></section><section className="panel table-panel"><div className="panel-heading"><div><p className="panel-label">State distribution</p><h2>Coverage is not trust</h2></div><span className="badge">{coverage.pendingReviewCount} pending review</span></div><div className="coverage-state-grid">{Object.entries(coverage.countsByCoverageState).map(([state, count]) => <article key={state}><strong>{count}</strong><span>{state.replaceAll("_", " ")}</span></article>)}</div><div className="table-scroll"><table><thead><tr><th>Entity</th><th>Metric</th><th>Period</th><th>Source class</th><th>Coverage</th><th>Best trust</th></tr></thead><tbody>{coverage.cells.map((cell) => <tr key={cell.coverageCellId}><td>{cell.entityKey.replace("entity:company:", "")}</td><td>{cell.metricFamily.replaceAll("_", " ")}</td><td>{cell.fiscalPeriod}</td><td>{cell.sourceClass.replaceAll("_", " ")}</td><td><span className={`coverage-state coverage-${cell.coverageState}`}>{cell.coverageState.replaceAll("_", " ")}</span>{cell.limitation && <small>{cell.limitation}</small>}</td><td>{cell.bestTrustState?.replaceAll("_", " ") ?? "—"}</td></tr>)}</tbody></table></div></section></AppShell>;
}
