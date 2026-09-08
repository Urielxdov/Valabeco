import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, type PrismaClient } from "@prisma/client";
import type { UserLifecycle } from "../../application/ports/user-lifecycle.port";
import { recordAudit } from "../../../../shared/infrastructure/audit-event";

export class PrismaUserLifecycle implements UserLifecycle {
  constructor(private readonly prisma: PrismaClient) {}
  async deactivate(idUser: string, idActor: string): Promise<{ idUser: string; status: "INACTIVE" }> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const before = await tx.user.findUniqueOrThrow({ where: { idUser }, select: { idUser: true, status: true } });
          const assignments = await tx.positionAssignment.findMany({ where: { idUser, status: "ACTIVE", endDate: null } });
          const endDate = new Date();
          for (const assignment of assignments) {
            const after = await tx.positionAssignment.update({ where: { idPositionAssignment: assignment.idPositionAssignment }, data: { status: "ENDED", endDate } });
            await recordAudit(tx, idActor, "END_ASSIGNMENT", "PositionAssignment", assignment.idPositionAssignment, assignment, after);
          }
          await tx.user.update({ where: { idUser }, data: { status: "INACTIVE" } });
          const after = { idUser, status: "INACTIVE" as const };
          await recordAudit(tx, idActor, "DEACTIVATE_USER", "User", idUser, before, after);
          return after;
        }, { isolationLevel: "Serializable" });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2034" && attempt < 3) continue;
          if (error.code === "P2034") throw new ConflictException("Concurrent user change. Retry.");
          if (error.code === "P2025") throw new NotFoundException("User not found.");
        }
        throw error;
      }
    }
  }
}
