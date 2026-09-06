import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AccountingModule } from "./modules/accounting/accounting.module";
import { BusinessIntelligenceModule } from "./modules/business-intelligence/business-intelligence.module";

@Module({
  imports: [ConfigModule.forRoot(), AccountingModule, BusinessIntelligenceModule],
})
export class AppModule {}
