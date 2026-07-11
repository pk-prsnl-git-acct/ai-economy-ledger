import { generateSnapshot } from "./snapshot.mjs";

export async function createDraftSnapshot(repository, options) {
  assertRepository(repository);
  const rows = await repository.loadPublicationRows({ methodologyVersion: options.methodologyVersion });
  const version = options.version ?? (await repository.nextSnapshotVersion(options.slug));
  const snapshot = generateSnapshot(rows, { ...options, version });
  await repository.saveDraftSnapshot(snapshot);
  return snapshot;
}

function assertRepository(repository) {
  for (const method of ["loadPublicationRows", "nextSnapshotVersion", "saveDraftSnapshot"]) {
    if (typeof repository?.[method] !== "function") throw new Error(`Publication repository requires ${method}()`);
  }
}
