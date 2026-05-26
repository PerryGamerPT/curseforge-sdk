import { sleep } from "../utils/backoff.js";

interface Waiter {
  readonly resolve: () => void;
  readonly reject: (reason: unknown) => void;
  readonly signal?: AbortSignal;
}

/**
 * FIFO token-bucket limiter for outbound requests.
 */
export class TokenBucketLimiter {
  private tokens: number;

  private lastRefillAt: number;

  private readonly maxTokens: number;

  private refillTokensPerSecond: number;

  private pauseUntilAt = 0;

  private readonly waiters: Waiter[] = [];

  private processing = false;

  constructor(maxTokens: number, refillTokensPerSecond: number) {
    this.maxTokens = Math.max(1, maxTokens);
    this.refillTokensPerSecond = Math.max(0.1, refillTokensPerSecond);
    this.tokens = this.maxTokens;
    this.lastRefillAt = Date.now();
  }

  /**
   * Acquires a single token before a request is sent.
   */
  public async acquire(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException("Aborted", "AbortError");
    }

    return new Promise<void>((resolve, reject) => {
      this.waiters.push({ resolve, reject, signal });
      void this.processQueue();
    });
  }

  /**
   * Updates the limiter using observed response headers.
   */
  public updateFromHeaders(headers: Headers): void {
    const remaining = parseHeaderNumber(headers.get("x-ratelimit-remaining"));
    const limit = parseHeaderNumber(headers.get("x-ratelimit-limit"));
    const reset = parseHeaderNumber(headers.get("x-ratelimit-reset"));

    if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
      this.refillTokensPerSecond = limit;
      this.tokens = Math.min(this.tokens, limit);
    }

    if (typeof remaining === "number" && Number.isFinite(remaining)) {
      this.tokens = Math.max(0, Math.min(this.maxTokens, remaining));
    }

    if (typeof reset === "number" && Number.isFinite(reset) && reset > 0) {
      const resetAt = reset > 10_000_000_000 ? reset : reset * 1000;
      this.pauseUntilAt = Math.max(this.pauseUntilAt, resetAt);
    }
  }

  /**
   * Pauses the bucket until the provided timestamp.
   */
  public pauseUntil(timestampMs: number): void {
    this.pauseUntilAt = Math.max(this.pauseUntilAt, timestampMs);
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.waiters.length > 0) {
        const current = this.waiters[0];

        if (current.signal?.aborted) {
          current.reject(current.signal.reason ?? new DOMException("Aborted", "AbortError"));
          this.waiters.shift();
          continue;
        }

        this.refillTokens();

        const pauseMs = Math.max(0, this.pauseUntilAt - Date.now());
        if (pauseMs > 0) {
          await sleep(pauseMs, current.signal);
          continue;
        }

        if (this.tokens >= 1) {
          this.tokens -= 1;
          this.waiters.shift();
          current.resolve();
          continue;
        }

        const deficit = 1 - this.tokens;
        const waitMs = Math.ceil((deficit / this.refillTokensPerSecond) * 1000);
        await sleep(Math.max(1, waitMs), current.signal);
      }
    } catch (error) {
      const current = this.waiters.shift();
      current?.reject(error);
    } finally {
      this.processing = false;

      if (this.waiters.length > 0) {
        void this.processQueue();
      }
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - this.lastRefillAt) / 1000);

    if (elapsedSeconds <= 0) {
      return;
    }

    const refillAmount = elapsedSeconds * this.refillTokensPerSecond;
    this.tokens = Math.min(this.maxTokens, this.tokens + refillAmount);
    this.lastRefillAt = now;
  }
}

function parseHeaderNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}