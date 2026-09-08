import type { PositionAssignmentDto, PositionDto } from "@valabeco/contracts";

export const statusLabels: Record<"ACTIVE" | "INACTIVE", string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export const occupancyLabels: Record<"VACANT" | "OCCUPIED", string> = {
  VACANT: "Vacante",
  OCCUPIED: "Ocupada",
};

export const assignmentStatusLabels: Record<PositionAssignmentDto["status"], string> = {
  ACTIVE: "Activa",
  ENDED: "Finalizada",
  CANCELED: "Cancelada",
};

export function occupancyLabel(position: Pick<PositionDto, "status" | "occupancy">) {
  if (position.status === "INACTIVE") {
    return "Inactiva";
  }

  return position.occupancy ? occupancyLabels[position.occupancy] : "Vacante";
}

export function occupancyTone(position: Pick<PositionDto, "status" | "occupancy">) {
  if (position.status === "INACTIVE") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  if (position.occupancy === "OCCUPIED") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function assignmentStatusTone(status: PositionAssignmentDto["status"]) {
  if (status === "ACTIVE") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }

  if (status === "CANCELED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}
