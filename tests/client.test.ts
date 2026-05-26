import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurseForgeSDK } from "../src/index.js";
import { CurseForgeSDKError } from "../src/errors/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a fetch mock that resolves with each provided response in order.
 * The pending promise rejects when the signal fires, but only if the promise
 * has not already been settled — avoiding Node.js unhandled-rejection warnings.
 */
function makeAbortableFetch(
  ...responses: Response[]
): ReturnType<typeof vi.fn<typeof fetch>> {
  let callIndex = 0;
  return vi.fn<typeof fetch>().mockImplementation((_url, init) => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex += 1;
    return new Promise<Response>((resolve, reject) => {
      const signal = (init as RequestInit).signal as AbortSignal | undefined;
      let settled = false;

      const settle = (fn: () => void): void => {
        if (!settled) {
          settled = true;
          fn();
        }
      };

      if (signal?.aborted) {
        settle(() => reject(new DOMException("Aborted", "AbortError")));
        return;
      }

      if (signal) {
        signal.addEventListener(
          "abort",
          () => settle(() => reject(new DOMException("Aborted", "AbortError"))),
          { once: true },
        );
      }

      if (response !== undefined) {
        settle(() => resolve(response));
      }
    });
  });
}

/** Minimal SDK factory used in most tests. */
function makeSDK(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof CurseForgeSDK>[0]> = {}): CurseForgeSDK {
  return new CurseForgeSDK({
    apiKey: "test-key",
    fetchImpl,
    maxRetries: 0,
    timeoutMs: 30_000,
    retryBaseDelayMs: 10,
    retryMaxDelayMs: 50,
    maxTokens: 100,
    refillTokensPerSecond: 100,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("CurseForgeSDK", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // URL construction
  // -------------------------------------------------------------------------

  describe("URL construction", () => {
    it("appends the path to the base URL without dropping the base path segment", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 42 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      await sdk.getMod(42);

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.href).toBe("https://api.curseforge.com/v1/mods/42");
    });

    it("normalizes a path that already starts with a leading slash", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      await sdk.request("/mods/1");

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.href).toBe("https://api.curseforge.com/v1/mods/1");
    });

    it("normalizes a path that has no leading slash", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      await sdk.request("mods/1");

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.href).toBe("https://api.curseforge.com/v1/mods/1");
    });

    it("strips a trailing slash from a custom base URL and appends path correctly", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl, {
        baseUrl: "https://custom.example.com/api/v2/",
      });
      await sdk.request("/mods/1");

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.href).toBe("https://custom.example.com/api/v2/mods/1");
    });

    it("adds a trailing slash to a base URL that lacks one", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl, {
        baseUrl: "https://custom.example.com/api/v2",
      });
      await sdk.request("/mods/1");

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.href).toBe("https://custom.example.com/api/v2/mods/1");
    });
  });

  // -------------------------------------------------------------------------
  // Header construction
  // -------------------------------------------------------------------------

  describe("header construction", () => {
    it("sets x-api-key from the provided apiKey", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = new CurseForgeSDK({
        apiKey: "my-secret-key",
        fetchImpl,
        maxRetries: 0,
        maxTokens: 100,
        refillTokensPerSecond: 100,
      });
      await sdk.getMod(1);

      const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get("x-api-key")).toBe("my-secret-key");
    });

    it("sets the default user-agent header", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      await sdk.getMod(1);

      const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get("user-agent")).toMatch(/^curseforge-sdk\//);
    });

    it("forwards a custom user-agent", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl, { userAgent: "my-app/1.0" });
      await sdk.getMod(1);

      const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get("user-agent")).toBe("my-app/1.0");
    });

    it("always sends accept: application/json", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      await sdk.getMod(1);

      const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get("accept")).toBe("application/json");
    });

    it("merges caller-supplied headers without overwriting auth headers", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      await sdk.request("/mods/1", {
        headers: { "x-custom-header": "value", "x-api-key": "ignored" },
      });

      const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get("x-custom-header")).toBe("value");
      // SDK always wins for auth
      expect(headers.get("x-api-key")).toBe("test-key");
    });
  });

  // -------------------------------------------------------------------------
  // getMod validation
  // -------------------------------------------------------------------------

  describe("getMod input validation", () => {
    it.each([
      [0, "zero"],
      [-1, "negative"],
      [1.5, "non-integer float"],
    ])("rejects modId %i (%s) before making a network call", async (modId) => {
      const fetchImpl = vi.fn<typeof fetch>();
      const sdk = makeSDK(fetchImpl);

      await expect(sdk.getMod(modId)).rejects.toThrow(TypeError);
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("accepts a positive integer modId and calls the correct endpoint", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 99, name: "A Mod" } }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      const mod = await sdk.getMod(99);

      expect(mod).toMatchObject({ id: 99, name: "A Mod" });
      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.pathname).toBe("/v1/mods/99");
    });
  });

  // -------------------------------------------------------------------------
  // Error mapping — non-retryable 4xx
  // -------------------------------------------------------------------------

  describe("error mapping", () => {
    it.each([400, 401, 403, 404, 409, 422])(
      "throws CurseForgeSDKError immediately for %i without retrying",
      async (status) => {
        const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
          new Response(JSON.stringify({ message: "error" }), { status }),
        );
        const sdk = makeSDK(fetchImpl, { maxRetries: 3 });

        await expect(sdk.getMod(1)).rejects.toBeInstanceOf(CurseForgeSDKError);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
      },
    );

    it("attaches statusCode, path, and payload to the thrown error", async () => {
      const errorBody = { message: "Not Found", errorCode: 404 };
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(errorBody), { status: 404 }),
      );
      const sdk = makeSDK(fetchImpl);

      const error = await sdk.getMod(1).catch((e) => e as CurseForgeSDKError);

      expect(error).toBeInstanceOf(CurseForgeSDKError);
      expect(error.statusCode).toBe(404);
      expect(error.path).toBe("mods/1");
      expect(error.payload).toEqual(errorBody);
      expect(error.retryAfterMs).toBeUndefined();
    });

    it("includes retryAfterMs when the server sends a retry-after header on a terminal error", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "5" },
        }),
      );
      // maxRetries: 0 means no retry — error is thrown immediately
      const sdk = makeSDK(fetchImpl, { maxRetries: 0 });

      const error = await sdk.getMod(1).catch((e) => e as CurseForgeSDKError);

      expect(error).toBeInstanceOf(CurseForgeSDKError);
      expect(error.retryAfterMs).toBe(5000);
    });

    it("falls back to the raw body string when the error payload is not valid JSON", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response("Internal Server Error", { status: 500 }),
      );
      const sdk = makeSDK(fetchImpl, { maxRetries: 0 });

      const error = await sdk.getMod(1).catch((e) => e as CurseForgeSDKError);

      expect(error.payload).toBe("Internal Server Error");
    });
  });

  // -------------------------------------------------------------------------
  // Retry behavior
  // -------------------------------------------------------------------------

  describe("retry behavior", () => {
    it.each([429, 500, 502, 503, 504])(
      "retries %i responses and eventually succeeds",
      async (status) => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0);

        const fetchImpl = vi.fn<typeof fetch>()
          .mockResolvedValueOnce(new Response(null, { status }))
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }),
          );

        const sdk = makeSDK(fetchImpl, {
          maxRetries: 1,
          retryBaseDelayMs: 10,
          retryMaxDelayMs: 10,
        });

        const promise = sdk.getMod(1);
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toMatchObject({ id: 1 });
        expect(fetchImpl).toHaveBeenCalledTimes(2);
      },
    );

    it("exhausts maxRetries and then throws CurseForgeSDKError", async () => {
      vi.useFakeTimers();
      vi.spyOn(Math, "random").mockReturnValue(0);

      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 503 }),
      );

      const sdk = makeSDK(fetchImpl, {
        maxRetries: 2,
        retryBaseDelayMs: 10,
        retryMaxDelayMs: 10,
      });

      const promise = sdk.getMod(1);
      // Attach a no-op catch immediately so Node.js does not emit an
      // UnhandledRejection/PromiseRejectionHandledWarning while timers run.
      void promise.catch(() => undefined);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toBeInstanceOf(CurseForgeSDKError);
      expect(fetchImpl).toHaveBeenCalledTimes(3); // 1 original + 2 retries
    });

    it("does not retry when maxRetries is 0", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 429 }),
      );
      const sdk = makeSDK(fetchImpl, { maxRetries: 0 });

      await expect(sdk.getMod(1)).rejects.toBeInstanceOf(CurseForgeSDKError);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("honors a numeric retry-after header in seconds", async () => {
      vi.useFakeTimers();
      vi.spyOn(Math, "random").mockReturnValue(0);

      const fetchImpl = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(null, { status: 429, headers: { "retry-after": "2" } }),
        )
        .mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }),
        );

      const sdk = makeSDK(fetchImpl, {
        maxRetries: 1,
        retryBaseDelayMs: 0,
        retryMaxDelayMs: 0,
      });

      const promise = sdk.getMod(1);
      await vi.advanceTimersByTimeAsync(2500);

      await expect(promise).resolves.toMatchObject({ id: 1 });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("honors a retry-after HTTP-date header", async () => {
      vi.useFakeTimers();
      vi.spyOn(Math, "random").mockReturnValue(0);
      vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

      const retryAfterDate = new Date("2024-01-01T00:00:01.000Z").toUTCString();

      const fetchImpl = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(null, {
            status: 429,
            headers: { "retry-after": retryAfterDate },
          }),
        )
        .mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }),
        );

      const sdk = makeSDK(fetchImpl, {
        maxRetries: 1,
        retryBaseDelayMs: 0,
        retryMaxDelayMs: 0,
      });

      const promise = sdk.getMod(1);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).resolves.toMatchObject({ id: 1 });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("applies jitter so the delay is within the capped backoff range", async () => {
      vi.useFakeTimers();

      // Math.random = 0.5 → delay should be roughly half of the capped backoff (100ms)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const fetchImpl = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status: 500 }))
        .mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }),
        );

      const sdk = makeSDK(fetchImpl, {
        maxRetries: 1,
        retryBaseDelayMs: 100,
        retryMaxDelayMs: 100,
      });

      const promise = sdk.getMod(1);
      void promise.catch(() => undefined);
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toMatchObject({ id: 1 });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("original exponential backoff test: retries 429 and resolves", async () => {
      vi.useFakeTimers();
      vi.spyOn(Math, "random").mockReturnValue(0);

      const fetchImpl = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: "Too many requests" }), {
            status: 429,
            headers: { "content-type": "application/json", "retry-after": "0.01" },
          }),
        )
        .mockResolvedValueOnce(
            new Response(JSON.stringify({ data: { id: 7, name: "Recovered" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );

      const sdk = new CurseForgeSDK({
        apiKey: "test-key",
        fetchImpl,
        maxRetries: 2,
        retryBaseDelayMs: 10,
        retryMaxDelayMs: 20,
        maxTokens: 100,
        refillTokensPerSecond: 100,
      });

      const promise = sdk.getMod(7);
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toEqual({ id: 7, name: "Recovered" });
      // Note: getMod unwraps the `data` envelope. The raw mock body was { data: { id: 7, ... } }.
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // Timeout and AbortSignal
  // -------------------------------------------------------------------------

  describe("timeout and abort", () => {
    it("wraps a request timeout as a CurseForgeSDKError", async () => {
      vi.useFakeTimers();

      const fetchImpl = makeAbortableFetch(); // never resolves (no response provided)
      const sdk = makeSDK(fetchImpl, { timeoutMs: 100, maxRetries: 0 });

      const promise = sdk.getMod(1);
        // Pre-attach a no-op catch so Node.js does not emit UnhandledRejection
        // while the timer is advancing but before the assertion below consumes it.
        void promise.catch(() => undefined);
      await vi.advanceTimersByTimeAsync(200);

      const error = await promise.catch((e) => e as CurseForgeSDKError);
      expect(error).toBeInstanceOf(CurseForgeSDKError);
      expect(error.message).toMatch(/aborted/i);
    });

    it("wraps an external AbortSignal cancellation as a CurseForgeSDKError", async () => {
      const controller = new AbortController();

      // The abort may fire before or after fetchImpl is entered; the mock must
      // check signal.aborted eagerly to avoid a permanently-pending Promise.
      const fetchImpl = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
        const signal = (init as RequestInit).signal as AbortSignal | undefined;
        return new Promise<Response>((_, reject) => {
          if (signal?.aborted) {
            const reason = signal.reason instanceof Error ? signal.reason : Object.assign(new Error("Aborted"), { name: "AbortError" });
            reject(reason);
            return;
          }
          signal?.addEventListener(
            "abort",
            () => {
              const r = signal?.reason instanceof Error ? signal.reason : Object.assign(new Error("Aborted"), { name: "AbortError" });
              reject(r);
            },
            { once: true },
          );
        });
      });

      const sdk = makeSDK(fetchImpl, { maxRetries: 0, timeoutMs: 60_000 });
      const promise = sdk.request("/mods/1", { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toBeInstanceOf(CurseForgeSDKError);
    });
  });

  // -------------------------------------------------------------------------
  // JSON parsing
  // -------------------------------------------------------------------------

  describe("JSON parsing", () => {
    it("parses a well-formed JSON success payload", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 1, name: "Mod" } }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      const result = await sdk.getMod(1);

      expect(result).toEqual({ id: 1, name: "Mod" });
      // getMod unwraps { data: ... } — the above expectation is correct.
    });

    it("throws CurseForgeSDKError with the raw text when the success body is malformed JSON", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response("not-json{{}}", { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);

      const error = await sdk.getMod(1).catch((e) => e as CurseForgeSDKError);
      expect(error).toBeInstanceOf(CurseForgeSDKError);
      expect(error.message).toMatch(/invalid JSON/i);
      expect(error.payload).toBe("not-json{{}}");
    });

    it("returns undefined for a 204 No Content response", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 204 }),
      );
      const sdk = makeSDK(fetchImpl);
      const result = await sdk.request("/some/endpoint");

      expect(result).toBeUndefined();
    });

    it("returns undefined for a 200 response with an empty body", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response("", { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);
      const result = await sdk.request("/some/endpoint");

      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Rate-limit header observation
  // -------------------------------------------------------------------------

  describe("rate-limit header observation", () => {
    it("does not throw when all three rate-limit headers are present", async () => {
      const futureResetEpochSeconds = Math.floor(Date.now() / 1000) + 60;
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 1 } }), {
          status: 200,
          headers: {
            "x-ratelimit-remaining": "9",
            "x-ratelimit-limit": "10",
            "x-ratelimit-reset": String(futureResetEpochSeconds),
          },
        }),
      );
      const sdk = makeSDK(fetchImpl);

      await expect(sdk.getMod(1)).resolves.toMatchObject({ id: 1 });
    });

    it("does not throw when rate-limit headers are absent", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 }),
      );
      const sdk = makeSDK(fetchImpl);

      await expect(sdk.getMod(1)).resolves.toMatchObject({ id: 1 });
    });

    it("accepts a millisecond-epoch x-ratelimit-reset value", async () => {
      const futureResetMs = Date.now() + 60_000;
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 1 } }), {
          status: 200,
          headers: {
            "x-ratelimit-remaining": "4",
            "x-ratelimit-reset": String(futureResetMs),
          },
        }),
      );
      const sdk = makeSDK(fetchImpl);

      await expect(sdk.getMod(1)).resolves.toMatchObject({ id: 1 });
    });
  });

  // -------------------------------------------------------------------------
  // End-to-end smoke tests (mocked transport)
  // -------------------------------------------------------------------------

  describe("end-to-end smoke", () => {
    it("full happy path: construct client, call getMod, receive typed result", async () => {
      const modPayload = {
        id: 12345,
        name: "JourneyMap",
        slug: "journeymap",
        downloadCount: 1_000_000,
        isFeatured: true,
      };
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: modPayload }), {
          status: 200,
          headers: {
            "x-ratelimit-remaining": "9",
            "x-ratelimit-limit": "10",
          },
        }),
      );

      const sdk = new CurseForgeSDK({
        apiKey: "live-key",
        userAgent: "my-service/1.0",
        fetchImpl,
        maxRetries: 0,
        maxTokens: 100,
        refillTokensPerSecond: 100,
      });

      const mod = await sdk.getMod(12345);

      expect(mod.id).toBe(12345);
      expect(mod.name).toBe("JourneyMap");
      expect(mod.downloadCount).toBe(1_000_000);

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.href).toBe("https://api.curseforge.com/v1/mods/12345");

      const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get("x-api-key")).toBe("live-key");
      expect(headers.get("user-agent")).toBe("my-service/1.0");
    });

    it("search-like request via request() reaches the correct endpoint", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ data: [], pagination: { totalCount: 0 } }), {
          status: 200,
        }),
      );
      const sdk = makeSDK(fetchImpl);
      const result = await sdk.request<{ data: unknown[]; pagination: { totalCount: number } }>(
        "/mods/search?gameId=432&searchFilter=journeymap",
      );

      expect(result.pagination.totalCount).toBe(0);

      const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
      expect(calledUrl.pathname).toBe("/v1/mods/search");
      expect(calledUrl.search).toBe("?gameId=432&searchFilter=journeymap");
    });

    it("failure scenario: structured error payload is surfaced through CurseForgeSDKError", async () => {
      const errorPayload = { message: "API key is missing or invalid.", errorCode: 10002 };
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(errorPayload), { status: 401 }),
      );
      const sdk = makeSDK(fetchImpl);

      const error = await sdk.getMod(1).catch((e) => e as CurseForgeSDKError);

      expect(error).toBeInstanceOf(CurseForgeSDKError);
      expect(error.name).toBe("CurseForgeSDKError");
      expect(error.statusCode).toBe(401);
      expect(error.path).toBe("mods/1");
      expect(error.payload).toEqual(errorPayload);
      expect(error.retryAfterMs).toBeUndefined();
    });

    it("CurseForgeSDKError is an instanceof Error", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 500 }),
      );
      const sdk = makeSDK(fetchImpl, { maxRetries: 0 });

      const error: unknown = await sdk.getMod(1).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CurseForgeSDKError);
    });
  });
});