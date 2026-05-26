// ---------------------------------------------------------------------------
// Error payload
// ---------------------------------------------------------------------------

/**
 * Shared CurseForge API error payload shape.
 */
export interface CurseForgeApiErrorPayload {
  readonly message?: string;
  readonly errorCode?: string | number;
  readonly error?: string;
  readonly data?: unknown;
  readonly [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Enums (const objects + union type)
// ---------------------------------------------------------------------------

/** 1=Private, 2=Public */
export type CoreApiStatus = (typeof CoreApiStatus)[keyof typeof CoreApiStatus];
export const CoreApiStatus = { Private: 1, Public: 2 } as const;

/** 1=Draft, 2=Test, 3=PendingReview, 4=Rejected, 5=Approved, 6=Live */
export type CoreStatus = (typeof CoreStatus)[keyof typeof CoreStatus];
export const CoreStatus = { Draft: 1, Test: 2, PendingReview: 3, Rejected: 4, Approved: 5, Live: 6 } as const;

/** 1=Approved, 2=Deleted, 3=New */
export type GameVersionStatus = (typeof GameVersionStatus)[keyof typeof GameVersionStatus];
export const GameVersionStatus = { Approved: 1, Deleted: 2, New: 3 } as const;

/** 1=Normal, 2=Deleted */
export type GameVersionTypeStatus = (typeof GameVersionTypeStatus)[keyof typeof GameVersionTypeStatus];
export const GameVersionTypeStatus = { Normal: 1, Deleted: 2 } as const;

/** 1=Sha1, 2=Md5 */
export type HashAlgo = (typeof HashAlgo)[keyof typeof HashAlgo];
export const HashAlgo = { Sha1: 1, Md5: 2 } as const;

/** 1=EmbeddedLibrary, 2=OptionalDependency, 3=RequiredDependency, 4=Tool, 5=Incompatible, 6=Include */
export type FileRelationType = (typeof FileRelationType)[keyof typeof FileRelationType];
export const FileRelationType = { EmbeddedLibrary: 1, OptionalDependency: 2, RequiredDependency: 3, Tool: 4, Incompatible: 5, Include: 6 } as const;

/** 1=Release, 2=Beta, 3=Alpha */
export type FileReleaseType = (typeof FileReleaseType)[keyof typeof FileReleaseType];
export const FileReleaseType = { Release: 1, Beta: 2, Alpha: 3 } as const;

/**
 * 1=Processing, 2=ChangesRequired, 3=UnderReview, 4=Approved, 5=Rejected,
 * 6=MalwareDetected, 7=Deleted, 8=Archived, 9=Testing, 10=Released,
 * 11=ReadyForReview, 12=Deprecated, 13=Baking, 14=AwaitingPublishing,
 * 15=FailedPublishing, 16=Cooking, 17=Cooked, 18=UnderManualReview,
 * 19=ScanningForMalware, 20=ProcessingFile, 21=PendingRelease,
 * 22=ReadyForCooking, 23=PostProcessing
 */
export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];
export const FileStatus = {
  Processing: 1, ChangesRequired: 2, UnderReview: 3, Approved: 4, Rejected: 5,
  MalwareDetected: 6, Deleted: 7, Archived: 8, Testing: 9, Released: 10,
  ReadyForReview: 11, Deprecated: 12, Baking: 13, AwaitingPublishing: 14,
  FailedPublishing: 15, Cooking: 16, Cooked: 17, UnderManualReview: 18,
  ScanningForMalware: 19, ProcessingFile: 20, PendingRelease: 21,
  ReadyForCooking: 22, PostProcessing: 23,
} as const;

/**
 * 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt, 6=NeoForge
 */
export type ModLoaderType = (typeof ModLoaderType)[keyof typeof ModLoaderType];
export const ModLoaderType = { Any: 0, Forge: 1, Cauldron: 2, LiteLoader: 3, Fabric: 4, Quilt: 5, NeoForge: 6 } as const;

/** 1=ForgeInstaller, 2=ForgeJarInstall, 3=ForgeInstaller_v2, 4=FabricInstaller */
export type ModLoaderInstallMethod = (typeof ModLoaderInstallMethod)[keyof typeof ModLoaderInstallMethod];
export const ModLoaderInstallMethod = { ForgeInstaller: 1, ForgeJarInstall: 2, ForgeInstaller_v2: 3, FabricInstaller: 4 } as const;

/**
 * 1=New, 2=ChangesRequired, 3=UnderSoftReview, 4=Approved, 5=Rejected,
 * 6=ChangesMade, 7=Inactive, 8=Abandoned, 9=Deleted, 10=UnderReview
 */
export type ModStatus = (typeof ModStatus)[keyof typeof ModStatus];
export const ModStatus = { New: 1, ChangesRequired: 2, UnderSoftReview: 3, Approved: 4, Rejected: 5, ChangesMade: 6, Inactive: 7, Abandoned: 8, Deleted: 9, UnderReview: 10 } as const;

/**
 * 1=Featured, 2=Popularity, 3=LastUpdated, 4=Name, 5=Author,
 * 6=TotalDownloads, 7=Category, 8=GameVersion, 9=EarlyAccess,
 * 10=FeaturedRelease, 11=ReleaseDate, 12=Rating
 */
export type ModSearchSortField = (typeof ModSearchSortField)[keyof typeof ModSearchSortField];
export const ModSearchSortField = { Featured: 1, Popularity: 2, LastUpdated: 3, Name: 4, Author: 5, TotalDownloads: 6, Category: 7, GameVersion: 8, EarlyAccess: 9, FeaturedRelease: 10, ReleaseDate: 11, Rating: 12 } as const;

/** asc=Ascending, desc=Descending */
export type SortOrder = "asc" | "desc";

/**
 * 0=None, 1=Bisect, 2=BisectTwo
 */
export type AffiliationServiceType = (typeof AffiliationServiceType)[keyof typeof AffiliationServiceType];
export const AffiliationServiceType = { None: 0, Bisect: 1, BisectTwo: 2 } as const;

/**
 * 0=NotEnoughReviews, 1=OverwhelminglyPositive, 2=VeryPositive, 3=Positive,
 * 4=MostlyPositive, 5=Mixed, 6=MostlyNegative, 7=Negative, 8=VeryNegative,
 * 9=OverwhelminglyNegative
 */
export type RatingScore = (typeof RatingScore)[keyof typeof RatingScore];
export const RatingScore = { NotEnoughReviews: 0, OverwhelminglyPositive: 1, VeryPositive: 2, Positive: 3, MostlyPositive: 4, Mixed: 5, MostlyNegative: 6, Negative: 7, VeryNegative: 8, OverwhelminglyNegative: 9 } as const;

/**
 * 1=Mastodon, 2=Discord, 3=Website, 4=Facebook, 5=Twitter, 6=Instagram,
 * 7=Patreon, 8=Twitch, 9=Reddit, 10=Youtube, 11=TikTok, 12=Pinterest,
 * 13=Github, 14=Bluesky
 */
export type SocialLinkType = (typeof SocialLinkType)[keyof typeof SocialLinkType];
export const SocialLinkType = { Mastodon: 1, Discord: 2, Website: 3, Facebook: 4, Twitter: 5, Instagram: 6, Patreon: 7, Twitch: 8, Reddit: 9, Youtube: 10, TikTok: 11, Pinterest: 12, Github: 13, Bluesky: 14 } as const;

/**
 * 0=Empty, 1=Windows, 2=XboxOne, 3=XboxXS, 4=Linux, 5=PS4, 6=PS5, 7=Mac,
 * 8=IOS, 9=TVOS, 10=Android, 11=Switch, 12=WindowsServer, 13=LinuxServer
 */
export type PlatformType = (typeof PlatformType)[keyof typeof PlatformType];
export const PlatformType = { Empty: 0, Windows: 1, XboxOne: 2, XboxXS: 3, Linux: 4, PS4: 5, PS5: 6, Mac: 7, IOS: 8, TVOS: 9, Android: 10, Switch: 11, WindowsServer: 12, LinuxServer: 13 } as const;

/** 0=All, 1=Premium, 2=Free */
export type PremiumType = (typeof PremiumType)[keyof typeof PremiumType];
export const PremiumType = { All: 0, Premium: 1, Free: 2 } as const;

// ---------------------------------------------------------------------------
// Shared entity interfaces
// ---------------------------------------------------------------------------

export interface Pagination {
  readonly index: number;
  readonly pageSize: number;
  readonly resultCount: number;
  readonly totalCount: number;
}

export interface GameAssets {
  readonly iconUrl?: string;
  readonly tileUrl?: string;
  readonly coverUrl?: string;
}

export interface Game {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly dateModified: string;
  readonly assets?: GameAssets;
  readonly status?: CoreStatus;
  readonly apiStatus?: CoreApiStatus;
}

export interface GameVersion {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
}

export interface GameVersionsByType {
  readonly type: number;
  readonly versions: readonly string[];
}

export interface GameVersionsByTypeV2 {
  readonly type: number;
  readonly versions: readonly GameVersion[];
}

export interface GameVersionType {
  readonly id: number;
  readonly gameId: number;
  readonly name: string;
  readonly slug: string;
  readonly isSyncable: boolean;
  readonly status?: GameVersionTypeStatus;
}

export interface Category {
  readonly id: number;
  readonly gameId: number;
  readonly name: string;
  readonly slug: string;
  readonly url?: string;
  readonly iconUrl?: string;
  readonly dateModified?: string;
  readonly isClass?: boolean | null;
  readonly classId?: number | null;
  readonly parentCategoryId?: number | null;
  readonly displayIndex?: number | null;
}

export interface ModLinks {
  readonly websiteUrl?: string;
  readonly wikiUrl?: string;
  readonly issuesUrl?: string;
  readonly sourceUrl?: string;
}

export interface ModAuthor {
  readonly id: number;
  readonly name: string;
  readonly url?: string;
  readonly avatarUrl?: string;
}

export interface ModAsset {
  readonly id: number;
  readonly modId: number;
  readonly title?: string;
  readonly description?: string;
  readonly thumbnailUrl?: string;
  readonly url?: string;
}

export interface SortableGameVersion {
  readonly gameVersionName: string;
  readonly gameVersionPadded: string;
  readonly gameVersion: string;
  readonly gameVersionReleaseDate: string;
  readonly gameVersionTypeId?: number | null;
}

export interface FileHash {
  readonly value: string;
  readonly algo: HashAlgo;
}

export interface FileIndex {
  readonly gameVersion: string;
  readonly fileId: number;
  readonly filename: string;
  readonly releaseType?: FileReleaseType;
  readonly gameVersionTypeId?: number | null;
  readonly modLoader?: ModLoaderType;
}

export interface FileModule {
  readonly name?: string;
  readonly fingerprint?: number;
}

export interface FileDependency {
  readonly modId: number;
  readonly relationType?: FileRelationType;
}

export interface File {
  readonly id: number;
  readonly gameId: number;
  readonly modId: number;
  readonly isAvailable?: boolean;
  readonly displayName?: string;
  readonly fileName?: string;
  readonly releaseType?: FileReleaseType;
  readonly fileStatus?: FileStatus;
  readonly hashes?: readonly FileHash[];
  readonly fileDate?: string;
  readonly fileLength?: number;
  readonly fileSizeOnDisk?: number | null;
  readonly downloadCount?: number;
  readonly downloadUrl?: string | null;
  readonly gameVersions?: readonly string[];
  readonly sortableGameVersions?: readonly SortableGameVersion[];
  readonly dependencies?: readonly FileDependency[];
  readonly exposeAsAlternative?: boolean | null;
  readonly parentProjectFileId?: number | null;
  readonly alternateFileId?: number | null;
  readonly isServerPack?: boolean | null;
  readonly serverPackFileId?: number | null;
  readonly isEarlyAccessContent?: boolean | null;
  readonly earlyAccessEndDate?: string | null;
  readonly fileFingerprint?: number;
  readonly modules?: readonly FileModule[];
}

export interface SocialLink {
  readonly type?: SocialLinkType;
  readonly url?: string;
}

export interface RatingDetails {
  readonly rating?: number | null;
  readonly totalRatings?: number | null;
  readonly positiveRatings?: number | null;
  readonly score?: RatingScore;
}

export interface ServerAffiliation {
  readonly isEnabled?: boolean;
  readonly isDefaultBanner?: boolean;
  readonly hasDiscount?: boolean;
  readonly affiliationService?: AffiliationServiceType;
  readonly defaultBannerCustomTitle?: string;
  readonly customImageUrl?: string;
  readonly affiliationLink?: string;
}

/**
 * Full CurseForge mod representation, matching the Mod schema from the OpenAPI spec.
 */
export interface CurseForgeMod {
  readonly id: number;
  readonly gameId?: number;
  readonly name?: string;
  readonly slug?: string;
  readonly links?: ModLinks;
  readonly summary?: string;
  readonly status?: ModStatus;
  readonly downloadCount?: number;
  readonly isFeatured?: boolean;
  readonly primaryCategoryId?: number;
  readonly categories?: readonly Category[];
  readonly classId?: number | null;
  readonly authors?: readonly ModAuthor[];
  readonly logo?: ModAsset;
  readonly screenshots?: readonly ModAsset[];
  readonly videos?: readonly ModAsset[];
  readonly mainFileId?: number;
  readonly latestFiles?: readonly File[];
  readonly latestFilesIndexes?: readonly FileIndex[];
  readonly latestEarlyAccessFilesIndexes?: readonly FileIndex[];
  readonly dateCreated?: string;
  readonly dateModified?: string;
  readonly dateReleased?: string;
  readonly allowModDistribution?: boolean | null;
  readonly gamePopularityRank?: number;
  readonly isAvailable?: boolean;
  readonly thumbsUpCount?: number;
  readonly hasCommentsEnabled?: boolean | null;
  readonly ratingDetails?: RatingDetails;
  readonly serverAffiliation?: ServerAffiliation;
  readonly socialLinks?: readonly SocialLink[];
  readonly [key: string]: unknown;
}

export interface FeaturedModsResponse {
  readonly featured?: readonly CurseForgeMod[];
  readonly popular?: readonly CurseForgeMod[];
  readonly recentlyUpdated?: readonly CurseForgeMod[];
}

export interface FingerprintMatch {
  readonly id: number;
  readonly file?: File;
  readonly latestFiles?: readonly File[];
}

export interface FingerprintFuzzyMatch {
  readonly id: number;
  readonly file?: File;
  readonly latestFiles?: readonly File[];
  readonly fingerprints?: readonly number[];
}

export interface FingerprintMatchesResult {
  readonly isCacheBuilt?: boolean;
  readonly exactMatches?: readonly FingerprintMatch[];
  readonly exactFingerprints?: readonly number[];
  readonly partialMatches?: readonly FingerprintMatch[];
  readonly partialMatchFingerprints?: Readonly<Record<string, readonly number[]>>;
  readonly installedFingerprints?: readonly number[];
  readonly unmatchedFingerprints?: readonly number[];
}

export interface FingerprintFuzzyMatchResult {
  readonly fuzzyMatches?: readonly FingerprintFuzzyMatch[];
}

export interface FolderFingerprint {
  readonly foldername?: string;
  readonly fingerprints?: readonly number[];
}

export interface MinecraftGameVersion {
  readonly id: number;
  readonly gameVersionId?: number;
  readonly versionString?: string;
  readonly jarDownloadUrl?: string;
  readonly jsonDownloadUrl?: string;
  readonly approved?: boolean;
  readonly dateModified?: string;
  readonly gameVersionTypeId?: number;
  readonly gameVersionStatus?: GameVersionStatus;
  readonly gameVersionTypeStatus?: GameVersionTypeStatus;
}

export interface MinecraftModLoaderIndex {
  readonly name?: string;
  readonly gameVersion?: string;
  readonly latest?: boolean;
  readonly recommended?: boolean;
  readonly dateModified?: string;
  readonly type?: ModLoaderType;
}

export interface MinecraftModLoaderVersion {
  readonly id?: number;
  readonly gameVersionId?: number;
  readonly minecraftGameVersionId?: number;
  readonly forgeVersion?: string;
  readonly name?: string;
  readonly type?: ModLoaderType;
  readonly downloadUrl?: string;
  readonly filename?: string;
  readonly installMethod?: ModLoaderInstallMethod;
  readonly latest?: boolean;
  readonly recommended?: boolean;
  readonly approved?: boolean;
  readonly dateModified?: string;
  readonly mavenVersionString?: string;
  readonly versionJson?: string;
  readonly librariesInstallLocation?: string;
  readonly minecraftVersion?: string;
  readonly additionalFilesJson?: string;
  readonly modLoaderGameVersionId?: number;
  readonly modLoaderGameVersionTypeId?: number;
  readonly modLoaderGameVersionStatus?: GameVersionStatus;
  readonly modLoaderGameVersionTypeStatus?: GameVersionTypeStatus;
  readonly mcGameVersionId?: number;
  readonly mcGameVersionTypeId?: number;
  readonly mcGameVersionStatus?: GameVersionStatus;
  readonly mcGameVersionTypeStatus?: GameVersionTypeStatus;
  readonly installProfileJson?: string;
}

// ---------------------------------------------------------------------------
// Response wrappers (all data enveloped in { data: ... })
// ---------------------------------------------------------------------------

export interface GetGamesResponse {
  readonly data: readonly Game[];
  readonly pagination?: Pagination;
}

export interface GetGameResponse {
  readonly data: Game;
}

export interface GetVersionsResponse {
  readonly data: readonly GameVersionsByType[];
}

export interface GetVersionsV2Response {
  readonly data: readonly GameVersionsByTypeV2[];
}

export interface GetVersionTypesResponse {
  readonly data: readonly GameVersionType[];
}

export interface GetCategoriesResponse {
  readonly data: readonly Category[];
}

export interface SearchModsResponse {
  readonly data: readonly CurseForgeMod[];
  readonly pagination?: Pagination;
}

export interface GetModResponse {
  readonly data: CurseForgeMod;
}

export interface GetModsResponse {
  readonly data: readonly CurseForgeMod[];
}

export interface GetFeaturedModsResponse {
  readonly data: FeaturedModsResponse;
}

export interface GetModDescriptionResponse {
  readonly data: string;
}

export interface GetModFileResponse {
  readonly data: File;
}

export interface GetModFilesResponse {
  readonly data: readonly File[];
  readonly pagination?: Pagination;
}

export interface GetFilesResponse {
  readonly data: readonly File[];
}

export interface GetModFileChangelogResponse {
  readonly data: string;
}

export interface GetModFileDownloadURLResponse {
  readonly data: string;
}

export interface GetFingerprintMatchesResponse {
  readonly data: FingerprintMatchesResult;
}

export interface GetFingerprintFuzzyMatchesResponse {
  readonly data: FingerprintFuzzyMatchResult;
}

export interface ApiResponseOfListOfMinecraftGameVersion {
  readonly data: readonly MinecraftGameVersion[];
}

export interface ApiResponseOfMinecraftGameVersion {
  readonly data: MinecraftGameVersion;
}

export interface ApiResponseOfListOfMinecraftModLoaderIndex {
  readonly data: readonly MinecraftModLoaderIndex[];
}

export interface ApiResponseOfMinecraftModLoaderVersion {
  readonly data: MinecraftModLoaderVersion;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface GetModsByIdsListRequestBody {
  readonly modIds: readonly number[];
}

export interface GetFeaturedModsRequestBody {
  readonly gameId: number;
  readonly excludedModIds?: readonly number[];
  readonly gameVersionTypeId?: number | null;
}

export interface GetModFilesRequestBody {
  readonly fileIds: readonly number[];
}

export interface GetFingerprintMatchesRequestBody {
  /** Murmur2 hashes with seed 1. */
  readonly fingerprints: readonly number[];
}

export interface GetFuzzyMatchesRequestBody {
  readonly gameId: number;
  readonly fingerprints: readonly FolderFingerprint[];
}

// ---------------------------------------------------------------------------
// Query parameter interfaces
// ---------------------------------------------------------------------------

export interface GetGamesParams {
  readonly index?: number;
  readonly pageSize?: number;
}

export interface SearchModsParams {
  readonly gameId: number;
  readonly classId?: number;
  readonly categoryId?: number;
  readonly categoryIds?: string;
  readonly gameVersion?: string;
  readonly gameVersions?: string;
  readonly searchFilter?: string;
  readonly sortField?: ModSearchSortField;
  readonly sortOrder?: SortOrder;
  readonly modLoaderType?: ModLoaderType;
  readonly modLoaderTypes?: string;
  readonly gameVersionTypeId?: number;
  readonly authorId?: number;
  readonly primaryAuthorId?: number;
  readonly slug?: string;
  readonly index?: number;
  readonly pageSize?: number;
  readonly premiumType?: PremiumType;
}

export interface GetModFilesParams {
  readonly gameVersion?: string;
  readonly modLoaderType?: ModLoaderType;
  readonly gameVersionTypeId?: number;
  readonly olderThanProjectFileId?: number;
  readonly releaseTypes?: readonly FileReleaseType[];
  readonly platformType?: PlatformType;
  readonly index?: number;
  readonly pageSize?: number;
}

export interface GetModDescriptionParams {
  readonly raw?: boolean;
  readonly stripped?: boolean;
  readonly markup?: boolean;
}

export interface GetMinecraftModLoadersParams {
  readonly version?: string;
  readonly includeAll?: boolean;
}

// ---------------------------------------------------------------------------
// SDK internals
// ---------------------------------------------------------------------------

/**
 * Rate limit metadata observed from a response.
 */
export interface RateLimitSnapshot {
  readonly remaining?: number;
  readonly resetAt?: number;
  readonly limit?: number;
}

/**
 * Client configuration.
 */
export interface CurseForgeSDKOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly userAgent?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly retryBaseDelayMs?: number;
  readonly retryMaxDelayMs?: number;
  readonly maxTokens?: number;
  readonly refillTokensPerSecond?: number;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Public request options.
 */
export interface RequestOptions extends Omit<RequestInit, "body"> {
  readonly body?: BodyInit | null;
  readonly signal?: AbortSignal;
}