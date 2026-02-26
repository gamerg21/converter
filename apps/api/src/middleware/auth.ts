import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import { prisma } from "@convertr/db";

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  viaApiKey: boolean;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const DEV_CONTEXT: AuthContext = {
  userId: "00000000-0000-0000-0000-000000000001",
  organizationId: "11111111-1111-1111-1111-111111111111",
  role: "OWNER",
  viaApiKey: false
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.header("x-api-key");
  const bearer = req.header("authorization");

  if (apiKey) {
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
    const key = await prisma.apiKey.findFirst({
      where: {
        hashedKey,
        revokedAt: null
      }
    });
    if (!key) {
      res.status(401).json({ error: "Invalid API key." });
      return;
    }
    req.auth = {
      userId: key.userId,
      organizationId: key.organizationId,
      role: "MEMBER",
      viaApiKey: true
    };
    next();
    return;
  }

  if (!bearer && process.env.NODE_ENV === "production") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.auth = DEV_CONTEXT;
  next();
};
