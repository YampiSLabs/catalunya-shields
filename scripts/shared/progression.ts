const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const selectRotatingBatch = <T>(
  items: readonly T[],
  limit: number,
  now: Date = new Date(),
) => {
  const batchSize = Math.min(items.length, Math.max(0, Math.floor(limit)));
  if (batchSize === 0) return { items: [] as T[], startIndex: 0 };

  const dayNumber = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      MILLISECONDS_PER_DAY,
  );
  const startIndex =
    batchSize === items.length ? 0 : (dayNumber * batchSize) % items.length;
  const batch = Array.from(
    { length: batchSize },
    (_, index) => items[(startIndex + index) % items.length],
  );

  return { items: batch, startIndex };
};
