import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { TokenService } from "../../application/ports/token-service.port";
import { IS_PUBLIC_KEY } from "./public.decorator";
import type { UserRepository } from "../../application/ports/user-repository.port";

type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  userId?: string;
};

/**
 * Guard global: toda ruta Nest requiere un `Authorization: Bearer <token>`
 * valido, salvo las marcadas con `@Public()`. Resuelve el hallazgo de
 * auditoria "cero autenticacion/autorizacion en toda la API".
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
    private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const payload = this.tokenService.verify(token);

    if (!payload) {
      throw new UnauthorizedException("Invalid or expired token.");
    }

    const user = await this.users.findUserById(payload.idUser);
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("User is inactive or no longer exists.");
    }

    request.userId = payload.idUser;

    return true;
  }
}

function extractBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;

  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(" ");

  return scheme === "Bearer" && token ? token : null;
}
