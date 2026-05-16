import { normalizeRuntimeEnvironment } from '../../config/runtime-env.js';
import type {
  SubscriptionBillingMode,
  SubscriptionBillingProvider,
  SubscriptionPolicy,
  SubscriptionRuntimeConfig,
} from './subscription.types.js';

const DEFAULT_PROVIDER_BY_ENV: Record<string, SubscriptionBillingProvider> = {
  development: 'WEB_GATEWAY',
  staging: 'WEB_GATEWAY',
  production: 'IAP',
};

const DEFAULT_MODE_BY_ENV: Record<string, SubscriptionBillingMode> = {
  development: 'SANDBOX',
  staging: 'SANDBOX',
  production: 'LIVE',
};

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

export function buildSubscriptionPolicy(config: SubscriptionRuntimeConfig): SubscriptionPolicy {
  const environment = normalizeRuntimeEnvironment(config.environment);
  const provider = normalizeProvider(config.provider) ?? DEFAULT_PROVIDER_BY_ENV[environment] ?? DEFAULT_PROVIDER_BY_ENV.development;
  const billingMode = normalizeMode(config.billingMode) ?? DEFAULT_MODE_BY_ENV[environment] ?? DEFAULT_MODE_BY_ENV.development;
  const allowSandbox = environment !== 'production';

  if (!provider) {
    throw new Error('Subscription provider could not be resolved');
  }

  if (!billingMode) {
    throw new Error('Subscription billing mode could not be resolved');
  }

  if (environment === 'production') {
    if (!config.provider) {
      throw new Error('SUBSCRIPTION_PROVIDER is required in production');
    }

    if (billingMode === 'SANDBOX') {
      throw new Error('Subscription billing mode SANDBOX is forbidden in production');
    }
  }

  if (billingMode === 'SANDBOX' && environment === 'production') {
    throw new Error('Sandbox billing mode is not allowed in production');
  }

  return {
    environment,
    provider,
    billingMode,
    allowSandbox,
  };
}

export function isSandboxAllowed(policy: SubscriptionPolicy): boolean {
  return policy.allowSandbox;
}
