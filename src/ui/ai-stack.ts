import type { PublicRecord } from "@/src/server/data-releases/runtime";

export type LayerKey = "hardware" | "infrastructure" | "models" | "platforms" | "applications";

export type StackLayer = {
  key: LayerKey;
  name: string;
  description: string;
};

export const aiStackLayers: readonly StackLayer[] = [
  { key: "hardware", name: "Semiconductors & Hardware", description: "GPUs, accelerators, memory, networking, chip manufacturing and equipment." },
  { key: "infrastructure", name: "Cloud, Compute & Physical Infrastructure", description: "Hyperscale cloud, servers, data centres, networking, power, cooling and infrastructure capacity." },
  { key: "models", name: "Foundation Models", description: "Frontier models, open-weight models, multimodal systems and model APIs." },
  { key: "platforms", name: "AI Platforms, Data & Developer Tools", description: "Training, inference, orchestration, data tooling, observability, security and agent infrastructure." },
  { key: "applications", name: "Applications & Distribution", description: "Enterprise applications, coding tools, vertical AI, consumer AI and products distributing AI to end users." },
] as const;

export type CompanyStackRole = {
  primary: LayerKey;
  secondary: readonly LayerKey[];
};

// Product taxonomy only. It never allocates company-wide revenue or capex to a layer.
export const companyStackRoles: Readonly<Record<string, CompanyStackRole>> = {
  "entity:company:alphabet": { primary: "applications", secondary: ["models"] },
  "entity:company:amazon": { primary: "infrastructure", secondary: ["applications"] },
  "entity:company:meta": { primary: "applications", secondary: ["models"] },
  "entity:company:microsoft": { primary: "infrastructure", secondary: ["platforms"] },
  "entity:company:nvidia": { primary: "hardware", secondary: [] },
};

export function stackRoleFor(entityKey: string): CompanyStackRole | null {
  return companyStackRoles[entityKey] ?? null;
}

export function stackLayerName(layerKey: LayerKey) {
  return aiStackLayers.find((layer) => layer.key === layerKey)?.name ?? "Not classified";
}

export type LayerSummary = StackLayer & {
  companies: string[];
  primaryObservationCount: number;
  metricFamilies: string[];
  sourceCount: number;
  limitation: string;
  expansionState: string;
  status: "covered" | "partially covered" | "not yet covered";
};

export function summarizeAiStack(records: readonly PublicRecord[]): LayerSummary[] {
  const companiesByKey = new Map<string, string>();
  for (const record of records) companiesByKey.set(record.entity.entityKey, record.entity.displayName);

  return aiStackLayers.map((layer) => {
    const companyKeys = [...companiesByKey.keys()].filter((entityKey) => {
      const role = stackRoleFor(entityKey);
      return role?.primary === layer.key || role?.secondary.includes(layer.key) === true;
    });
    const primaryObservationCount = records.filter((record) => stackRoleFor(record.entity.entityKey)?.primary === layer.key).length;
    const primaryRecords = records.filter((record) => stackRoleFor(record.entity.entityKey)?.primary === layer.key);
    const metricFamilies = [...new Set(primaryRecords.map((record) => record.metric.metricFamily.replaceAll("_", " ")))].sort();
    const sourceCount = new Set(primaryRecords.flatMap((record) => record.sources.map((source) => source.sourceKey))).size;
    const status = primaryObservationCount > 0
      ? "covered"
      : companyKeys.length > 0
        ? "partially covered"
        : "not yet covered";
    const limitation = status === "covered"
      ? "Company-wide values remain unallocated across AI-stack layers."
      : status === "partially covered"
        ? "Companies have a taxonomy role, but this release has no primary-layer financial observation."
        : "No production observations are available for this layer in the current release.";
    const expansionState = status === "covered" ? "Expand company and metric coverage" : "Await official-source coverage";
    return { ...layer, companies: companyKeys.map((key) => companiesByKey.get(key)!).sort(), primaryObservationCount, metricFamilies, sourceCount, limitation, expansionState, status };
  });
}
