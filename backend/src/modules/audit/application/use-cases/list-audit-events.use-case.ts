import type { AuditRepository } from "../ports/audit-repository.port";

const DEFAULT_LIMIT = 100;

export class ListAuditEventsUseCase {
  constructor(private readonly repository: AuditRepository) {}
  execute(limit = DEFAULT_LIMIT) { return this.repository.listRecent(limit); }
}
