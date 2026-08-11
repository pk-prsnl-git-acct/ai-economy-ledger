import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import { getTranche4PreviewModel } from "./preview-model";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:5:22c376de052a7c06938f";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "69400dbb8629ac0d86e71e71f6fd5221d11a9c087bbde93d8d1ef2ddc09984ff";
export const TRANCHE4_RELEASE_ID = "dataset-release:7:2d982c6f2229e4b352a7";
export const TRANCHE4_RELEASE_MANIFEST_HASH = "b1ae3af7c0e4ddfbab83e27bd92e684d69d2c276123012db6d584ccebf419a90";

async function activeReleaseState() {
  const transport = await getProductionReleaseTransport();
  if (transport) {
    const index = await transport.index();
    return { releaseId: index.releaseId, manifestHash: index.manifestHash };
  }

  const releaseId = await currentReleaseId();
  const manifest = await getReleaseManifest(releaseId);
  const manifestHash = "manifestHash" in manifest ? String(manifest.manifestHash) : null;
  return { releaseId, manifestHash };
}

export async function getTranche4ProductionModelIfActive() {
  const active = await activeReleaseState();
  if (active.releaseId !== TRANCHE4_RELEASE_ID || active.manifestHash !== TRANCHE4_RELEASE_MANIFEST_HASH) return null;
  const model = getTranche4PreviewModel();
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}
