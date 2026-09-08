import { z } from "zod";

export const AuditEventSchema = z.object({
  idAuditEvent: z.string().uuid(),
  idActor: z.string().uuid(),
  action: z.string(),
  entity: z.string(),
  idRecord: z.string().uuid(),
  before: z.unknown().nullable(),
  after: z.unknown(),
  createdAt: z.string().datetime(),
});
export type AuditEventDto = z.infer<typeof AuditEventSchema>;
