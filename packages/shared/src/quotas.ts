export type PlanCode = "free" | "pro" | "enterprise";

export type PlanQuota = {
  code: PlanCode;
  maxFileSizeMb: number;
  monthlyJobs: number;
  priorityQueue: boolean;
};

export const defaultPlanQuotas: PlanQuota[] = [
  { code: "free", maxFileSizeMb: 50, monthlyJobs: 100, priorityQueue: false },
  { code: "pro", maxFileSizeMb: 500, monthlyJobs: 5000, priorityQueue: true },
  {
    code: "enterprise",
    maxFileSizeMb: 2048,
    monthlyJobs: 100000,
    priorityQueue: true
  }
];

export const findPlanQuota = (code: PlanCode): PlanQuota =>
  defaultPlanQuotas.find((plan) => plan.code === code) ?? defaultPlanQuotas[0];
