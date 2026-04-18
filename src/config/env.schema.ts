export const ENV_SCHEMA = {
  DATABASE_URL: {
    type: 'string',
    required: true,
    description: 'PostgreSQL connection string',
  },
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'Secret key for JWT access tokens (min 32 chars)',
  },
  JWT_REFRESH_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'Secret key for JWT refresh tokens (min 32 chars)',
  },
  ENCRYPTION_KEY: {
    type: 'string',
    required: true,
    minLength: 64,
    description: 'AES-256 encryption key (32 bytes hex encoded = 64 hex chars)',
  },
  PORT: {
    type: 'number',
    required: false,
    default: 3000,
    description: 'Server port',
  },
  NODE_ENV: {
    type: 'string',
    required: false,
    default: 'development',
    enum: ['development', 'production', 'test'],
    description: 'Environment',
  },
} as const;

export type EnvConfig = {
  [key: string]: {
    type: string;
    required: boolean;
    default?: unknown;
    minLength?: number;
    enum?: string[];
    description: string;
    validate?: (value: string) => boolean;
  };
};

export function validateEnv(): void {
  const errors: string[] = [];

  for (const [key, config] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];
    const configObj = config as {
      required: boolean;
      minLength?: number;
      enum?: string[];
      validate?: (value: string) => boolean;
    };

    if (configObj.required && !value) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value && configObj.minLength && value.length < configObj.minLength) {
      errors.push(`${key} must be at least ${configObj.minLength} characters`);
    }

    if (value && configObj.validate && !configObj.validate(value)) {
      errors.push(`${key} has invalid format`);
    }

    if (value && configObj.enum && !configObj.enum.includes(value)) {
      errors.push(`${key} must be one of: ${configObj.enum.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

export function getEnvOrDefault<T>(key: string, defaultValue: T): T {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value as unknown as T;
}
