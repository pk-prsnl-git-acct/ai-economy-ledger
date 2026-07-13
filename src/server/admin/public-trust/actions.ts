"use server";

import { getAdminSession } from "@/src/server/admin/session";
import { evaluateDecisionRequest, type ReviewAction } from "@/src/server/admin/public-trust/contract";

export type TrustActionState = { status: "idle" | "success" | "error"; message: string };

export async function submitTrustReviewDecision(formData: FormData): Promise<void> {
  const session = await getAdminSession("admin");
  if (session.status !== "authorized") {
    return;
  }

  try {
    evaluateDecisionRequest({
      action: String(formData.get("action")) as ReviewAction,
      reviewCaseId: String(formData.get("reviewCaseId")),
      reasonCode: String(formData.get("reasonCode")),
      expectedRecordVersion: String(formData.get("expectedRecordVersion")),
      expectedEvidenceVersion: String(formData.get("expectedEvidenceVersion")),
      policyVersion: String(formData.get("policyVersion")),
      idempotencyKey: String(formData.get("idempotencyKey")),
    });
  } catch (error) {
    void error;
  }
}
