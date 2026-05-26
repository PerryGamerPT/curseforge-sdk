# curseforge-sdk

The most resilient, production-ready TypeScript SDK for the [CurseForge API](https://docs.curseforge.com/).

`curseforge-sdk` is a hybrid ESM/CJS TypeScript SDK for the official CurseForge REST API v1, built for services that need predictable behavior under load, strict input validation, and clean operational failure modes.

## Key Features

- **Full API Coverage** — Every endpoint from the official OpenAPI spec is typed and exposed as a first-class method.
- **Native Fetch** — Uses Node.js native `fetch` for a lightweight, dependency-free HTTP stack.
- **Built-in Rate Limiting** — Token-bucket queue applied before outbound requests to reduce burst pressure.
- **Exponential Backoff** — Retries `429` and transient `5xx` responses with jitter so callers do not retry in lockstep.
- **Structured Errors** — `CurseForgeSDKError` carries `statusCode`, `path`, `payload`, and `retryAfterMs` for clean error handling.
- **Hybrid ESM/CJS** — Ships with both `import` and `require` entry points and full TypeScript declarations.
- **Node.js ≥ 18.17** — No polyfills needed; targets the stable native platform.

## Installation

```bash
# npm
npm install curseforge-sdk

# pnpm
pnpm add curseforge-sdk

# yarn
yarn add curseforge-sdk
```

## Quick Start

```ts
import { CurseForgeSDK, CurseForgeSDKError } from "curseforge-sdk";

const client = new CurseForgeSDK({
  apiKey: process.env.CURSEFORGE_API_KEY ?? "",
});

// Fetch a single mod
const mod = await client.getMod(12345);
console.log(mod.name, mod.downloadCount);

// Search for mods
const results = await client.searchMods({ gameId: 432, searchFilter: "journeymap" });
console.log(results.data.map((m) => m.slug));
```

## Configuration

All options are passed to the `CurseForgeSDK` constructor.

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **required** | Your CurseForge API key. |
| `baseUrl` | `string` | `https://api.curseforge.com/v1` | Override the API base URL. |
| `userAgent` | `string` | `curseforge-sdk/<version>` | Custom `User-Agent` header value. |
| `maxRetries` | `number` | `3` | Maximum number of retry attempts for retryable errors. |
| `retryBaseDelayMs` | `number` | `500` | Initial backoff delay in milliseconds. |
| `retryMaxDelayMs` | `number` | `30_000` | Maximum backoff delay cap in milliseconds. |
| `timeoutMs` | `number` | `30_000` | Per-request timeout in milliseconds. |
| `maxTokens` | `number` | `20` | Token-bucket capacity (burst size). |
| `refillTokensPerSecond` | `number` | `10` | Token-bucket refill rate. |
| `fetchImpl` | `typeof fetch` | `globalThis.fetch` | Inject a custom fetch implementation (useful for testing). |

```ts
const client = new CurseForgeSDK({
  apiKey: process.env.CURSEFORGE_API_KEY ?? "",
  maxRetries: 5,
  timeoutMs: 15_000,
  userAgent: "my-app/2.0",
});
```

## API Methods

All methods return typed promises. Response types match the [official CurseForge OpenAPI specification](https://docs.curseforge.com/).

### Games

```ts
// List all games available to your API key
const games = await client.getGames({ index: 0, pageSize: 50 });

// Get a single game
const game = await client.getGame(432);

// Get game versions (flat list)
const versions = await client.getVersions(432);

// Get game versions grouped by version type (v2 endpoint)
const versionsV2 = await client.getVersionsV2(432);

// Get version types for a game
const versionTypes = await client.getVersionTypes(432);
```

### Categories

```ts
// Get all categories for a game (optionally scoped to a class/category)
const categories = await client.getCategories(432);
const subCategories = await client.getCategories(432, { classId: 6 });
```

### Mods

```ts
// Fetch a single mod by numeric ID
const mod = await client.getMod(12345);

// Fetch multiple mods by ID in one request
const mods = await client.getMods({ modIds: [12345, 67890] });

// Search mods
const results = await client.searchMods({
  gameId: 432,
  searchFilter: "journeymap",
  modLoaderType: ModLoaderType.Forge,
  pageSize: 20,
});

// Get featured/popular/recently-updated mods for a game
const featured = await client.getFeaturedMods({ gameId: 432, excludedModIds: [] });

// Get a mod's full description (HTML)
const desc = await client.getModDescription(12345);
```

### Files

```ts
// Get a specific file for a mod
const file = await client.getModFile(12345, 98765);

// List all files for a mod (with optional filtering)
const files = await client.getModFiles(12345, { gameVersion: "1.20.1", pageSize: 50 });

// Fetch multiple files by ID across any mods
const batch = await client.getFiles({ fileIds: [98765, 11111] });

// Get a file's changelog (HTML)
const changelog = await client.getModFileChangelog(12345, 98765);

// Get a direct download URL for a file
const url = await client.getModFileDownloadURL(12345, 98765);
```

### Fingerprints

```ts
// Match exact file fingerprints (FNV-32) globally
const matches = await client.getFingerprintMatches({ fingerprints: [12345678] });

// Match exact fingerprints scoped to a game
const gameMatches = await client.getFingerprintMatchesByGame(432, { fingerprints: [12345678] });

// Match fuzzy fingerprints globally
const fuzzy = await client.getFingerprintFuzzyMatches({
  fingerprints: [{ folderId: 1, fingerprints: [12345678] }],
});

// Match fuzzy fingerprints scoped to a game
const fuzzyGame = await client.getFingerprintFuzzyMatchesByGame(432, {
  fingerprints: [{ folderId: 1, fingerprints: [12345678] }],
});
```

### Minecraft

```ts
// List all known Minecraft versions
const mcVersions = await client.getMinecraftVersions();
const mcVersionsDesc = await client.getMinecraftVersions(true); // sorted descending

// Get details for a specific Minecraft version string
const mc1201 = await client.getSpecificMinecraftVersion("1.20.1");

// List mod loaders (Forge, Fabric, Quilt, …)
const loaders = await client.getMinecraftModLoaders({ version: "1.20.1" });

// Get details for a specific mod loader by slug
const forge = await client.getSpecificMinecraftModLoader("forge-47.1.0");
```

### Low-level `request()`

For endpoints not yet covered by a typed helper, use `request()` directly:

```ts
const result = await client.request<{ data: unknown[] }>("/mods/search?gameId=432");
```

## Enums

All enums from the OpenAPI spec are exported as `const` objects for runtime use and as TypeScript union types:

```ts
import {
  ModLoaderType,
  ModStatus,
  FileReleaseType,
  HashAlgo,
} from "curseforge-sdk";

// Runtime value
console.log(ModLoaderType.Forge); // 1

// Type usage
type MyMod = { loaderType: typeof ModLoaderType[keyof typeof ModLoaderType] };
```

Available enum objects: `CoreApiStatus`, `CoreStatus`, `GameVersionStatus`, `GameVersionTypeStatus`, `HashAlgo`, `FileRelationType`, `FileReleaseType`, `FileStatus`, `ModLoaderType`, `ModLoaderInstallMethod`, `ModStatus`, `ModSearchSortField`, `AffiliationServiceType`, `RatingScore`, `SocialLinkType`, `PlatformType`, `PremiumType`.

## Error Handling

All errors thrown by the SDK are instances of `CurseForgeSDKError` (which extends `Error`). This makes it straightforward to distinguish SDK errors from unexpected programming errors.

```ts
import { CurseForgeSDK, CurseForgeSDKError } from "curseforge-sdk";

try {
  const mod = await client.getMod(999999999);
} catch (error) {
  if (error instanceof CurseForgeSDKError) {
    console.error({
      message: error.message,       // human-readable description
      statusCode: error.statusCode, // HTTP status code, or undefined for network errors
      path: error.path,             // normalized request path, e.g. "mods/999999999"
      payload: error.payload,       // parsed response body, or raw string if JSON failed
      retryAfterMs: error.retryAfterMs, // set when the server returned Retry-After
      cause: error.cause,           // underlying Error that triggered this (if any)
    });
    return;
  }
  // Re-throw unexpected errors
  throw error;
}
```

### Error types

| Condition | `statusCode` | Notes |
|---|---|---|
| HTTP 4xx (except 429) | 4xx | Not retried. |
| HTTP 429 Too Many Requests | 429 | Retried with `Retry-After` header if provided. |
| HTTP 5xx transient (500, 502, 503, 504) | 5xx | Retried with exponential backoff. |
| Request timeout | `undefined` | Message matches `/aborted/i`. |
| External `AbortSignal` cancelled | `undefined` | Message matches `/aborted/i`. |
| Invalid JSON response | `undefined` | `payload` contains the raw body text. |
| Input validation failure (e.g. invalid `modId`) | — | Throws `TypeError` before any network call. |

## Resilience Behavior

The SDK is designed to absorb normal API instability without pushing that complexity into application code.

- Outbound requests are queued through an internal token bucket to reduce burst pressure before a remote rate limit is reached.
- `x-ratelimit-remaining` and `x-ratelimit-reset` response headers are read and used to adjust the internal scheduler automatically.
- Only `429` and transient `5xx` responses trigger retries; permanent `4xx` errors are thrown immediately.
- Backoff uses exponential growth capped at `retryMaxDelayMs` with full jitter, so concurrent callers do not retry in lockstep.
- A per-request timeout (configurable via `timeoutMs`) and optional external `AbortSignal` are supported.

## CommonJS Usage

The package ships a CommonJS build alongside the ESM one:

```js
const { CurseForgeSDK, CurseForgeSDKError } = require("curseforge-sdk");

const client = new CurseForgeSDK({ apiKey: process.env.CURSEFORGE_API_KEY });
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

The repository uses Conventional Commits and semantic-release to keep versioning and changelogs automated.

#be happy