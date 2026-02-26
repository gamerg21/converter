import Stripe from "stripe";
import { env } from "../config/env";
import { prisma } from "@convertr/db";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (organizationId: string, priceId: string) => {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: "http://localhost:3000/billing?success=1",
    cancel_url: "http://localhost:3000/billing?canceled=1",
    metadata: { organizationId }
  });
};

export const reconcileSubscriptionFromWebhook = async (
  stripeSubscriptionId: string,
  planCode: string,
  status: string
) => {
  const existing = await prisma.planSubscription.findFirst({
    where: { stripeSubscriptionId }
  });

  if (!existing) return null;
  return prisma.planSubscription.update({
    where: { id: existing.id },
    data: {
      planCode,
      status
    }
  });
};
