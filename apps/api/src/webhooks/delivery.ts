import { prisma } from "@convertr/db";
import { signPayload } from "./signer";

export const deliverJobEvent = async (
  organizationId: string,
  event: string,
  payload: Record<string, unknown>
) => {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      organizationId,
      disabledAt: null,
      events: { has: event }
    }
  });

  const serialized = JSON.stringify({ event, payload, createdAt: new Date().toISOString() });

  return Promise.all(
    endpoints.map(async (endpoint) => {
      const signature = signPayload(serialized, endpoint.secret);
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-signature": signature
            },
            body: serialized
          });
          if (response.ok) {
            return {
              endpointId: endpoint.id,
              signature,
              delivered: true,
              attempt
            };
          }
        } catch {
          // Retry below.
        }
      }
      return {
        endpointId: endpoint.id,
        signature,
        delivered: false,
        attempt: 3
      };
    })
  );
};
