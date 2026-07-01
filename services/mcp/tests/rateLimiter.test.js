import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../src/utils/rateLimiter.js';

describe('RateLimiter (token bucket)', () => {
  it('allows an immediate burst up to burstSize', async () => {
    const rl = new RateLimiter({ requestsPerMinute: 60, burstSize: 3 });
    expect(await rl.acquire()).toBe(true);
    expect(await rl.acquire()).toBe(true);
    expect(await rl.acquire()).toBe(true);
  });

  it('reports availability via canProceed', () => {
    const rl = new RateLimiter({ requestsPerMinute: 60, burstSize: 1 });
    expect(rl.canProceed()).toBe(true);
  });

  it('returns false when the required wait exceeds maxWaitTime', async () => {
    // 1 token, drained; refill is slow and maxWaitTime is tiny → cannot wait.
    const rl = new RateLimiter({ requestsPerMinute: 1, burstSize: 1, maxWaitTime: 5 });
    expect(await rl.acquire()).toBe(true); // consume the only token
    expect(await rl.acquire()).toBe(false); // would need ~60s, exceeds 5ms cap
    expect(rl.getStats().throttledRequests).toBe(1);
  });

  it('tracks request statistics', async () => {
    const rl = new RateLimiter({ requestsPerMinute: 600, burstSize: 2 });
    await rl.acquire();
    await rl.acquire();
    const stats = rl.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.maxTokens).toBe(2);
  });

  it('reset restores tokens and clears stats', async () => {
    const rl = new RateLimiter({ requestsPerMinute: 60, burstSize: 2 });
    await rl.acquire();
    rl.reset();
    expect(rl.getStats().totalRequests).toBe(0);
    expect(rl.canProceed()).toBe(true);
  });
});
