import type { PrismaClient, AuditEvent } from "@prisma/client";
import type { AuditRepository } from "../../application/ports/audit-repository.port";
import type { AuditEventDto } from "../../../../../../packages/contracts/src/audit";

function auditEventDto(row: AuditEvent): AuditEventDto {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listRecent(limit: number): Promise<AuditEventDto[]> {
    const rows = await this.prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map(auditEventDto);
  }
}
