"use client";

import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuditEventDto, JobPositionDto, PositionAssignmentDto, PositionDto, User } from "@valabeco/contracts";
import { auditApi } from "@/src/shared/api/audit-api";
import { identityApi } from "@/src/shared/api/identity-api";
import { organizationApi } from "@/src/shared/api/organization-api";
import { AppSidebar } from "@/src/shared/components/app-sidebar";
import { Alert } from "@/src/shared/components/ui";
import { AssignModal, type AssignModalMode } from "./organization-assign-modal";
import {
  AuditScreen,
  JobDetailScreen,
  JobsScreen,
  OverviewScreen,
  PositionDetailScreen,
  PositionsScreen,
  UserHistoryScreen,
  type JobFormValue,
  type PositionFormValue,
} from "./organization-screens";

type View = "mapa" | "puestos" | "puesto" | "posiciones" | "posicion" | "usuario" | "auditoria";
type PositionFilter = "Todas" | "Vacantes" | "Ocupadas" | "Inactivas";

const EMPTY_JOB_FORM: JobFormValue = { code: "", name: "", description: "", maxPositions: "", status: "ACTIVE" };
const EMPTY_POSITION_FORM: PositionFormValue = { code: "", name: "", status: "ACTIVE" };

type OrganizationAppProps = {
  initialJobId?: string;
  initialPositionId?: string;
  initialUserId?: string;
  initialView?: View;
};

export function OrganizationApp({
  initialJobId = "",
  initialPositionId = "",
  initialUserId = "",
  initialView = "mapa",
}: OrganizationAppProps) {
  const [view, setView] = useState<View>(initialView);
  const [jobs, setJobs] = useState<JobPositionDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedPositionId, setSelectedPositionId] = useState(initialPositionId);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [positionHistory, setPositionHistory] = useState<PositionAssignmentDto[] | null>(null);
  const [userHistory, setUserHistory] = useState<PositionAssignmentDto[] | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<PositionFilter>("Todas");

  const [jobForm, setJobForm] = useState<JobFormValue>(EMPTY_JOB_FORM);
  const [jobEditForm, setJobEditForm] = useState<JobFormValue>(EMPTY_JOB_FORM);
  const [showJobEditForm, setShowJobEditForm] = useState(false);
  const [positionForm, setPositionForm] = useState<PositionFormValue>(EMPTY_POSITION_FORM);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [positionEditForm, setPositionEditForm] = useState<PositionFormValue>(EMPTY_POSITION_FORM);
  const [showPositionEditForm, setShowPositionEditForm] = useState(false);

  const [assignModal, setAssignModal] = useState<{ mode: AssignModalMode; position: PositionDto } | null>(null);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAll() {
      try {
        const [jobsResult, positionsResult, usersResult] = await Promise.all([
          organizationApi.listJobs({ cache: "no-store", signal: controller.signal }),
          organizationApi.listPositions({ cache: "no-store", signal: controller.signal }),
          identityApi.listUsers(undefined, { cache: "no-store", signal: controller.signal }),
        ]);

        if (!jobsResult.ok) throw new Error(jobsResult.error.message);
        if (!positionsResult.ok) throw new Error(positionsResult.error.message);
        if (!usersResult.ok) throw new Error(usersResult.error.message);

        setJobs(jobsResult.data);
        setPositions(positionsResult.data);
        setUsers(usersResult.data);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadAll();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (view !== "posicion" || !selectedPositionId) return;
    const controller = new AbortController();

    async function loadHistory() {
      setIsHistoryLoading(true);
      try {
        const result = await organizationApi.positionHistory(selectedPositionId, { cache: "no-store", signal: controller.signal });
        if (!result.ok) throw new Error(result.error.message);
        setPositionHistory(result.data);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      } finally {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [view, selectedPositionId]);

  useEffect(() => {
    if (view !== "usuario" || !selectedUserId) return;
    const controller = new AbortController();

    async function loadUserHistory() {
      setIsHistoryLoading(true);
      try {
        const result = await organizationApi.userAssignments(selectedUserId, { cache: "no-store", signal: controller.signal });
        if (!result.ok) throw new Error(result.error.message);
        setUserHistory(result.data);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      } finally {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      }
    }

    void loadUserHistory();
    return () => controller.abort();
  }, [view, selectedUserId]);

  useEffect(() => {
    if (view !== "auditoria") return;
    const controller = new AbortController();

    async function loadAudit() {
      setIsAuditLoading(true);
      try {
        const result = await auditApi.listRecent(undefined, { cache: "no-store", signal: controller.signal });
        if (!result.ok) throw new Error(result.error.message);
        setAuditEvents(result.data);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      } finally {
        if (!controller.signal.aborted) setIsAuditLoading(false);
      }
    }

    void loadAudit();
    return () => controller.abort();
  }, [view]);

  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.idJobPosition, job])), [jobs]);
  const positionsById = useMemo(() => new Map(positions.map((position) => [position.idPosition, position])), [positions]);
  const usersById = useMemo(() => new Map(users.map((user) => [user.idUser, user])), [users]);
  const jobNameByPositionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const position of positions) {
      map.set(position.idPosition, jobsById.get(position.idJobPosition)?.name ?? "Puesto");
    }
    return map;
  }, [positions, jobsById]);
  const currentPositionsByUser = useMemo(() => {
    const map = new Map<string, PositionDto[]>();
    for (const position of positions) {
      const idUser = position.currentAssignment?.idUser;
      if (!idUser) continue;
      map.set(idUser, [...(map.get(idUser) ?? []), position]);
    }
    return map;
  }, [positions]);

  const selectedJob = jobsById.get(selectedJobId);
  const selectedPosition = positionsById.get(selectedPositionId);
  const selectedUser = usersById.get(selectedUserId);

  async function reloadPositions() {
    const result = await organizationApi.listPositions({ cache: "no-store" });
    if (result.ok) setPositions(result.data);
  }

  async function reloadUsers() {
    const result = await identityApi.listUsers(undefined, { cache: "no-store" });
    if (result.ok) setUsers(result.data);
  }

  async function reloadPositionHistory(idPosition: string) {
    const result = await organizationApi.positionHistory(idPosition, { cache: "no-store" });
    if (result.ok) setPositionHistory(result.data);
  }

  async function reloadUserHistory(idUser: string) {
    const result = await organizationApi.userAssignments(idUser, { cache: "no-store" });
    if (result.ok) setUserHistory(result.data);
  }

  function go(nextView: View, path: string) {
    setView(nextView);
    setNotice(null);
    setError(null);
    window.history.pushState(null, "", path);
  }

  function goJobs() {
    go("puestos", "/organizacion/puestos");
  }

  function goJob(idJobPosition: string) {
    setSelectedJobId(idJobPosition);
    setShowJobEditForm(false);
    setShowPositionForm(false);
    go("puesto", `/organizacion/puestos/${idJobPosition}`);
  }

  function goPositions() {
    go("posiciones", "/organizacion/posiciones");
  }

  function goPosition(idPosition: string) {
    setSelectedPositionId(idPosition);
    setPositionHistory(null);
    setShowPositionEditForm(false);
    go("posicion", `/organizacion/posiciones/${idPosition}`);
  }

  function goUser(idUser: string) {
    setSelectedUserId(idUser);
    setUserHistory(null);
    go("usuario", `/organizacion/usuarios/${idUser}`);
  }

  function goAudit() {
    go("auditoria", "/organizacion/auditoria");
  }

  async function refreshAll() {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([reloadJobsInternal(), reloadPositions(), reloadUsers()]);
      setNotice("Informacion actualizada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function reloadJobsInternal() {
    const result = await organizationApi.listJobs({ cache: "no-store" });
    if (result.ok) setJobs(result.data);
  }

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.createJob({
        code: jobForm.code,
        name: jobForm.name,
        description: jobForm.description || null,
        maxPositions: jobForm.maxPositions ? Number(jobForm.maxPositions) : null,
      });
      if (!result.ok) throw new Error(result.error.message);
      setJobs((current) => [...current, result.data].sort((a, b) => a.code.localeCompare(b.code)));
      setJobForm(EMPTY_JOB_FORM);
      setNotice("Puesto creado correctamente.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function submitJobEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedJob) return;
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.updateJob(selectedJob.idJobPosition, {
        code: jobEditForm.code,
        name: jobEditForm.name,
        description: jobEditForm.description || null,
        maxPositions: jobEditForm.maxPositions ? Number(jobEditForm.maxPositions) : null,
        status: jobEditForm.status,
      });
      if (!result.ok) throw new Error(result.error.message);
      setJobs((current) => current.map((job) => (job.idJobPosition === result.data.idJobPosition ? result.data : job)));
      setShowJobEditForm(false);
      setNotice("Puesto actualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function createPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedJob) return;
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.createPosition({
        idJobPosition: selectedJob.idJobPosition,
        code: positionForm.code,
        name: positionForm.name,
      });
      if (!result.ok) throw new Error(result.error.message);
      setPositions((current) => [...current, result.data]);
      setPositionForm(EMPTY_POSITION_FORM);
      setShowPositionForm(false);
      setNotice("Posición creada correctamente.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function submitPositionEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPosition) return;
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.updatePosition(selectedPosition.idPosition, {
        code: positionEditForm.code,
        name: positionEditForm.name,
        status: positionEditForm.status,
      });
      if (!result.ok) throw new Error(result.error.message);
      setPositions((current) => current.map((position) => (position.idPosition === result.data.idPosition ? result.data : position)));
      setShowPositionEditForm(false);
      setNotice("Posición actualizada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  function openAssign(mode: AssignModalMode) {
    if (!selectedPosition) return;
    setError(null);
    setAssignModal({ mode, position: selectedPosition });
  }

  function openQuickAssign(position: PositionDto) {
    setError(null);
    if (position.status === "INACTIVE") {
      void reactivatePosition(position);
      return;
    }
    setAssignModal({ mode: position.occupancy === "OCCUPIED" ? "transfer" : "assign", position });
  }

  async function reactivatePosition(position: PositionDto) {
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.updatePosition(position.idPosition, { status: "ACTIVE" });
      if (!result.ok) throw new Error(result.error.message);
      setPositions((current) => current.map((item) => (item.idPosition === result.data.idPosition ? result.data : item)));
      setNotice("Posición reactivada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function confirmAssign(targetId: string) {
    if (!assignModal) return;
    setIsSubmittingAssign(true);
    setError(null);
    setNotice(null);
    try {
      const { mode, position } = assignModal;
      const result =
        mode === "assign"
          ? await organizationApi.assign(position.idPosition, targetId)
          : await organizationApi.transfer(position.currentAssignment!.idPositionAssignment, targetId);

      if (!result.ok) throw new Error(result.error.message);

      await reloadPositions();
      if (view === "posicion" && selectedPositionId) await reloadPositionHistory(selectedPositionId);
      setAssignModal(null);
      setNotice(mode === "assign" ? "Usuario asignado correctamente." : "Traslado realizado correctamente.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setIsSubmittingAssign(false);
    }
  }

  async function endAssignment(idPositionAssignment: string) {
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.endAssignment(idPositionAssignment);
      if (!result.ok) throw new Error(result.error.message);
      await reloadPositions();
      if (selectedPositionId) await reloadPositionHistory(selectedPositionId);
      setNotice("Asignación finalizada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function cancelAssignment(idPositionAssignment: string) {
    setError(null);
    setNotice(null);
    try {
      const result = await organizationApi.cancelAssignment(idPositionAssignment);
      if (!result.ok) throw new Error(result.error.message);
      await reloadPositions();
      if (selectedPositionId) await reloadPositionHistory(selectedPositionId);
      setNotice("Asignación cancelada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function deactivateUser() {
    if (!selectedUser) return;
    setError(null);
    setNotice(null);
    try {
      const result = await identityApi.deactivateUser(selectedUser.idUser);
      if (!result.ok) throw new Error(result.error.message);
      await Promise.all([reloadUsers(), reloadPositions(), reloadUserHistory(selectedUser.idUser)]);
      setNotice("Usuario dado de baja. Sus asignaciones activas se cerraron.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  function openEditJob() {
    if (!selectedJob) return;
    setJobEditForm({
      code: selectedJob.code,
      name: selectedJob.name,
      description: selectedJob.description ?? "",
      maxPositions: selectedJob.maxPositions ? String(selectedJob.maxPositions) : "",
      status: selectedJob.status,
    });
    setShowJobEditForm((open) => !open);
  }

  function openEditPosition() {
    if (!selectedPosition) return;
    setPositionEditForm({ code: selectedPosition.code, name: selectedPosition.name, status: selectedPosition.status });
    setShowPositionEditForm((open) => !open);
  }

  const destinationPositions = assignModal
    ? positions.filter((position) => position.idPosition !== assignModal.position.idPosition && position.status === "ACTIVE" && position.occupancy === "VACANT")
    : [];
  const candidateUsers = users.filter((user) => user.status === "ACTIVE");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[232px_1fr]">
        <AppSidebar />

        <section className="min-w-0 px-4 py-6 sm:px-8 lg:px-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-normal">Estructura organizacional</h1>
              <p className="text-sm text-slate-500">Puestos, posiciones, asignaciones y su historial.</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => void refreshAll()}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualizar
            </button>
          </div>

          {(error || notice) && <Alert tone={error ? "error" : "success"}>{error ?? notice}</Alert>}

          {view === "mapa" && <OverviewScreen jobs={jobs} onGoAudit={goAudit} onGoJobs={goJobs} onGoPositions={goPositions} positions={positions} />}

          {view === "puestos" && (
            <JobsScreen
              isLoading={isLoading}
              jobForm={jobForm}
              jobs={jobs}
              onCreateJob={createJob}
              onJobFormChange={setJobForm}
              onOpenJob={goJob}
              positions={positions}
            />
          )}

          {view === "puesto" && selectedJob && (
            <JobDetailScreen
              editForm={jobEditForm}
              job={selectedJob}
              onBack={goJobs}
              onEditFormChange={setJobEditForm}
              onOpenPosition={goPosition}
              onPositionFormChange={setPositionForm}
              onSubmitEdit={submitJobEdit}
              onSubmitPosition={createPosition}
              onToggleEdit={openEditJob}
              onTogglePositionForm={() => setShowPositionForm((open) => !open)}
              positionForm={positionForm}
              positionFormOpen={showPositionForm}
              positions={positions}
              showEditForm={showJobEditForm}
              usersById={usersById}
            />
          )}

          {view === "posiciones" && (
            <PositionsScreen
              filter={filter}
              jobsById={jobsById}
              onFilterChange={setFilter}
              onOpenPosition={goPosition}
              onQuickAction={openQuickAssign}
              positions={positions}
              usersById={usersById}
            />
          )}

          {view === "posicion" && selectedPosition && (
            <PositionDetailScreen
              editForm={positionEditForm}
              history={positionHistory}
              isHistoryLoading={isHistoryLoading}
              job={jobsById.get(selectedPosition.idJobPosition)}
              onBack={goPositions}
              onCancel={cancelAssignment}
              onEditFormChange={setPositionEditForm}
              onEnd={endAssignment}
              onOpenAssign={openAssign}
              onOpenJob={goJob}
              onOpenUser={goUser}
              onSubmitEdit={submitPositionEdit}
              onToggleEdit={openEditPosition}
              position={selectedPosition}
              showEditForm={showPositionEditForm}
              usersById={usersById}
            />
          )}

          {view === "usuario" && selectedUser && (
            <UserHistoryScreen
              history={userHistory}
              isHistoryLoading={isHistoryLoading}
              jobsById={jobsById}
              onDeactivate={() => void deactivateUser()}
              onOpenPosition={goPosition}
              positionsById={positionsById}
              user={selectedUser}
            />
          )}

          {view === "auditoria" && <AuditScreen events={auditEvents} isLoading={isAuditLoading} usersById={usersById} />}
        </section>
      </div>

      {assignModal && (
        <AssignModal
          candidateUsers={candidateUsers}
          currentPositionsByUser={currentPositionsByUser}
          destinationPositions={destinationPositions}
          isSubmitting={isSubmittingAssign}
          jobNameByPositionId={jobNameByPositionId}
          onClose={() => setAssignModal(null)}
          onConfirm={(targetId) => void confirmAssign(targetId)}
          state={assignModal}
        />
      )}
    </main>
  );
}
