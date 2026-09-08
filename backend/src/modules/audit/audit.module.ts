import { Module } from "@nestjs/common";
import { getPrisma } from "../../shared/infrastructure/prisma-client";
import { ListAuditEventsUseCase } from "./application/use-cases/list-audit-events.use-case";
import { PrismaAuditRepository } from "./infrastructure/prisma/prisma-audit.repository";
import { AuditController } from "./audit.controller";

@Module({
  controllers: [AuditController],
  providers: [
    { provide: PrismaAuditRepository, useFactory: () => new PrismaAuditRepository(getPrisma()) },
    { provide: ListAuditEventsUseCase, inject: [PrismaAuditRepository],
      useFactory: (repository: PrismaAuditRepository) => new ListAuditEventsUseCase(repository) },
  ],
})
export class AuditModule {}
