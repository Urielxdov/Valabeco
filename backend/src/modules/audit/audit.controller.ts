import { Controller, Get, Query } from "@nestjs/common";
import { ListAuditEventsUseCase } from "./application/use-cases/list-audit-events.use-case";

@Controller("audit-events")
export class AuditController {
  constructor(private readonly listAuditEvents: ListAuditEventsUseCase) {}
  @Get() list(@Query("limit") limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    return this.listAuditEvents.execute(parsed && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined);
  }
}
