export type AuthConfig = Readonly<{
  tokenSecret: string;
  tokenTtlSeconds: number;
}>;

export function loadAuthConfig(): AuthConfig {
  const tokenSecret = process.env.AUTH_TOKEN_SECRET;

  if (!tokenSecret) {
    throw new Error("AUTH_TOKEN_SECRET is required to issue and verify auth tokens.");
  }

  const tokenTtlSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 3600);

  if (!Number.isSafeInteger(tokenTtlSeconds) || tokenTtlSeconds <= 0) {
    throw new Error("AUTH_TOKEN_TTL_SECONDS must be a positive integer.");
  }

  return { tokenSecret, tokenTtlSeconds };
}
