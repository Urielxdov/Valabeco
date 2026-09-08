import type { CreateJobPositionInput, UpdateJobPositionInput, CreatePositionInput, UpdatePositionInput,
  JobPositionDto, PositionDto, PositionAssignmentDto } from "../../../../../../packages/contracts/src/organization";

export interface OrganizationRepository {
  listJobs(): Promise<JobPositionDto[]>;
  createJob(input: CreateJobPositionInput, actor: string): Promise<JobPositionDto>;
  updateJob(id: string, input: UpdateJobPositionInput, actor: string): Promise<JobPositionDto>;
  listPositions(): Promise<PositionDto[]>;
  createPosition(input: CreatePositionInput, actor: string): Promise<PositionDto>;
  updatePosition(id: string, input: UpdatePositionInput, actor: string): Promise<PositionDto>;
  history(idPosition: string): Promise<PositionAssignmentDto[]>;
  userAssignments(idUser: string): Promise<PositionAssignmentDto[]>;
  assign(idPosition: string, idUser: string, actor: string): Promise<PositionAssignmentDto>;
  close(id: string, status: "ENDED" | "CANCELED", actor: string): Promise<PositionAssignmentDto>;
  transfer(id: string, idPosition: string, actor: string): Promise<PositionAssignmentDto>;
}
