import { CurseForgeSDKError } from "../errors/curseforge-sdk-error.js";
import { TokenBucketLimiter } from "../queue/token-bucket.js";
import type {
  ApiResponseOfListOfMinecraftGameVersion,
  ApiResponseOfListOfMinecraftModLoaderIndex,
  ApiResponseOfMinecraftGameVersion,
  ApiResponseOfMinecraftModLoaderVersion,
  CurseForgeMod,
  CurseForgeSDKOptions,
  GetCategoriesResponse,
  GetFeaturedModsRequestBody,
  GetFeaturedModsResponse,
  GetFilesResponse,
  GetFingerprintFuzzyMatchesResponse,
  GetFingerprintMatchesRequestBody,
  GetFingerprintMatchesResponse,
  GetFuzzyMatchesRequestBody,
  GetGameResponse,
  GetGamesParams,
  GetGamesResponse,
  GetMinecraftModLoadersParams,
  GetModDescriptionParams,
  GetModDescriptionResponse,
  GetModFileChangelogResponse,
  GetModFileDownloadURLResponse,
  GetModFileResponse,
  GetModFilesParams,
  GetModFilesRequestBody,
  GetModFilesResponse,
  GetModResponse,
  GetModsByIdsListRequestBody,
  GetModsResponse,
  GetVersionTypesResponse,
  GetVersionsResponse,
  GetVersionsV2Response,
  RateLimitSnapshot,
  RequestOptions,
  SearchModsParams,
  SearchModsResponse,
} from "../types/api.js";
import { computeJitteredBackoffDelay, sleep } from "../utils/backoff.js";
import { assertNonEmptyString, assertPositiveInteger } from "../utils/validation.js";

const DEFAULT_BASE_URL = "https://api.curseforge.com/v1";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;
const DEFAULT_RETRY_MAX_DELAY_MS = 4_000;
const DEFAULT_MAX_TOKENS = 5;
const DEFAULT_REFILL_TOKENS_PER_SECOND = 5;

/**
 * Main CurseForge API client.
 */
export class CurseForgeSDK {
  private readonly apiKey: string;

  private readonly baseUrl: string;

  private readonly userAgent: string;

  private readonly timeoutMs: number;

  private readonly maxRetries: number;

  private readonly retryBaseDelayMs: number;

  private readonly retryMaxDelayMs: number;

  private readonly fetchImpl: typeof fetch;

  private readonly limiter: TokenBucketLimiter;

  constructor(options: CurseForgeSDKOptions) {
    assertNonEmptyString(options.apiKey, "apiKey");

    this.apiKey = options.apiKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.userAgent = options.userAgent ?? "curseforge-sdk/0.1.0";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
    this.retryMaxDelayMs = options.retryMaxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.limiter = new TokenBucketLimiter(
      options.maxTokens ?? DEFAULT_MAX_TOKENS,
      options.refillTokensPerSecond ?? DEFAULT_REFILL_TOKENS_PER_SECOND,
    );
  }

  /**
   * Retrieves a mod by identifier.
   */
  public async getMod(modId: number): Promise<CurseForgeMod> {
    assertPositiveInteger(modId, "modId");
    const response = await this.request<GetModResponse>(`/mods/${modId}`, { method: "GET" });
    return response.data;
  }

  // -------------------------------------------------------------------------
  // Games
  // -------------------------------------------------------------------------

  /**
   * Returns all games available to the provided API key.
   */
  public async getGames(params?: GetGamesParams): Promise<GetGamesResponse> {
    return this.request<GetGamesResponse>(`/games${buildQueryString(params)}`);
  }

  /**
   * Returns a single game by ID.
   */
  public async getGame(gameId: number): Promise<GetGameResponse> {
    assertPositiveInteger(gameId, "gameId");
    return this.request<GetGameResponse>(`/games/${gameId}`);
  }

  /**
   * Returns all available versions for each version type of the specified game.
   */
  public async getVersions(gameId: number): Promise<GetVersionsResponse> {
    assertPositiveInteger(gameId, "gameId");
    return this.request<GetVersionsResponse>(`/games/${gameId}/versions`);
  }

  /**
   * Returns all available versions for each version type of the specified game (v2).
   * Uses the /v2/ API endpoint which returns richer version objects.
   */
  public async getVersionsV2(gameId: number): Promise<GetVersionsV2Response> {
    assertPositiveInteger(gameId, "gameId");
    // This endpoint lives at /v2/games/{id}/versions, not under /v1/.
    // Build the URL from the base URL's origin to bypass the v1 base path.
    const origin = new URL(this.baseUrl).origin;
    return this.request<GetVersionsV2Response>(`${origin}/v2/games/${gameId}/versions`);
  }

  /**
   * Returns all available version types for the specified game.
   */
  public async getVersionTypes(gameId: number): Promise<GetVersionTypesResponse> {
    assertPositiveInteger(gameId, "gameId");
    return this.request<GetVersionTypesResponse>(`/games/${gameId}/version-types`);
  }

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------

  /**
   * Returns all available categories for the specified game.
   * Specify `classId` to list only categories under that class.
   * Set `classesOnly` to `true` to return only top-level classes.
   */
  public async getCategories(gameId: number, options?: { classId?: number; classesOnly?: boolean }): Promise<GetCategoriesResponse> {
    assertPositiveInteger(gameId, "gameId");
    const params: Record<string, unknown> = { gameId, ...options };
    return this.request<GetCategoriesResponse>(`/categories${buildQueryString(params)}`);
  }

  // -------------------------------------------------------------------------
  // Mods
  // -------------------------------------------------------------------------

  /**
   * Searches for mods matching the provided criteria.
   */
  public async searchMods(params: SearchModsParams): Promise<SearchModsResponse> {
    return this.request<SearchModsResponse>(`/mods/search${buildQueryString(params)}`);
  }

  /**
   * Returns a list of mods by their IDs.
   */
  public async getMods(body: GetModsByIdsListRequestBody): Promise<GetModsResponse> {
    return this.request<GetModsResponse>("/mods", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  /**
   * Returns featured, popular and recently updated mods.
   */
  public async getFeaturedMods(body: GetFeaturedModsRequestBody): Promise<GetFeaturedModsResponse> {
    return this.request<GetFeaturedModsResponse>("/mods/featured", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  /**
   * Returns the full HTML description of a mod.
   */
  public async getModDescription(modId: number, params?: GetModDescriptionParams): Promise<GetModDescriptionResponse> {
    assertPositiveInteger(modId, "modId");
    return this.request<GetModDescriptionResponse>(`/mods/${modId}/description${buildQueryString(params)}`);
  }

  // -------------------------------------------------------------------------
  // Files
  // -------------------------------------------------------------------------

  /**
   * Returns a single file of the specified mod.
   */
  public async getModFile(modId: number, fileId: number): Promise<GetModFileResponse> {
    assertPositiveInteger(modId, "modId");
    assertPositiveInteger(fileId, "fileId");
    return this.request<GetModFileResponse>(`/mods/${modId}/files/${fileId}`);
  }

  /**
   * Returns all files of the specified mod.
   */
  public async getModFiles(modId: number, params?: GetModFilesParams): Promise<GetModFilesResponse> {
    assertPositiveInteger(modId, "modId");
    return this.request<GetModFilesResponse>(`/mods/${modId}/files${buildQueryString(params)}`);
  }

  /**
   * Returns a list of files by their IDs.
   */
  public async getFiles(body: GetModFilesRequestBody): Promise<GetFilesResponse> {
    return this.request<GetFilesResponse>("/mods/files", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  /**
   * Returns the changelog of a file in HTML format.
   */
  public async getModFileChangelog(modId: number, fileId: number): Promise<GetModFileChangelogResponse> {
    assertPositiveInteger(modId, "modId");
    assertPositiveInteger(fileId, "fileId");
    return this.request<GetModFileChangelogResponse>(`/mods/${modId}/files/${fileId}/changelog`);
  }

  /**
   * Returns the download URL for a specific file.
   */
  public async getModFileDownloadURL(modId: number, fileId: number): Promise<GetModFileDownloadURLResponse> {
    assertPositiveInteger(modId, "modId");
    assertPositiveInteger(fileId, "fileId");
    return this.request<GetModFileDownloadURLResponse>(`/mods/${modId}/files/${fileId}/download-url`);
  }

  // -------------------------------------------------------------------------
  // Fingerprints
  // -------------------------------------------------------------------------

  /**
   * Returns mod files that match a list of fingerprints (murmur2 hashes with seed 1).
   */
  public async getFingerprintMatches(body: GetFingerprintMatchesRequestBody): Promise<GetFingerprintMatchesResponse> {
    return this.request<GetFingerprintMatchesResponse>("/fingerprints", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  /**
   * Returns mod files that match a list of fingerprints, scoped to a game.
   */
  public async getFingerprintMatchesByGame(gameId: number, body: GetFingerprintMatchesRequestBody): Promise<GetFingerprintMatchesResponse> {
    assertPositiveInteger(gameId, "gameId");
    return this.request<GetFingerprintMatchesResponse>(`/fingerprints/${gameId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  /**
   * Returns mod files that match a list of fingerprints using fuzzy matching.
   */
  public async getFingerprintFuzzyMatches(body: GetFuzzyMatchesRequestBody): Promise<GetFingerprintFuzzyMatchesResponse> {
    return this.request<GetFingerprintFuzzyMatchesResponse>("/fingerprints/fuzzy", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  /**
   * Returns mod files that match a list of fingerprints using fuzzy matching, scoped to a game.
   */
  public async getFingerprintFuzzyMatchesByGame(gameId: number, body: GetFuzzyMatchesRequestBody): Promise<GetFingerprintFuzzyMatchesResponse> {
    assertPositiveInteger(gameId, "gameId");
    return this.request<GetFingerprintFuzzyMatchesResponse>(`/fingerprints/fuzzy/${gameId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  // -------------------------------------------------------------------------
  // Minecraft
  // -------------------------------------------------------------------------

  /**
   * Returns all Minecraft versions.
   */
  public async getMinecraftVersions(sortDescending?: boolean): Promise<ApiResponseOfListOfMinecraftGameVersion> {
    const params = sortDescending !== undefined ? { sortDescending } : undefined;
    return this.request<ApiResponseOfListOfMinecraftGameVersion>(`/minecraft/version${buildQueryString(params)}`);
  }

  /**
   * Returns details for a specific Minecraft version string.
   */
  public async getSpecificMinecraftVersion(gameVersionString: string): Promise<ApiResponseOfMinecraftGameVersion> {
    assertNonEmptyString(gameVersionString, "gameVersionString");
    return this.request<ApiResponseOfMinecraftGameVersion>(`/minecraft/version/${encodeURIComponent(gameVersionString)}`);
  }

  /**
   * Returns all available Minecraft mod loaders.
   */
  public async getMinecraftModLoaders(params?: GetMinecraftModLoadersParams): Promise<ApiResponseOfListOfMinecraftModLoaderIndex> {
    return this.request<ApiResponseOfListOfMinecraftModLoaderIndex>(`/minecraft/modloader${buildQueryString(params)}`);
  }

  /**
   * Returns details for a specific Minecraft mod loader.
   */
  public async getSpecificMinecraftModLoader(modLoaderName: string): Promise<ApiResponseOfMinecraftModLoaderVersion> {
    assertNonEmptyString(modLoaderName, "modLoaderName");
    return this.request<ApiResponseOfMinecraftModLoaderVersion>(`/minecraft/modloader/${encodeURIComponent(modLoaderName)}`);
  }

  // -------------------------------------------------------------------------
  // Low-level transport
  // -------------------------------------------------------------------------

  /**
   * Executes a typed request against the CurseForge API.
   */
  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    assertNonEmptyString(path, "path");
    const normalizedPath = normalizePath(path);

    let attempt = 0;

    while (true) {
      attempt += 1;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // Use a plain Error to avoid Node.js treating it as an unhandled rejection
        // when DOMException is used as an AbortController reason.
        const reason = new Error("Request timed out");
        reason.name = "TimeoutError";
        controller.abort(reason);
      }, this.timeoutMs);
      const signal = composeSignals(controller.signal, options.signal);

      try {
        await this.limiter.acquire(signal);

        const response = await this.fetchImpl(buildRequestUrl(normalizedPath, this.baseUrl), {
          ...options,
          signal,
          headers: buildHeaders(this.apiKey, this.userAgent, options.headers)
        });

        this.observeRateLimits(response.headers);

        if (response.ok) {
          return await this.parseSuccess<T>(response, normalizedPath);
        }

        const retryAfterMs = this.resolveRetryAfterMs(response.headers);
        const errorPayload = await this.readErrorPayload(response);

        if (this.shouldRetry(response.status) && attempt <= this.maxRetries) {
          const backoffDelay = computeJitteredBackoffDelay(attempt, this.retryBaseDelayMs, this.retryMaxDelayMs);
          const delay = Math.max(backoffDelay, retryAfterMs ?? 0, this.rateLimitResetDelayMs(response.headers));

          if (delay > 0) {
            this.limiter.pauseUntil(Date.now() + delay);
            await sleep(delay, signal);
          }

          continue;
        }

        throw new CurseForgeSDKError(`CurseForge request failed with status ${response.status}.`, {
          statusCode: response.status,
          path: normalizedPath,
          payload: errorPayload,
          retryAfterMs: retryAfterMs
        });
      } catch (error) {
        if (error instanceof CurseForgeSDKError) {
          throw error;
        }

        if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
          throw new CurseForgeSDKError("CurseForge request was aborted.", {
            path: normalizedPath,
            cause: error,
          });
        }

        throw new CurseForgeSDKError("CurseForge request failed before receiving a valid response.", {
          path: normalizedPath,
          cause: error,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  private async parseSuccess<T>(response: Response, path: string): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (text.length === 0) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new CurseForgeSDKError("CurseForge returned an invalid JSON payload.", {
        statusCode: response.status,
        path,
        payload: text,
        cause: error,
      });
    }
  }

  private async readErrorPayload(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private shouldRetry(status: number): boolean {
    return status === 429 || (status >= 500 && status <= 599);
  }

  private observeRateLimits(headers: Headers): void {
    this.limiter.updateFromHeaders(headers);
  }

  private resolveRetryAfterMs(headers: Headers): number | undefined {
    const retryAfter = headers.get("retry-after");
    if (retryAfter === null) {
      return undefined;
    }

    const numericRetryAfter = Number(retryAfter);
    if (Number.isFinite(numericRetryAfter)) {
      return Math.max(0, numericRetryAfter * 1000);
    }

    const retryAt = Date.parse(retryAfter);
    if (!Number.isNaN(retryAt)) {
      return Math.max(0, retryAt - Date.now());
    }

    return undefined;
  }

  private rateLimitResetDelayMs(headers: Headers): number {
    const snapshot = extractRateLimitSnapshot(headers);
    if (typeof snapshot.resetAt !== "number") {
      return 0;
    }

    return Math.max(0, snapshot.resetAt - Date.now());
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  assertNonEmptyString(baseUrl, "baseUrl");
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function normalizePath(path: string): string {
  // Absolute URLs pass through unchanged.
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  // Strip leading slash so the path is relative and appends to the base URL path.
  return path.startsWith("/") ? path.slice(1) : path;
}

function buildRequestUrl(normalizedPath: string, baseUrl: string): URL {
  // Absolute URL — use it directly, ignore the base URL.
  if (/^https?:\/\//.test(normalizedPath)) {
    return new URL(normalizedPath);
  }
  return new URL(normalizedPath, baseUrl);
}

function buildQueryString(params?: Record<string, unknown> | object): string {
  if (!params) {
    return "";
  }
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, String(item));
      }
    } else {
      search.set(key, String(value));
    }
  }
  return `?${search.toString()}`;
}

function buildHeaders(apiKey: string, userAgent: string, existingHeaders?: HeadersInit): Headers {
  const headers = new Headers(existingHeaders);
  headers.set("x-api-key", apiKey);
  headers.set("user-agent", userAgent);
  headers.set("accept", "application/json");
  return headers;
}

function extractRateLimitSnapshot(headers: Headers): RateLimitSnapshot {
  const remaining = parseHeaderNumber(headers.get("x-ratelimit-remaining"));
  const limit = parseHeaderNumber(headers.get("x-ratelimit-limit"));
  const reset = parseHeaderNumber(headers.get("x-ratelimit-reset"));

  return {
    remaining,
    limit,
    resetAt: typeof reset === "number"
      ? (reset > 10_000_000_000 ? reset : reset * 1000)
      : undefined,
  };
}

function parseHeaderNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function composeSignals(primary: AbortSignal, secondary?: AbortSignal): AbortSignal {
  if (!secondary) {
    return primary;
  }

  if (primary.aborted) {
    return primary;
  }

  if (secondary.aborted) {
    return secondary;
  }

  const controller = new AbortController();

  const onPrimary = (): void => {
    secondary.removeEventListener("abort", onSecondary);
    controller.abort(primary.reason);
  };

  const onSecondary = (): void => {
    primary.removeEventListener("abort", onPrimary);
    controller.abort(secondary.reason);
  };

  primary.addEventListener("abort", onPrimary, { once: true });
  secondary.addEventListener("abort", onSecondary, { once: true });

  return controller.signal;
}