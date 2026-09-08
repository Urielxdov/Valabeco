import { Module } from "@nestjs/common";
import { getPrisma } from "../../shared/infrastructure/prisma-client";
import { ManageOrganizationUseCase } from "./application/use-cases/manage-organization.use-case";
import { PrismaOrganizationRepository } from "./infrastructure/prisma/prisma-organization.repository";
import { OrganizationController } from "./organization.controller";

@Module({
  controllers: [OrganizationController],
  providers: [
    { provide: PrismaOrganizationRepository, useFactory: () => new PrismaOrganizationRepository(getPrisma()) },
    { provide: ManageOrganizationUseCase, inject: [PrismaOrganizationRepository],
      useFactory: (repository: PrismaOrganizationRepository) => new ManageOrganizationUseCase(repository) },
  ],
})
export class OrganizationModule {}
