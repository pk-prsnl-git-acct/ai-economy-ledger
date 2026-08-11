import "server-only";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport } from "@/src/server/data-releases/production-transport";
import { getTranche4PreviewModel } from "./preview-model";

export const TRANCHE4_CANDIDATE_ID = "set1-candidate:4:98e01aa3e082045d3fa6";
export const TRANCHE4_CANDIDATE_MANIFEST_HASH = "d5cc03bef9dd6b2a045d6352a8ff54af36ffa8cc40f12a495437d2028b73a177";

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
  if (active.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) return null;
  const model = getTranche4PreviewModel();
  if (model.manifest.candidateId !== TRANCHE4_CANDIDATE_ID || model.manifest.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH) {
    throw new Error("Tranche 4 production model rejected: candidate trust root mismatch");
  }
  return { releaseId: active.releaseId, model };
}
