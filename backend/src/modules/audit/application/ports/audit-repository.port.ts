import type { AuditEventDto } from "../../../../../../packages/contracts/src/audit";

export interface AuditRepository {
  listRecent(limit: number): Promise<AuditEventDto[]>;
}
