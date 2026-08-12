import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import { getTranche4PreviewModel } from "./preview-model";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:7:f092cabc7ccc56ceb407";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "b9a1c10ed0290d148962c9cfd11613424f6296c057d2065f63c459f924dd6d96";
// The published release is derived from the immutable Candidate 7 release
// bundle. This is a data trust root, not a release sequence or pointer hash.
export const TRANCHE4_INPUT_SET_HASH = "7701633b75816731d1d1470c2c0b6c2550456fa2bf2ed2a7d4abdf09fc0eb12f";
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
  // rather than displaying stale Candidate 7 observations.
  if (active.manifest.inputSetHash !== TRANCHE4_INPUT_SET_HASH) return null;
  const model = getTranche4PreviewModel();
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}
