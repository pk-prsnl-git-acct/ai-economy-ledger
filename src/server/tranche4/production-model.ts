import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import { getTranche4PreviewModel } from "./preview-model";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:5:22c376de052a7c06938f";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "69400dbb8629ac0d86e71e71f6fd5221d11a9c087bbde93d8d1ef2ddc09984ff";
// The published release is derived from the immutable Candidate 5 release
// bundle. This is a data trust root, not a release sequence or pointer hash.
export const TRANCHE4_INPUT_SET_HASH = "5a94eea842374f9222121a95abc5d97236729076048050a87c337ec9acff85fd";
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
  // rather than displaying stale Candidate 5 observations.
  if (active.manifest.inputSetHash !== TRANCHE4_INPUT_SET_HASH) return null;
  const model = getTranche4PreviewModel();
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}
