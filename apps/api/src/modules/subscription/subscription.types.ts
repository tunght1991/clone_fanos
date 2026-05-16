import type { RuntimeEnvironment } from '../../config/runtime-env.js';

export type SubscriptionBillingProvider = 'IAP' | 'GOOGLE_PLAY' | 'WEB_GATEWAY';

export type SubscriptionBillingMode = 'LIVE' | 'SANDBOX';

export interface SubscriptionRuntimeConfig {
  environment: RuntimeEnvironment;
  provider?: SubscriptionBillingProvider;
  billingMode?: SubscriptionBillingMode;
  webhookSecret?: string;
}

export interface SubscriptionPolicy {
  environment: RuntimeEnvironment;
  provider: SubscriptionBillingProvider;
  billingMode: SubscriptionBillingMode;
  allowSandbox: boolean;
}

