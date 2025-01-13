import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Feature Flags
  ENABLE_BETA_FEATURES: z.enum(['true', 'false']).transform((v: string) => v === 'true'),
  ENABLE_ANALYTICS: z.enum(['true', 'false']).transform((v: string) => v === 'true'),

  // Version
  NEXT_PUBLIC_APP_VERSION: z.string(),
  NEXT_PUBLIC_BUILD_TIME: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
} 