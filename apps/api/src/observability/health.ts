import { prisma } from "@convertr/db";

export const checkHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown health check error"
    };
  }
};
