import "server-only";
import Stripe from "stripe";
import { getOrderServerEnv } from "@/lib/env";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) return client;
  client = new Stripe(getOrderServerEnv().stripeSecretKey);
  return client;
}
