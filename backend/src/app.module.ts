import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AccountingModule } from "./modules/accounting/accounting.module";
import { AuditModule } from "./modules/audit";
import { BusinessIntelligenceModule } from "./modules/business-intelligence/business-intelligence.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { OrganizationModule } from "./modules/organization";

@Module({
  imports: [ConfigModule.forRoot(), IdentityModule, AccountingModule, BusinessIntelligenceModule, OrganizationModule, AuditModule],
})
export class AppModule {}
