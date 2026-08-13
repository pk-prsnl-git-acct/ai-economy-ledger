import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import {
  getRelease11CompanyModel,
  getRelease11ObservationPage,
  getRelease11SummaryModel,
  getRelease11TrendsModel
} from "./production-presentation";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:8:4a293cead8f3d491c723";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf";
// The published release is derived from the immutable Candidate 8 release
// bundle. This is a data trust root, not a release sequence or pointer hash.
// Exact immutable input root declared by the published Release 11 manifest.
// Successor releases must continue to fall back unless explicitly rebound.
export const TRANCHE4_INPUT_SET_HASH = "e0466b671f316b7642db9409f243630c8149f8f064b55dd641b5da9f05aa9686";
async function activeReleaseState() {
  const transport = await getProductionReleaseTransport();
  if (transport) {
    const { index, manifest } = await transport.manifest();
    return { releaseId: index.releaseId, manifest };
  }

  const releaseId = await currentReleaseId();
  const manifest = await getReleaseManifest(releaseId);
  return { releaseId, manifest };
}

async function activeReleaseMatchesCandidate8() {
  const active = await activeReleaseState();
  // The richer Set 1 surfaces may only use these embedded immutable bytes when
  // the live, validated release explicitly declares the same input trust root.
  // A successor release therefore falls back to the release-artifact surfaces
  // rather than displaying stale Candidate 8 observations.
  if (active.manifest.inputSetHash !== TRANCHE4_INPUT_SET_HASH) return null;
  return active;
}

export async function getTranche4ProductionModelIfActive(scope: "summary" | "trends" | { company: string } = "summary") {
  const active = await activeReleaseMatchesCandidate8();
  if (!active) return null;
  const model = scope === "trends"
    ? await getRelease11TrendsModel()
    : typeof scope === "object"
      ? await getRelease11CompanyModel(scope.company)
      : await getRelease11SummaryModel();
  if (!model) return null;
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}

export async function getTranche4ProductionObservationPageIfActive(page: number, query: string) {
  const active = await activeReleaseMatchesCandidate8();
  if (!active) return null;
  return { releaseId: active.releaseId, result: await getRelease11ObservationPage(page, query) };
}
