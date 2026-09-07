import { createHmac, timingSafeEqual } from "node:crypto";

import type { TokenPayload, TokenService } from "../../application/ports/token-service.port";

type SignedBody = TokenPayload & { exp: number };

/**
 * Token firmado auto-contenido (`payload.firma`, ambos en base64url) usando
 * HMAC-SHA256 de `node:crypto`. No es JWT estandar, pero cubre el mismo caso
 * de uso sin agregar dependencias (`jsonwebtoken`/`@nestjs/jwt` no estan
 * disponibles en este entorno sin acceso a npm).
 */
export class HmacTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number,
  ) {}

  issue(payload: TokenPayload): string {
    const body: SignedBody = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + this.ttlSeconds,
    };
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const signature = this.sign(encodedBody);

    return `${encodedBody}.${signature}`;
  }

  verify(token: string): TokenPayload | null {
    const [encodedBody, signature] = token.split(".");

    if (!encodedBody || !signature) {
      return null;
    }

    if (!this.hasValidSignature(encodedBody, signature)) {
      return null;
    }

    const body = parseBody(encodedBody);

    if (!body) {
      return null;
    }

    if (body.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { idUser: body.idUser };
  }

  private hasValidSignature(encodedBody: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(encodedBody));
    const provided = Buffer.from(signature);

    return expected.length === provided.length && timingSafeEqual(expected, provided);
  }

  private sign(value: string): string {
    return createHmac("sha256", this.secret).update(value).digest("base64url");
  }
}

function parseBody(encodedBody: string): SignedBody | null {
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(encodedBody));

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as SignedBody).idUser === "string" &&
      typeof (parsed as SignedBody).exp === "number"
    ) {
      return parsed as SignedBody;
    }

    return null;
  } catch {
    return null;
  }
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}
