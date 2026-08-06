interface CloudflareEnv {
  DB: D1Database;
  CLOUD_FILES: R2Bucket;
  ASSETS: Fetcher;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}
