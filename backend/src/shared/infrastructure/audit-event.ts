import type { Prisma } from "@prisma/client";

export async function recordAudit(tx: Prisma.TransactionClient, idActor: string, action: string,
  entity: string, idRecord: string, before: unknown, after: unknown) {
  await tx.auditEvent.create({ data: {
    idActor, action, entity, idRecord,
    ...(before === null ? {} : { before: JSON.parse(JSON.stringify(before)) as Prisma.InputJsonValue }),
    after: JSON.parse(JSON.stringify(after)) as Prisma.InputJsonValue,
  } });
}
