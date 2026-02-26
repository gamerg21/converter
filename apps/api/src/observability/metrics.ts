const counters = new Map<string, number>();

export const incrementMetric = (name: string, by = 1): void => {
  counters.set(name, (counters.get(name) ?? 0) + by);
};

export const snapshotMetrics = (): Record<string, number> => Object.fromEntries(counters.entries());
