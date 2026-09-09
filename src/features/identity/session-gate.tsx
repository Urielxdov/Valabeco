"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AuthResponseSchema, LoginRequestSchema, RegisterRequestSchema } from "@valabeco/contracts";
import { ApiClient } from "@/src/shared/api/client";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { selectSession, sessionEnded, sessionStarted } from "./store/sessionSlice";
import { Alert, Panel } from "@/src/shared/components/ui";

const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
export function SessionGate({ children }: { children: ReactNode }) {
  const session = useAppSelector(selectSession);
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [register, setRegister] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const credentials = { email: form.get("email"), password: form.get("password") };
      const input = register ? RegisterRequestSchema.parse({ ...credentials, name: form.get("name") }) : LoginRequestSchema.parse(credentials);
      const result = await api.post(register ? "/auth/register" : "/auth/login", AuthResponseSchema, input);
      if (!result.ok) throw new Error(result.error.message);
      dispatch(sessionStarted(result.data));
    } catch {
      setError(register ? "No se pudo crear la cuenta. Revisa los datos, utiliza una contraseña de al menos 8 caracteres y un correo disponible." : "No se pudo iniciar sesión. Revisa tus credenciales y la conexión.");
    } finally { setBusy(false); }
  }

  if (!session) return (
    <div className="mx-auto max-w-md py-12">
      <Panel title={register ? "Crear cuenta" : "Inicia sesión"}>
        <p className="mb-5 text-sm text-slate-600">Accede con tu cuenta para administrar clientes.</p>
        {error && <Alert tone="error">{error}</Alert>}
        <form onSubmit={login} className="space-y-4">
          {register && <label className="block text-sm font-medium">Nombre
            <input name="name" autoComplete="name" required maxLength={255} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>}
          <label className="block text-sm font-medium">Correo electrónico
            <input name="email" type="email" autoComplete="username" required className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <label className="block text-sm font-medium">Contraseña
            <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 8 : 1} required className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <button disabled={busy} className="rounded-md bg-teal-700 px-4 py-2 text-white disabled:opacity-50">{busy ? "Procesando…" : register ? "Crear cuenta" : "Iniciar sesión"}</button>
        </form>
        <button disabled={busy} className="mt-4 text-sm text-teal-800 underline" onClick={() => { setRegister(current => !current); setError(""); }}>
          {register ? "Ya tengo una cuenta" : "Crear una cuenta"}
        </button>
      </Panel>
    </div>
  );
  return <><div className="mb-5 flex justify-end gap-3 text-sm">
    <span>{session.user.name}</span>
    <button className="text-teal-800 underline" onClick={() => dispatch(sessionEnded())}>Cerrar sesión</button>
  </div>{children}</>;
}
