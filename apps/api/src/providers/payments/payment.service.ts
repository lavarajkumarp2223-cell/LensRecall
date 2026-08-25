/**
 * PaymentService — Abstract interface for payment/subscription operations.
 *
 * Concrete adapters:
 * - StripePaymentAdapter
 * - MockPaymentAdapter (development)
 *
 * This abstraction wraps Stripe's API so that:
 * 1. Business logic never directly calls Stripe SDK
 * 2. The provider can be swapped without touching billing logic
 * 3. Tests can use the mock adapter
 */
export interface CreateSubscriptionParams {
  organizationId: string;
  externalCustomerId: string;
  planId: string;
  trialDays?: number;
}

export interface PaymentCustomer {
  externalCustomerId: string;
  email: string;
  name: string;
}

export interface SubscriptionInfo {
  externalSubscriptionId: string;
  externalCustomerId: string;
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface UsageRecord {
  organizationId: string;
  period: string;
  metrics: Record<string, number>;
}

export abstract class PaymentService {
  abstract createCustomer(params: {
    organizationId: string;
    email: string;
    name: string;
  }): Promise<PaymentCustomer>;

  abstract createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<SubscriptionInfo>;

  abstract cancelSubscription(externalSubscriptionId: string): Promise<void>;

  abstract getSubscription(
    externalSubscriptionId: string,
  ): Promise<SubscriptionInfo | null>;

  abstract recordUsage(
    externalSubscriptionId: string,
    metric: string,
    quantity: number,
  ): Promise<void>;

  abstract createCheckoutSession(params: {
    organizationId: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string }>;

  abstract handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ type: string; data: unknown }>;
}
