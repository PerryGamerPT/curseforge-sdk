/**
 * Error thrown when a CurseForge request cannot be completed.
 */
export class CurseForgeSDKError extends Error {
  /**
   * HTTP status returned by the remote service, if available.
   */
  public readonly statusCode?: number;

  /**
   * Request path that failed.
   */
  public readonly path: string;

  /**
   * Parsed remote error payload or raw body.
   */
  public readonly payload?: unknown;

  /**
   * Retry hint expressed in milliseconds, if the server provided one.
   */
  public readonly retryAfterMs?: number;

  constructor(
    message: string,
    options: {
      readonly statusCode?: number;
      readonly path: string;
      readonly payload?: unknown;
      readonly retryAfterMs?: number;
      readonly cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "CurseForgeSDKError";
    this.statusCode = options.statusCode;
    this.path = options.path;
    this.payload = options.payload;
    this.retryAfterMs = options.retryAfterMs;
  }
}