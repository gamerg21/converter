import crypto from "node:crypto";

export const signPayload = (payload: string, secret: string): string =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

export const verifySignature = (payload: string, secret: string, signature: string): boolean =>
  signPayload(payload, secret) === signature;
