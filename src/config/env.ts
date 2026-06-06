import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  jwtSecret: process.env.JWT_SECRET || 'atlas-super-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '1h',
  mfaTokenExpiry: process.env.MFA_TOKEN_EXPIRY || '5m',

  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || 'atlas-internal-service-key',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
