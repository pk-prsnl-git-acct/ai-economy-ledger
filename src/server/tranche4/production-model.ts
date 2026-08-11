import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import { getTranche4PreviewModel } from "./preview-model";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:5:22c376de052a7c06938f";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "69400dbb8629ac0d86e71e71f6fd5221d11a9c087bbde93d8d1ef2ddc09984ff";
export const TRANCHE4_RELEASE_MANIFEST_HASH = "e09ff5bee463c3cfdf6959f672d3569772f0f91051af5451766c9aac459cf019";

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
  if (active.manifestHash !== TRANCHE4_RELEASE_MANIFEST_HASH) return null;
  const model = getTranche4PreviewModel();
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}
