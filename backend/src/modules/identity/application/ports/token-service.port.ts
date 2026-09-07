export type TokenPayload = Readonly<{
  idUser: string;
}>;

export interface TokenService {
  issue(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
