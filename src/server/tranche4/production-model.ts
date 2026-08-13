import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import { getTranche4PreviewModel } from "./preview-model";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:8:4a293cead8f3d491c723";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf";
// The published release is derived from the immutable Candidate 8 release
// bundle. This is a data trust root, not a release sequence or pointer hash.
export const TRANCHE4_INPUT_SET_HASH = "82a1b14fba34df5ac40e30eafeb5bab167018289a5567732c26544e5a9b76e95";
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

export async function getTranche4ProductionModelIfActive() {
  const active = await activeReleaseState();
  // The richer Set 1 surfaces may only use these embedded immutable bytes when
  // the live, validated release explicitly declares the same input trust root.
  // A successor release therefore falls back to the release-artifact surfaces
  // rather than displaying stale Candidate 8 observations.
  if (active.manifest.inputSetHash !== TRANCHE4_INPUT_SET_HASH) return null;
  const model = getTranche4PreviewModel();
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}
