import { prisma } from "@convertr/db";
import { findPlanQuota, type PlanCode } from "@convertr/shared";

export const assertWithinQuota = async (
  organizationId: string,
  fileSizeMb: number
): Promise<{ allowed: boolean; reason?: string }> => {
  const subscription = await prisma.planSubscription.findUnique({
    where: { organizationId }
  });

  const planCode = (subscription?.planCode ?? "free") as PlanCode;
  const quota = findPlanQuota(planCode);

  if (fileSizeMb > quota.maxFileSizeMb) {
    return {
      allowed: false,
      reason: `File exceeds plan limit (${quota.maxFileSizeMb} MB).`
    };
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyUsage = await prisma.usageRecord.aggregate({
    where: {
      organizationId,
      metric: "jobs.created",
      period: currentMonth
    },
    _sum: { value: true }
  });

  const count = Number(monthlyUsage._sum.value ?? 0n);
  if (count >= quota.monthlyJobs) {
    return {
      allowed: false,
      reason: "Monthly job quota reached."
    };
  }

  return { allowed: true };
};
