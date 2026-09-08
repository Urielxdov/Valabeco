import { Module } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";

import { getPrisma } from "../../shared/infrastructure/prisma-client";
import { AuthController } from "./auth.controller";
import { LoginUserUseCase } from "./application/use-cases/login-user.use-case";
import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { loadAuthConfig } from "./infrastructure/config/auth-config";
import { HmacTokenService } from "./infrastructure/crypto/hmac-token-service";
import { ScryptPasswordHasher } from "./infrastructure/crypto/scrypt-password-hasher";
import { PrismaUserRepository } from "./infrastructure/prisma/prisma-user.repository";
import { AuthGuard } from "./presentation/http/auth.guard";
import { UsersController } from "./users.controller";
import { DeactivateUserUseCase } from "./application/use-cases/deactivate-user.use-case";
import { PrismaUserLifecycle } from "./infrastructure/prisma/prisma-user-lifecycle";

@Module({
  controllers: [AuthController, UsersController],
  providers: [
    { provide: PrismaUserLifecycle, useFactory: () => new PrismaUserLifecycle(getPrisma()) },
    { provide: DeactivateUserUseCase, inject: [PrismaUserLifecycle],
      useFactory: (lifecycle: PrismaUserLifecycle) => new DeactivateUserUseCase(lifecycle) },
    {
      provide: PrismaUserRepository,
      useFactory: () => new PrismaUserRepository(getPrisma()),
    },
    {
      provide: ScryptPasswordHasher,
      useFactory: () => new ScryptPasswordHasher(),
    },
    {
      provide: HmacTokenService,
      useFactory: () => {
        const config = loadAuthConfig();
        return new HmacTokenService(config.tokenSecret, config.tokenTtlSeconds);
      },
    },
    {
      provide: RegisterUserUseCase,
      inject: [PrismaUserRepository, ScryptPasswordHasher, HmacTokenService],
      useFactory: (
        repository: PrismaUserRepository,
        passwordHasher: ScryptPasswordHasher,
        tokenService: HmacTokenService,
      ) => new RegisterUserUseCase(repository, passwordHasher, tokenService),
    },
    {
      provide: LoginUserUseCase,
      inject: [PrismaUserRepository, ScryptPasswordHasher, HmacTokenService],
      useFactory: (
        repository: PrismaUserRepository,
        passwordHasher: ScryptPasswordHasher,
        tokenService: HmacTokenService,
      ) => new LoginUserUseCase(repository, passwordHasher, tokenService),
    },
    {
      provide: APP_GUARD,
      inject: [HmacTokenService, Reflector, PrismaUserRepository],
      useFactory: (tokenService: HmacTokenService, reflector: Reflector, users: PrismaUserRepository) =>
        new AuthGuard(tokenService, reflector, users),
    },
  ],
})
export class IdentityModule {}
