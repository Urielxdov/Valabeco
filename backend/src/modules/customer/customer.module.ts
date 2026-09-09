import { Module } from "@nestjs/common";
import { getPrisma } from "../../shared/infrastructure/prisma-client";
import { ManageCustomersUseCase } from "./application/use-cases/manage-customers.use-case";
import { PrismaCustomerRepository } from "./infrastructure/prisma/prisma-customer.repository";
import { CustomersController } from "./customers.controller";

@Module({
  controllers: [CustomersController],
  providers: [
    { provide: PrismaCustomerRepository, useFactory: () => new PrismaCustomerRepository(getPrisma()) },
    {
      provide: ManageCustomersUseCase, inject: [PrismaCustomerRepository],
      useFactory: (repository: PrismaCustomerRepository) => new ManageCustomersUseCase(repository),
    },
  ],
})
export class CustomerModule {}
