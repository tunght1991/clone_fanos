export type RuntimeEnvironment = 'development' | 'staging' | 'production';

export function normalizeRuntimeEnvironment(value: string | undefined): RuntimeEnvironment {
  switch ((value ?? 'development').toLowerCase()) {
    case 'development':
    case 'dev':
      return 'development';
    case 'staging':
    case 'stage':
      return 'staging';
    case 'production':
    case 'prod':
      return 'production';
    default:
      throw new Error(`Unsupported runtime environment: ${value}`);
  }
}

