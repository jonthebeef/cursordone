import { describe, it, expect, beforeAll } from 'vitest';
import { validateEnv } from './env';
import dotenv from 'dotenv';
import path from 'path';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    // Reset env before loading test values
    process.env = { ...originalEnv };
    
    // Load test environment variables
    dotenv.config({
      path: path.resolve(process.cwd(), '.env.test')
    });
  });

  it('should validate environment variables successfully', () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it('should have correct environment values', () => {
    const env = validateEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://localhost:54321');
    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:3000');
    expect(env.ENABLE_BETA_FEATURES).toBe(true);
    expect(env.ENABLE_ANALYTICS).toBe(false);
  });
}); 