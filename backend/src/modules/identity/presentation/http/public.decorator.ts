import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marca una ruta como exenta de `AuthGuard`. Usar solo en endpoints que
 * deben ser alcanzables sin token (hoy: `POST /auth/register`, `POST
 * /auth/login`).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
