import { Prisma, type PrismaClient, type JobPosition, type Position, type PositionAssignment } from "@prisma/client";
import { ConflictException, NotFoundException } from "@nestjs/common";
import type { OrganizationRepository } from "../../application/ports/organization-repository.port";
import type { CreateJobPositionInput, UpdateJobPositionInput, CreatePositionInput, UpdatePositionInput,
  PositionDto } from "../../../../../../packages/contracts/src/organization";
import { assertCapacity, assertAssignable, assertCanDeactivate, occupancy } from "../../domain/organization-policy";
import { recordAudit } from "../../../../shared/infrastructure/audit-event";

const active = { status: "ACTIVE" as const, endDate: null };
const jobDto = (row: JobPosition) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
const assignmentDto = (row: PositionAssignment) => ({ ...row, startDate: row.startDate.toISOString(),
  endDate: row.endDate?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
function positionDto(row: Position & { assignments: PositionAssignment[] }): PositionDto {
  const { assignments, ...position } = row;
  return { ...position, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    occupancy: occupancy(row.status, assignments.length > 0), currentAssignment: assignments[0] ? assignmentDto(assignments[0]) : null };
}

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Serializable transactions prevent write skew across assignments, deactivation and capacity checks.
  private async write<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try { return await this.prisma.$transaction(work, { isolationLevel: "Serializable" }); }
      catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2034" && attempt < 3) continue;
          if (["P2002", "P2003", "P2034"].includes(error.code)) throw new ConflictException("Conflicting code, assignment or concurrent change. Refresh and retry.");
          if (error.code === "P2025") throw new NotFoundException("Organization record not found.");
        }
        throw error;
      }
    }
  }

  async listJobs() { return (await this.prisma.jobPosition.findMany({ orderBy: { code: "asc" } })).map(jobDto); }
  async createJob(input: CreateJobPositionInput, actor: string) {
    return this.write(async tx => {
      assertCapacity(input.maxPositions ?? null, 0);
      const row = await tx.jobPosition.create({ data: input });
      await recordAudit(tx, actor, "CREATE_JOB_POSITION", "JobPosition", row.idJobPosition, null, row);
      return jobDto(row);
    });
  }
  async updateJob(idJobPosition: string, input: UpdateJobPositionInput, actor: string) {
    return this.write(async tx => {
      await tx.$queryRaw`SELECT id_job_position FROM job_position WHERE id_job_position = ${idJobPosition}::uuid FOR UPDATE`;
      const before = await tx.jobPosition.findUniqueOrThrow({ where: { idJobPosition } });
      const count = await tx.position.count({ where: { idJobPosition, status: "ACTIVE" } });
      assertCapacity(input.maxPositions === undefined ? before.maxPositions : input.maxPositions, count);
      if (input.status === "INACTIVE") assertCanDeactivate(count);
      const row = await tx.jobPosition.update({ where: { idJobPosition }, data: input });
      await recordAudit(tx, actor, "UPDATE_JOB_POSITION", "JobPosition", idJobPosition, before, row);
      return jobDto(row);
    });
  }
  async listPositions() {
    return (await this.prisma.position.findMany({ include: { assignments: { where: active } }, orderBy: { code: "asc" } })).map(positionDto);
  }
  private async capacity(tx: Prisma.TransactionClient, idJobPosition: string) {
    await tx.$queryRaw`SELECT id_job_position FROM job_position WHERE id_job_position = ${idJobPosition}::uuid FOR UPDATE`;
    const job = await tx.jobPosition.findUniqueOrThrow({ where: { idJobPosition } });
    if (job.status !== "ACTIVE") throw new ConflictException("Job position is inactive.");
    assertCapacity(job.maxPositions, 1 + await tx.position.count({ where: { idJobPosition, status: "ACTIVE" } }));
  }
  async createPosition(input: CreatePositionInput, actor: string) {
    return this.write(async tx => {
      if (input.status !== "INACTIVE") await this.capacity(tx, input.idJobPosition);
      else await tx.jobPosition.findUniqueOrThrow({ where: { idJobPosition: input.idJobPosition } });
      const row = await tx.position.create({ data: input, include: { assignments: { where: active } } });
      await recordAudit(tx, actor, "CREATE_POSITION", "Position", row.idPosition, null, row);
      return positionDto(row);
    });
  }
  async updatePosition(idPosition: string, input: UpdatePositionInput, actor: string) {
    return this.write(async tx => {
      const before = await tx.position.findUniqueOrThrow({ where: { idPosition } });
      if (input.status === "ACTIVE" && before.status === "INACTIVE") await this.capacity(tx, before.idJobPosition);
      if (input.status === "INACTIVE") assertCanDeactivate(await tx.positionAssignment.count({ where: { idPosition, ...active } }));
      const row = await tx.position.update({ where: { idPosition }, data: input, include: { assignments: { where: active } } });
      await recordAudit(tx, actor, "UPDATE_POSITION", "Position", idPosition, before, row);
      return positionDto(row);
    });
  }
  async history(idPosition: string) {
    if (!await this.prisma.position.findUnique({ where: { idPosition } })) throw new NotFoundException("Position not found.");
    return (await this.prisma.positionAssignment.findMany({ where: { idPosition }, orderBy: { startDate: "desc" } })).map(assignmentDto);
  }
  async userAssignments(idUser: string) {
    if (!await this.prisma.user.findUnique({ where: { idUser } })) throw new NotFoundException("User not found.");
    return (await this.prisma.positionAssignment.findMany({ where: { idUser }, orderBy: { startDate: "desc" } })).map(assignmentDto);
  }
  private async assignIn(tx: Prisma.TransactionClient, idPosition: string, idUser: string, actor: string, now: Date) {
    const position = await tx.position.findUniqueOrThrow({ where: { idPosition }, include: { jobPosition: true } });
    const user = await tx.user.findUniqueOrThrow({ where: { idUser } });
    const count = await tx.positionAssignment.count({ where: { idPosition, ...active } });
    assertAssignable(position.status, position.jobPosition.status, user.status, count > 0);
    const row = await tx.positionAssignment.create({ data: { idPosition, idUser, startDate: now } });
    await recordAudit(tx, actor, "ASSIGN_USER", "PositionAssignment", row.idPositionAssignment, null, row);
    return row;
  }
  async assign(idPosition: string, idUser: string, actor: string) {
    return this.write(async tx => assignmentDto(await this.assignIn(tx, idPosition, idUser, actor, new Date())));
  }
  private async closeIn(tx: Prisma.TransactionClient, idPositionAssignment: string, status: "ENDED" | "CANCELED", actor: string, now: Date) {
    const before = await tx.positionAssignment.findUniqueOrThrow({ where: { idPositionAssignment } });
    if (before.status !== "ACTIVE" || before.endDate !== null) throw new ConflictException("Assignment is already closed.");
    const row = await tx.positionAssignment.update({ where: { idPositionAssignment }, data: { status, endDate: now } });
    await recordAudit(tx, actor, status === "ENDED" ? "END_ASSIGNMENT" : "CANCEL_ASSIGNMENT", "PositionAssignment", idPositionAssignment, before, row);
    return row;
  }
  async close(id: string, status: "ENDED" | "CANCELED", actor: string) {
    return this.write(async tx => assignmentDto(await this.closeIn(tx, id, status, actor, new Date())));
  }
  async transfer(id: string, idPosition: string, actor: string) {
    return this.write(async tx => {
      const now = new Date();
      const previous = await this.closeIn(tx, id, "ENDED", actor, now);
      if (previous.idPosition === idPosition) throw new ConflictException("Choose a different destination position.");
      return assignmentDto(await this.assignIn(tx, idPosition, previous.idUser, actor, now));
    });
  }
}
