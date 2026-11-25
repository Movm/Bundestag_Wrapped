import { describe, expect, it } from 'vitest';
import { env, envFromMeta } from './env';

describe('env', () => {
  it('reads Vite flags in the browser build', () => expect(env.DEV).toBe(import.meta.env.DEV));
  it('falls back to production-off when import.meta.env is missing', () => {
    expect(envFromMeta(undefined)).toEqual({ DEV: false, PROD: false });
  });
});
