import type { OrganizationRepository } from "../ports/organization-repository.port";
import type { CreateJobPositionInput, UpdateJobPositionInput, CreatePositionInput, UpdatePositionInput } from "../../../../../../packages/contracts/src/organization";

export class ManageOrganizationUseCase {
  constructor(private readonly repository: OrganizationRepository) {}
  listJobs() { return this.repository.listJobs(); }
  createJob(input: CreateJobPositionInput, actor: string) { return this.repository.createJob(input, actor); }
  updateJob(id: string, input: UpdateJobPositionInput, actor: string) { return this.repository.updateJob(id, input, actor); }
  listPositions() { return this.repository.listPositions(); }
  createPosition(input: CreatePositionInput, actor: string) { return this.repository.createPosition(input, actor); }
  updatePosition(id: string, input: UpdatePositionInput, actor: string) { return this.repository.updatePosition(id, input, actor); }
  history(id: string) { return this.repository.history(id); }
  userAssignments(id: string) { return this.repository.userAssignments(id); }
  assign(id: string, user: string, actor: string) { return this.repository.assign(id, user, actor); }
  close(id: string, status: "ENDED" | "CANCELED", actor: string) { return this.repository.close(id, status, actor); }
  transfer(id: string, target: string, actor: string) { return this.repository.transfer(id, target, actor); }
}
