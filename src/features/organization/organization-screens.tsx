"use client";

import { ArrowLeft, Briefcase, IdCard, Plus, UserRound, Users } from "lucide-react";
import { FormEvent } from "react";
import type { AuditEventDto, JobPositionDto, PositionAssignmentDto, PositionDto, User } from "@valabeco/contracts";
import { Info, Panel, ScreenTitle } from "@/src/shared/components/ui";
import { compactJson, formatDate, formatDateTime, initials, shortId } from "./format";
import { assignmentStatusLabels, assignmentStatusTone, occupancyLabel, occupancyTone, statusLabels } from "./labels";

export type JobFormValue = {
  code: string;
  name: string;
  description: string;
  maxPositions: string;
  status: "ACTIVE" | "INACTIVE";
};
export type PositionFormValue = { code: string; name: string; status: "ACTIVE" | "INACTIVE" };

function activePositionsFor(job: JobPositionDto, positions: PositionDto[]) {
  return positions.filter((position) => position.idJobPosition === job.idJobPosition && position.status === "ACTIVE");
}

function occupancyCounts(positions: PositionDto[]) {
  return positions.reduce(
    (summary, position) => {
      if (position.status === "INACTIVE") {
        summary.inactive += 1;
      } else if (position.occupancy === "OCCUPIED") {
        summary.occupied += 1;
      } else {
        summary.vacant += 1;
      }

      return summary;
    },
    { occupied: 0, vacant: 0, inactive: 0 },
  );
}

export function OverviewScreen({
  jobs,
  positions,
  onGoAudit,
  onGoJobs,
  onGoPositions,
}: {
  jobs: JobPositionDto[];
  positions: PositionDto[];
  onGoAudit: () => void;
  onGoJobs: () => void;
  onGoPositions: () => void;
}) {
  const counts = occupancyCounts(positions);
  const chain = [
    { name: "Puesto", table: "job_position", Icon: Briefcase, note: "Función o cargo. Limita cuántas plazas activas puede tener." },
    { name: "Posición", table: "position", Icon: IdCard, note: "Plaza concreta. Vive aunque nadie la ocupe. Sin id_user." },
    { name: "Asignación", table: "position_assignment", Icon: Users, note: "Historial de ocupantes. Solo una activa por posición (RN-003)." },
    { name: "Usuario", table: "user (Identidad)", Icon: UserRound, note: "Identidad que opera el ERP. Baja lógica, nunca borrado (RN-006)." },
  ];

  return (
    <>
      <ScreenTitle
        subtitle="Puesto define la función; Posición es la plaza; Asignación conecta una posición con un usuario durante un periodo."
        title="Mapa del módulo"
      />
      <Panel title="Modelo del dominio">
        <div className="grid gap-3 md:grid-cols-4">
          {chain.map(({ Icon, name, note, table }) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={name}>
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-100 text-teal-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold">{name}</span>
              </div>
              <p className="font-mono text-xs text-slate-500">{table}</p>
              <p className="mt-2 text-xs text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <button
          className="rounded-md border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-teal-300"
          onClick={onGoJobs}
          type="button"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">01 · Catálogo</p>
          <p className="mt-1 text-lg font-bold">Puestos</p>
          <p className="mt-1 text-sm text-slate-500">{jobs.length} puestos registrados.</p>
        </button>
        <button
          className="rounded-md border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-teal-300"
          onClick={onGoPositions}
          type="button"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">02 · Directorio</p>
          <p className="mt-1 text-lg font-bold">Posiciones</p>
          <p className="mt-1 text-sm text-slate-500">
            {counts.occupied} ocupadas · {counts.vacant} vacantes · {counts.inactive} inactivas.
          </p>
        </button>
        <button
          className="rounded-md border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-teal-300"
          onClick={onGoAudit}
          type="button"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">03 · Bitácora</p>
          <p className="mt-1 text-lg font-bold">Auditoría</p>
          <p className="mt-1 text-sm text-slate-500">Quién, qué y cuándo cambió cada registro.</p>
        </button>
      </div>

      <p className="mt-5 text-sm text-slate-500">
        El detalle de un puesto o una posición, y el historial de un usuario, se abren desde su fila en el listado
        correspondiente.
      </p>
    </>
  );
}

export function JobsScreen({
  isLoading,
  jobForm,
  jobs,
  onCreateJob,
  onJobFormChange,
  onOpenJob,
  positions,
}: {
  isLoading: boolean;
  jobForm: JobFormValue;
  jobs: JobPositionDto[];
  onCreateJob: (event: FormEvent<HTMLFormElement>) => void;
  onJobFormChange: (form: JobFormValue) => void;
  onOpenJob: (idJobPosition: string) => void;
  positions: PositionDto[];
}) {
  const counts = occupancyCounts(positions);

  return (
    <>
      <ScreenTitle subtitle="Cargo o función; agrupa las plazas de la organización." title="Catálogo de puestos" />
      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Info label="Puestos" value={String(jobs.length)} />
        <Info label="Posiciones activas" value={String(positions.filter((p) => p.status === "ACTIVE").length)} />
        <Info label="Ocupadas" value={String(counts.occupied)} />
        <Info label="Vacantes" value={String(counts.vacant)} />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Puestos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Puesto</th>
                  <th className="px-4 py-3">Posiciones activas</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                      Cargando puestos...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                      No hay puestos registrados todavía.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const active = activePositionsFor(job, positions);
                    const occupied = active.filter((position) => position.occupancy === "OCCUPIED").length;
                    return (
                      <tr className="cursor-pointer hover:bg-slate-50" key={job.idJobPosition} onClick={() => onOpenJob(job.idJobPosition)}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{job.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{job.name}</p>
                          <p className="text-xs text-slate-500">{job.description ?? "Sin descripción"}</p>
                        </td>
                        <td className="px-4 py-3">
                          {active.length} / {job.maxPositions ?? "∞"}
                          <span className="ml-2 text-xs text-slate-500">
                            {occupied} ocupadas · {active.length - occupied} vacantes
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={job.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Crear puesto">
          <form className="space-y-4" onSubmit={onCreateJob}>
            <TextField
              label="Código"
              onChange={(value) => onJobFormChange({ ...jobForm, code: value })}
              required
              value={jobForm.code}
            />
            <TextField
              label="Nombre"
              onChange={(value) => onJobFormChange({ ...jobForm, name: value })}
              required
              value={jobForm.name}
            />
            <TextField
              label="Descripción"
              onChange={(value) => onJobFormChange({ ...jobForm, description: value })}
              value={jobForm.description}
            />
            <TextField
              label="Límite de posiciones activas"
              onChange={(value) => onJobFormChange({ ...jobForm, maxPositions: value })}
              placeholder="Vacío = sin límite"
              type="number"
              value={jobForm.maxPositions}
            />
            <button className="h-10 w-full rounded-md bg-slate-950 text-sm font-semibold text-white">
              Guardar puesto
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

export function JobDetailScreen({
  editForm,
  job,
  onBack,
  onEditFormChange,
  onOpenPosition,
  onPositionFormChange,
  onSubmitEdit,
  onSubmitPosition,
  onToggleEdit,
  onTogglePositionForm,
  positionForm,
  positions,
  positionFormOpen,
  showEditForm,
  usersById,
}: {
  editForm: JobFormValue;
  job: JobPositionDto;
  onBack: () => void;
  onEditFormChange: (form: JobFormValue) => void;
  onOpenPosition: (idPosition: string) => void;
  onPositionFormChange: (form: PositionFormValue) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitPosition: (event: FormEvent<HTMLFormElement>) => void;
  onToggleEdit: () => void;
  onTogglePositionForm: () => void;
  positionForm: PositionFormValue;
  positions: PositionDto[];
  positionFormOpen: boolean;
  showEditForm: boolean;
  usersById: Map<string, User>;
}) {
  const active = activePositionsFor(job, positions);
  const occupied = active.filter((position) => position.occupancy === "OCCUPIED").length;

  return (
    <>
      <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a puestos
      </button>
      <Panel title="Detalle de puesto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">{job.code}</span>
              <StatusPill status={job.status} />
            </div>
            <h3 className="text-xl font-bold">{job.name}</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{job.description ?? "Sin descripción."}</p>
          </div>
          <div className="flex items-center gap-6 rounded-md border border-slate-200 bg-slate-50 px-5 py-3">
            <Metric label="Límite" value={`${active.length} / ${job.maxPositions ?? "∞"}`} />
            <Metric label="Ocupadas" value={String(occupied)} />
            <Metric label="Vacantes" value={String(active.length - occupied)} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onToggleEdit}
            type="button"
          >
            {showEditForm ? "Cerrar edición" : "Editar puesto"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={onTogglePositionForm}
            type="button"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva posición
          </button>
        </div>

        {showEditForm && (
          <form className="mt-4 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2" onSubmit={onSubmitEdit}>
            <TextField label="Nombre" onChange={(value) => onEditFormChange({ ...editForm, name: value })} required value={editForm.name} />
            <TextField label="Código" onChange={(value) => onEditFormChange({ ...editForm, code: value })} required value={editForm.code} />
            <TextField
              label="Descripción"
              onChange={(value) => onEditFormChange({ ...editForm, description: value })}
              value={editForm.description}
            />
            <TextField
              label="Límite de posiciones activas"
              onChange={(value) => onEditFormChange({ ...editForm, maxPositions: value })}
              placeholder="Vacío = sin límite"
              type="number"
              value={editForm.maxPositions}
            />
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Estado
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500"
                onChange={(event) => onEditFormChange({ ...editForm, status: event.target.value as "ACTIVE" | "INACTIVE" })}
                value={editForm.status}
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </label>
            <button className="h-10 rounded-md bg-slate-950 text-sm font-semibold text-white sm:col-span-2">
              Guardar cambios
            </button>
          </form>
        )}

        {positionFormOpen && (
          <form className="mt-4 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2" onSubmit={onSubmitPosition}>
            <TextField
              label="Código"
              onChange={(value) => onPositionFormChange({ ...positionForm, code: value })}
              required
              value={positionForm.code}
            />
            <TextField
              label="Nombre de la posición"
              onChange={(value) => onPositionFormChange({ ...positionForm, name: value })}
              required
              value={positionForm.name}
            />
            <button className="h-10 rounded-md bg-slate-950 text-sm font-semibold text-white sm:col-span-2">
              Guardar posición
            </button>
          </form>
        )}
      </Panel>

      <div className="mt-5">
        <Panel title="Posiciones del puesto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Posición</th>
                  <th className="px-4 py-3">Ocupante</th>
                  <th className="px-4 py-3">Ocupación</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.filter((p) => p.idJobPosition === job.idJobPosition).length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Este puesto todavía no tiene posiciones.
                    </td>
                  </tr>
                ) : (
                  positions
                    .filter((position) => position.idJobPosition === job.idJobPosition)
                    .map((position) => {
                      const holder = position.currentAssignment ? usersById.get(position.currentAssignment.idUser) : undefined;
                      return (
                        <tr className="cursor-pointer hover:bg-slate-50" key={position.idPosition} onClick={() => onOpenPosition(position.idPosition)}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{position.code}</td>
                          <td className="px-4 py-3 font-semibold">{position.name}</td>
                          <td className="px-4 py-3">{holder?.name ?? "Sin ocupante"}</td>
                          <td className="px-4 py-3">
                            <OccupancyPill position={position} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={position.status} />
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

export function PositionsScreen({
  filter,
  jobsById,
  onFilterChange,
  onOpenPosition,
  onQuickAction,
  positions,
  usersById,
}: {
  filter: "Todas" | "Vacantes" | "Ocupadas" | "Inactivas";
  jobsById: Map<string, JobPositionDto>;
  onFilterChange: (filter: "Todas" | "Vacantes" | "Ocupadas" | "Inactivas") => void;
  onOpenPosition: (idPosition: string) => void;
  onQuickAction: (position: PositionDto) => void;
  positions: PositionDto[];
  usersById: Map<string, User>;
}) {
  const counts = {
    Todas: positions.length,
    Vacantes: positions.filter((p) => p.status === "ACTIVE" && p.occupancy === "VACANT").length,
    Ocupadas: positions.filter((p) => p.occupancy === "OCCUPIED").length,
    Inactivas: positions.filter((p) => p.status === "INACTIVE").length,
  };

  const filtered = positions.filter((position) => {
    if (filter === "Todas") return true;
    if (filter === "Vacantes") return position.status === "ACTIVE" && position.occupancy === "VACANT";
    if (filter === "Ocupadas") return position.occupancy === "OCCUPIED";
    return position.status === "INACTIVE";
  });

  return (
    <>
      <ScreenTitle subtitle="Filtros por ocupación derivada — vacante, ocupada, inactiva." title="Directorio de posiciones" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["Todas", "Vacantes", "Ocupadas", "Inactivas"] as const).map((option) => (
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
              filter === option ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-600"
            }`}
            key={option}
            onClick={() => onFilterChange(option)}
            type="button"
          >
            {option}
            <span className="font-mono text-[11px] opacity-70">{counts[option]}</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          Ocupación derivada de la asignación activa · sin campo <code className="font-mono">id_user</code> en{" "}
          <code className="font-mono">position</code>.
        </span>
      </div>
      <Panel title="Posiciones">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Posición</th>
                <th className="px-4 py-3">Puesto</th>
                <th className="px-4 py-3">Ocupante</th>
                <th className="px-4 py-3">Desde</th>
                <th className="px-4 py-3">Ocupación</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No hay posiciones para este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((position) => {
                  const holder = position.currentAssignment ? usersById.get(position.currentAssignment.idUser) : undefined;
                  const actionLabel =
                    position.status === "INACTIVE" ? "Reactivar" : position.occupancy === "OCCUPIED" ? "Trasladar" : "Asignar";
                  return (
                    <tr key={position.idPosition}>
                      <td className="cursor-pointer px-4 py-3" onClick={() => onOpenPosition(position.idPosition)}>
                        <p className="font-semibold">{position.name}</p>
                        <p className="font-mono text-xs text-slate-500">{position.code}</p>
                      </td>
                      <td className="cursor-pointer px-4 py-3 text-slate-600" onClick={() => onOpenPosition(position.idPosition)}>
                        {jobsById.get(position.idJobPosition)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {holder ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                              {initials(holder.name)}
                            </span>
                            {holder.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin ocupante</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {position.currentAssignment ? formatDate(position.currentAssignment.startDate) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <OccupancyPill position={position} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            onQuickAction(position);
                          }}
                          type="button"
                        >
                          {actionLabel}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

export function PositionDetailScreen({
  editForm,
  history,
  isHistoryLoading,
  job,
  onBack,
  onCancel,
  onEditFormChange,
  onEnd,
  onOpenAssign,
  onOpenJob,
  onOpenUser,
  onSubmitEdit,
  onToggleEdit,
  position,
  showEditForm,
  usersById,
}: {
  editForm: PositionFormValue;
  history: PositionAssignmentDto[] | null;
  isHistoryLoading: boolean;
  job: JobPositionDto | undefined;
  onBack: () => void;
  onCancel: (idAssignment: string) => void;
  onEditFormChange: (form: PositionFormValue) => void;
  onEnd: (idAssignment: string) => void;
  onOpenAssign: (mode: "assign" | "transfer") => void;
  onOpenJob: (idJobPosition: string) => void;
  onOpenUser: (idUser: string) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleEdit: () => void;
  position: PositionDto;
  showEditForm: boolean;
  usersById: Map<string, User>;
}) {
  const current = position.currentAssignment;

  return (
    <>
      <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a posiciones
      </button>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Panel title="Detalle de posición">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">{position.code}</span>
              <OccupancyPill position={position} />
              <StatusPill status={position.status} />
            </div>
            <h3 className="text-xl font-bold">{position.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Puesto:{" "}
              {job ? (
                <button className="font-semibold text-teal-700" onClick={() => onOpenJob(job.idJobPosition)} type="button">
                  {job.name}
                </button>
              ) : (
                "—"
              )}{" "}
              · La plaza permanece aunque no tenga ocupante.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {position.status === "ACTIVE" && position.occupancy === "VACANT" && (
                <button
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => onOpenAssign("assign")}
                  type="button"
                >
                  Asignar usuario
                </button>
              )}
              {position.occupancy === "OCCUPIED" && current && (
                <>
                  <button
                    className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => onOpenAssign("transfer")}
                    type="button"
                  >
                    Trasladar a otra posición
                  </button>
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => onEnd(current.idPositionAssignment)}
                    type="button"
                  >
                    Finalizar asignación
                  </button>
                  <button
                    className="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    onClick={() => onCancel(current.idPositionAssignment)}
                    type="button"
                  >
                    Cancelar asignación
                  </button>
                </>
              )}
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={onToggleEdit}
                type="button"
              >
                {showEditForm ? "Cerrar edición" : "Editar posición"}
              </button>
            </div>

            {showEditForm && (
              <form className="mt-4 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2" onSubmit={onSubmitEdit}>
                <TextField label="Nombre" onChange={(value) => onEditFormChange({ ...editForm, name: value })} required value={editForm.name} />
                <TextField label="Código" onChange={(value) => onEditFormChange({ ...editForm, code: value })} required value={editForm.code} />
                <label className="block text-sm font-medium text-slate-700">
                  Estado
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500"
                    onChange={(event) => onEditFormChange({ ...editForm, status: event.target.value as "ACTIVE" | "INACTIVE" })}
                    value={editForm.status}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </label>
                <button className="h-10 self-end rounded-md bg-slate-950 text-sm font-semibold text-white">Guardar cambios</button>
              </form>
            )}
          </Panel>

          <Panel title="Historial de asignaciones">
            <p className="mb-3 text-xs text-slate-500">position_assignment · una sola activa simultánea (RN-003)</p>
            {isHistoryLoading ? (
              <p className="text-sm text-slate-500">Cargando historial...</p>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-slate-500">Sin asignaciones registradas todavía.</p>
            ) : (
              <ol className="space-y-4">
                {history.map((assignment) => {
                  const user = usersById.get(assignment.idUser);
                  return (
                    <li className="flex gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0" key={assignment.idPositionAssignment}>
                      <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${assignment.status === "ACTIVE" ? "bg-teal-500" : assignment.status === "CANCELED" ? "bg-rose-400" : "bg-slate-300"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button className="font-semibold text-slate-900 hover:text-teal-700" onClick={() => onOpenUser(assignment.idUser)} type="button">
                            {user?.name ?? shortId(assignment.idUser)}
                          </button>
                          <AssignmentStatusPill status={assignment.status} />
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {formatDateTime(assignment.startDate)} → {assignment.endDate ? formatDateTime(assignment.endDate) : "en curso"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Ficha">
            <dl className="divide-y divide-slate-100 text-sm">
              <FichaRow label="id_position" value={shortId(position.idPosition)} />
              <FichaRow label="Puesto" value={job ? `${job.name} (${job.code})` : "—"} />
              <FichaRow label="Estado estructural" value={statusLabels[position.status]} />
              <FichaRow label="Ocupación derivada" value={occupancyLabel(position)} />
              <FichaRow label="Asignaciones históricas" value={history ? String(history.length) : "—"} />
              <FichaRow label="Última modificación" value={formatDateTime(position.updatedAt)} />
            </dl>
          </Panel>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Una posición <strong>ocupada</strong> debe liberarse antes de inactivarse. La baja del usuario cierra la
            asignación pero conserva la plaza (RN-005).
          </div>
        </div>
      </div>
    </>
  );
}

export function UserHistoryScreen({
  history,
  isHistoryLoading,
  jobsById,
  onDeactivate,
  onOpenPosition,
  positionsById,
  user,
}: {
  history: PositionAssignmentDto[] | null;
  isHistoryLoading: boolean;
  jobsById: Map<string, JobPositionDto>;
  onDeactivate: () => void;
  onOpenPosition: (idPosition: string) => void;
  positionsById: Map<string, PositionDto>;
  user: User;
}) {
  return (
    <>
      <Panel title="Historial por usuario">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
            {initials(user.name)}
          </span>
          <div className="min-w-[200px] flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{user.name}</h3>
              <StatusPill status={user.status} />
            </div>
            <p className="text-sm text-slate-500">
              {user.email} · alta {formatDate(user.createdAt)}
            </p>
          </div>
          <button
            className="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={user.status === "INACTIVE"}
            onClick={onDeactivate}
            type="button"
          >
            Dar de baja
          </button>
        </div>
      </Panel>

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        La baja lógica cierra todas las asignaciones activas del usuario y conserva las plazas como vacantes (RN-005).
      </div>

      <div className="mt-5">
        <Panel title="Posiciones ocupadas">
          <p className="mb-3 text-xs text-slate-500">Un usuario puede ocupar varias posiciones a la vez.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Posición</th>
                  <th className="px-4 py-3">Puesto</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isHistoryLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                      Cargando historial...
                    </td>
                  </tr>
                ) : !history || history.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                      Este usuario no tiene asignaciones registradas.
                    </td>
                  </tr>
                ) : (
                  history.map((assignment) => {
                    const position = positionsById.get(assignment.idPosition);
                    const job = position ? jobsById.get(position.idJobPosition) : undefined;
                    return (
                      <tr key={assignment.idPositionAssignment}>
                        <td className="px-4 py-3">
                          {position ? (
                            <button className="font-semibold text-teal-700" onClick={() => onOpenPosition(position.idPosition)} type="button">
                              {position.name}
                            </button>
                          ) : (
                            shortId(assignment.idPosition)
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{job?.name ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {formatDateTime(assignment.startDate)} → {assignment.endDate ? formatDateTime(assignment.endDate) : "en curso"}
                        </td>
                        <td className="px-4 py-3">
                          <AssignmentStatusPill status={assignment.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

export function AuditScreen({
  events,
  isLoading,
  usersById,
}: {
  events: AuditEventDto[] | null;
  isLoading: boolean;
  usersById: Map<string, User>;
}) {
  return (
    <>
      <ScreenTitle
        subtitle="Distingue el actor que ejecutó la operación del usuario ocupante de la posición afectada. Registro inmutable."
        title="Bitácora de auditoría"
      />
      <Panel title="Eventos recientes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad · registro</th>
                <th className="px-4 py-3">Antes</th>
                <th className="px-4 py-3">Después</th>
                <th className="px-4 py-3">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    Cargando bitácora...
                  </td>
                </tr>
              ) : !events || events.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    Sin eventos registrados todavía.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.idAuditEvent}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{formatDateTime(event.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                        {event.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{event.entity}</p>
                      <p className="font-mono text-xs text-slate-500">{shortId(event.idRecord)}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{compactJson(event.before)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{compactJson(event.after)}</td>
                    <td className="px-4 py-3 text-slate-600">{usersById.get(event.idActor)?.name ?? shortId(event.idActor)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        status === "ACTIVE" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

function OccupancyPill({ position }: { position: Pick<PositionDto, "status" | "occupancy"> }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${occupancyTone(position)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {occupancyLabel(position)}
    </span>
  );
}

function AssignmentStatusPill({ status }: { status: PositionAssignmentDto["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${assignmentStatusTone(status)}`}>
      {assignmentStatusLabels[status]}
    </span>
  );
}

function FichaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function TextField({
  disabled,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 disabled:bg-slate-100"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
