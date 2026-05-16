import type {
  SubscriptionBillingMode,
  SubscriptionBillingProvider,
  SubscriptionRuntimeConfig,
} from '../modules/subscription/subscription.types.js';
import { normalizeRuntimeEnvironment } from './runtime-env.js';

function normalizeProvider(value: string | undefined): SubscriptionBillingProvider | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case 'IAP':
    case 'GOOGLE_PLAY':
    case 'WEB_GATEWAY':
      return value.toUpperCase() as SubscriptionBillingProvider;
    default:
      throw new Error(`Unsupported subscription provider: ${value}`);
  }
}

function normalizeMode(value: string | undefined): SubscriptionBillingMode | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case 'LIVE':
    case 'SANDBOX':
      return value.toUpperCase() as SubscriptionBillingMode;
    default:
      throw new Error(`Unsupported subscription billing mode: ${value}`);
  }
}

export function readSubscriptionRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): SubscriptionRuntimeConfig {
  return {
    environment: normalizeRuntimeEnvironment(env.NODE_ENV ?? env.APP_ENV),
    provider: normalizeProvider(env.SUBSCRIPTION_PROVIDER),
    billingMode: normalizeMode(env.SUBSCRIPTION_BILLING_MODE),
    webhookSecret: env.SUBSCRIPTION_WEBHOOK_SECRET,
  };
}

