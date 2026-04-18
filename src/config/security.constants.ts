export const SECURITY_CONFIG = {
  JWT: {
    ACCESS_TOKEN_EXPIRY: '1h',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256',
  },
  ENCRYPTION: {
    ALGORITHM: 'aes-256-cbc',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
  },
  RATE_LIMIT: {
    AUTH_TTL: 60000,
    AUTH_LIMIT: 10,
    API_TTL: 60000,
    API_LIMIT: 100,
  },
  HEADERS: {
    CONTENT_SECURITY_POLICY: "default-src 'self'",
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_FRAME_OPTIONS: 'DENY',
    X_XSS_PROTECTION: '1; mode=block',
    STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains',
  },
  PASSWORD: {
    SALT_ROUNDS: 10,
    MIN_LENGTH: 8,
  },
} as const;

export const SENSITIVE_FIELDS = [
  'password',
  'refreshToken',
  'CPF',
  'CNPJ',
  'CRM',
  'COREN',
  'susCard',
  'allergies',
  'medications',
  'medicalConditions',
  'description',
  'observations',
] as const;

export const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/api/docs',
  '/api/docs-json',
] as const;
