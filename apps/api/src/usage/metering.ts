import { prisma } from "@convertr/db";

export const recordUsage = async (
  organizationId: string,
  metric: string,
  value: bigint,
  period: string
) => {
  return prisma.usageRecord.create({
    data: {
      organizationId,
      metric,
      value,
      period
    }
  });
};

export const getUsageSummary = async (organizationId: string) => {
  const rows = await prisma.usageRecord.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return rows.reduce<Record<string, bigint>>((acc, row) => {
    acc[row.metric] = (acc[row.metric] ?? 0n) + row.value;
    return acc;
  }, {});
};
