"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PositionDto, User } from "@valabeco/contracts";
import { initials } from "./format";

export type AssignModalMode = "assign" | "transfer";

export type AssignModalState = {
  mode: AssignModalMode;
  position: PositionDto;
};

const STEP_NAMES = ["Elegir", "Vigencia", "Confirmar"];

export function AssignModal({
  candidateUsers,
  currentPositionsByUser,
  destinationPositions,
  isSubmitting,
  jobNameByPositionId,
  onClose,
  onConfirm,
  state,
}: {
  candidateUsers: User[];
  currentPositionsByUser: Map<string, PositionDto[]>;
  destinationPositions: PositionDto[];
  isSubmitting: boolean;
  jobNameByPositionId: Map<string, string>;
  onClose: () => void;
  onConfirm: (targetId: string) => void;
  state: AssignModalState;
}) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { mode, position } = state;

  const options = mode === "assign" ? candidateUsers : destinationPositions;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) => {
      const label = mode === "assign" ? (option as User).name : (option as PositionDto).name;
      const sub = mode === "assign" ? (option as User).email : (option as PositionDto).code;
      return label.toLowerCase().includes(term) || sub.toLowerCase().includes(term);
    });
  }, [mode, options, search]);

  const selectedUser = mode === "assign" ? candidateUsers.find((u) => u.idUser === selectedId) : undefined;
  const selectedPosition = mode === "transfer" ? destinationPositions.find((p) => p.idPosition === selectedId) : undefined;

  const title = mode === "assign" ? "Asignar usuario a una posición" : "Trasladar a otra posición";
  const canAdvance = step === 1 ? Boolean(selectedId) : true;
  const isLast = step === 3;

  function next() {
    if (isLast) {
      if (selectedId) onConfirm(selectedId);
      return;
    }

    setStep((current) => current + 1);
  }

  function back() {
    if (step === 1) {
      onClose();
      return;
    }

    setStep((current) => current - 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-6">
      <div className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">
              {position.code} · {position.name}
            </p>
          </div>
          <button
            className="ml-auto grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="h-1 bg-slate-100">
          <div className="h-full bg-teal-600 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-5 flex gap-2">
            {STEP_NAMES.map((name, index) => {
              const n = index + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div
                  className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 ${
                    active ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"
                  }`}
                  key={name}
                >
                  <span
                    className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                      active || done ? "bg-teal-600 text-white" : "bg-white text-slate-400"
                    }`}
                  >
                    {done ? "✓" : n}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{name}</span>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                {mode === "assign" ? "Usuario a asignar" : "Posición destino"}
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-500"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={mode === "assign" ? "Buscar por nombre o correo" : "Buscar por código o nombre"}
                  value={search}
                />
              </label>
              <p className="text-xs text-slate-500">
                {mode === "assign"
                  ? "Solo usuarios con estado ACTIVE en Identidad y Acceso."
                  : "Solo posiciones activas y sin asignación activa (vacantes)."}
              </p>
              <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200">
                {filtered.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">Sin resultados.</p>
                )}
                {mode === "assign"
                  ? (filtered as User[]).map((user) => {
                      const heldPositions = currentPositionsByUser.get(user.idUser) ?? [];
                      return (
                        <button
                          className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 ${
                            selectedId === user.idUser ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                          }`}
                          key={user.idUser}
                          onClick={() => setSelectedId(user.idUser)}
                          type="button"
                        >
                          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {initials(user.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                            <span className="block text-xs text-slate-500">
                              {user.email}
                              {heldPositions.length > 0 ? ` · ocupa ${heldPositions.map((p) => p.name).join(", ")}` : " · sin asignación activa"}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  : (filtered as PositionDto[]).map((candidate) => (
                      <button
                        className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 ${
                          selectedId === candidate.idPosition ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                        }`}
                        key={candidate.idPosition}
                        onClick={() => setSelectedId(candidate.idPosition)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{candidate.name}</span>
                          <span className="block text-xs text-slate-500">
                            {candidate.code} · {jobNameByPositionId.get(candidate.idPosition) ?? "Puesto"}
                          </span>
                        </span>
                      </button>
                    ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                La operación inicia con la <strong>hora del servidor</strong>. No se admiten fechas programadas ni cambios retroactivos.
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Inicio
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-500"
                    disabled
                    value="Al confirmar"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Fin (abierta)
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-500"
                    disabled
                    value="NULL"
                  />
                </label>
              </div>
              {mode === "transfer" && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  El cierre de la asignación actual y el inicio en la nueva posición comparten el mismo instante (traslado atómico).
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-md border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Resumen de la operación
                </div>
                <dl className="divide-y divide-slate-100 px-4">
                  <SummaryRow label="Posición" value={`${position.code} · ${position.name}`} />
                  {mode === "assign" && <SummaryRow label="Usuario" value={selectedUser?.name ?? "—"} />}
                  {mode === "transfer" && (
                    <SummaryRow label="Posición destino" value={selectedPosition ? `${selectedPosition.code} · ${selectedPosition.name}` : "—"} />
                  )}
                  <SummaryRow label="Inicio" value="Hora del servidor al confirmar" />
                </dl>
              </div>
              <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Se validará en una transacción serializable: la posición debe estar activa y sin asignación activa.
              </p>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-xs text-slate-500">Paso {step} de 3</span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={back}
              type="button"
            >
              {step === 1 ? "Cancelar" : "Atrás"}
            </button>
            <button
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
              disabled={!canAdvance || isSubmitting}
              onClick={next}
              type="button"
            >
              {isLast ? (isSubmitting ? "Guardando..." : "Confirmar") : "Continuar"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
