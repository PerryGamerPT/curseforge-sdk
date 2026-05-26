/**
 * Computes a full-jitter exponential backoff delay.
 */
export function computeJitteredBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponent = Math.max(0, attempt - 1);
  const cappedDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** exponent);
  return Math.floor(Math.random() * (cappedDelay + 1));
}

/**
 * Sleeps for the requested duration.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = (): void => {
      clearTimeout(timeout);
      reject(toError(signal?.reason));
    };

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeout);
        reject(toError(signal.reason));
        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function toError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }

  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}