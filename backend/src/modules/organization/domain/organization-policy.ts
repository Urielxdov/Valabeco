import { DomainError } from "../../../shared/domain/errors";

export function assertCapacity(maxPositions: number | null, activeCount: number) {
  if (maxPositions !== null && (!Number.isInteger(maxPositions) || maxPositions <= 0 || activeCount > maxPositions)) {
    throw new DomainError("The number of active positions exceeds the job position limit.");
  }
}

export function assertAssignable(positionStatus: string, jobStatus: string, userStatus: string, occupied: boolean) {
  if (positionStatus !== "ACTIVE" || jobStatus !== "ACTIVE" || userStatus !== "ACTIVE") {
    throw new DomainError("Assignments require an active position, job position and user.");
  }
  if (occupied) throw new DomainError("The position already has an active assignment.");
}

export function assertCanDeactivate(activeDependents: number) {
  if (activeDependents > 0) throw new DomainError("End active assignments or deactivate active positions first.");
}

export function occupancy(status: string, occupied: boolean): "VACANT" | "OCCUPIED" | null {
  return status === "ACTIVE" ? occupied ? "OCCUPIED" : "VACANT" : null;
}
