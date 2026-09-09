"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import type { CustomerDetailDto, CustomerPageDto, CustomerStatus, CreateCustomerAddressInput, Result } from "@valabeco/contracts";
import { customerApi } from "@/src/shared/api/customer-api";
import { AppSidebar } from "@/src/shared/components/app-sidebar";
import { Alert, Panel } from "@/src/shared/components/ui";
import { SessionGate } from "@/src/features/identity/session-gate";
import { selectSession } from "@/src/features/identity/store/sessionSlice";
import { useAppSelector } from "@/src/store/hooks";
import {
  AddressFields, ContactFields, CustomerFields, TaxFields, Form, value,
  addressInput, contactInput, customerInput, buttonClass,
} from "./customer-forms";

const addressLabels = { FISCAL: "Fiscal", BILLING: "Facturación", SHIPPING: "Entrega", OTHER: "Otra" };
type Props = { id?: string; create?: boolean };
type Editor = "customer" | "tax" | "address" | "contact" | null;

export function CustomerApp(props: Props) {
  return <main className="min-h-screen bg-slate-100 text-slate-950">
    <div className="grid min-h-screen lg:grid-cols-[232px_1fr]">
      <AppSidebar />
      <section className="min-w-0 px-4 py-6 sm:px-8 lg:px-10">
        <SessionGate><CustomerContent {...props} /></SessionGate>
      </section>
    </div>
  </main>;
}

function CustomerContent({ id, create = false }: Props) {
  const session = useAppSelector(selectSession)!;
  const api = useMemo(() => customerApi(session.token), [session.token]);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "">("");
  const [list, setList] = useState<CustomerPageDto | null>(null);
  const [customer, setCustomer] = useState<CustomerDetailDto | null>(null);
  const [loading, setLoading] = useState(!create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<Editor>(null);
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    if (create) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (id) {
          const result = await api.get(id, controller.signal);
          if (controller.signal.aborted) return;
          if (!result.ok) throw new Error(result.error.message);
          setCustomer(result.data);
        } else {
          const result = await api.list({ page, search, status: status || undefined }, controller.signal);
          if (controller.signal.aborted) return;
          if (!result.ok) throw new Error(result.error.message);
          setList(result.data);
        }
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "No se pudo cargar la información.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [api, id, create, page, search, status, revision]);

  function open(next: Editor, recordId = "") {
    setEditor(next);
    setEditingId(recordId);
    setError("");
    setNotice("");
  }

  async function mutate(work: () => Promise<Result<unknown>>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await work();
      if (!result.ok) throw new Error(result.error.message);
      setEditor(null);
      setEditingId("");
      setNotice(message);
      setRevision(current => current + 1);
    } catch (caught) {
      setError(caught instanceof z.ZodError
        ? caught.issues.map(issue => issue.message).join(" ")
        : caught instanceof Error ? caught.message : "No se pudo guardar.");
    } finally { setBusy(false); }
  }

  function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void mutate(async () => {
      const result = await api.create(customerInput(form));
      if (result.ok) router.push(`/clientes/${result.data.idCustomer}`);
      return result;
    }, "Cliente creado.");
  }

  function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer || !id) return;
    const form = new FormData(event.currentTarget);
    void mutate(() => {
      if (editor === "customer") return api.update(id, customerInput(form));
      if (editor === "tax") return api.saveTaxProfile(id, {
        rfc: value(form, "rfc"), legalName: value(form, "legalName"),
        taxRegime: value(form, "taxRegime"), taxZipCode: value(form, "taxZipCode"),
        ...(value(form, "reason") ? { reason: value(form, "reason") } : {}),
      });
      if (editor === "address") return editingId
        ? api.updateAddress(id, editingId, addressInput(form))
        : api.addAddress(id, { ...addressInput(form), addressType: value(form, "addressType") as CreateCustomerAddressInput["addressType"] });
      return editingId ? api.updateContact(id, editingId, contactInput(form)) : api.addContact(id, contactInput(form));
    }, "Cambios guardados.");
  }

  const address = customer?.addresses.find(item => item.idCustomerAddress === editingId);
  const contact = customer?.contacts.find(item => item.idCustomerContact === editingId);
  const title = create ? "Nuevo cliente" : id ? customer?.displayName ?? "Detalle del cliente" : "Clientes";
  const editable = customer && !customer.isGeneric;

  return <>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold">{title}</h1><p className="mt-2 text-sm text-slate-600">Identidad comercial, datos fiscales, direcciones y contactos.</p></div>
      <div className="flex gap-3">
        {(id || create) ? <Link href="/clientes" className="px-3 py-2 text-sm text-teal-800 underline">Volver a clientes</Link>
          : <Link href="/clientes/nuevo" className={buttonClass}>Nuevo cliente</Link>}
        {!create && <button className="rounded-md border border-slate-300 px-3 py-2 text-sm" disabled={loading || busy} onClick={() => setRevision(current => current + 1)}>Actualizar</button>}
      </div>
    </header>
    <div aria-live="polite">{error && <Alert tone="error">{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}</div>
    {create && <Panel title="Información comercial"><Form onSubmit={createCustomer} busy={busy} label="Crear cliente"><CustomerFields /></Form></Panel>}
    {!id && !create && <>
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        setSearch(value(form, "search")); setStatus(value(form, "status") as CustomerStatus | ""); setPage(1);
      }}>
        <label className="text-sm font-medium">Buscar por nombre o RFC<input name="search" maxLength={255} className="mt-1 block rounded-md border border-slate-300 bg-white p-2" placeholder="Nombre, empresa o RFC" /></label>
        <label className="text-sm font-medium">Estado<select name="status" className="mt-1 block rounded-md border border-slate-300 bg-white p-2"><option value="">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select></label>
        <button className={buttonClass}>Buscar</button>
      </form>
      {loading ? <p role="status">Cargando clientes…</p> : list && <Panel title={`${list.total} clientes`}>
        {list.items.length === 0 ? <p className="text-sm text-slate-500">No hay clientes que coincidan con la búsqueda.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="border-b text-slate-500"><tr><th className="p-3">Cliente</th><th className="p-3">Tipo</th><th className="p-3">RFC</th><th className="p-3">Estado</th></tr></thead>
          <tbody>{list.items.map(item => <tr className="border-b border-slate-100" key={item.idCustomer}>
            <td className="p-3"><Link className="font-semibold text-teal-800 underline" href={`/clientes/${item.idCustomer}`}>{item.displayName}</Link>{item.tradeName && <p className="text-slate-500">{item.tradeName}</p>}</td>
            <td className="p-3">{item.isGeneric ? "Público general" : item.customerType === "PERSON" ? "Persona física" : "Empresa"}</td>
            <td className="p-3">{item.rfc ?? "Sin datos fiscales"}</td><td className="p-3">{item.status === "ACTIVE" ? "Activo" : "Inactivo"}</td>
          </tr>)}</tbody>
        </table></div>}
        <div className="mt-5 flex items-center justify-between text-sm">
          <button disabled={page <= 1} onClick={() => setPage(current => current - 1)} className="disabled:opacity-40">Anterior</button>
          <span>Página {page} de {Math.max(1, Math.ceil(list.total / list.pageSize))}</span>
          <button disabled={page * list.pageSize >= list.total} onClick={() => setPage(current => current + 1)} className="disabled:opacity-40">Siguiente</button>
        </div>
      </Panel>}
    </>}
    {id && (loading ? <p role="status">Cargando cliente…</p> : customer && <div className="space-y-6">
      <Panel title="Información comercial">
        <div className="mb-4 flex flex-wrap gap-4 text-sm"><span>{customer.isGeneric ? "Público general" : customer.customerType === "PERSON" ? "Persona física" : "Empresa"}</span><span>{customer.status === "ACTIVE" ? "Activo" : "Inactivo"}</span><span>{customer.tradeName ?? "Sin nombre comercial adicional"}</span></div>
        {customer.isGeneric && <p className="text-sm text-slate-500">Registro compartido para ventas de mostrador. Para una venta identificada, registra un cliente.</p>}
        {editable && <div className="flex gap-4">
          <button disabled={busy} className="text-sm text-teal-800 underline" onClick={() => open("customer")}>Editar información</button>
          <button disabled={busy} className="text-sm text-teal-800 underline" onClick={() => void mutate(() => api.update(id, { status: customer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }), "Estado actualizado. El historial se conserva.")}>{customer.status === "ACTIVE" ? "Desactivar cliente" : "Reactivar cliente"}</button>
        </div>}
      </Panel>
      {editor && <Panel title={{ customer: "Editar cliente", tax: "Perfil fiscal", address: editingId ? "Editar dirección" : "Agregar dirección", contact: editingId ? "Editar contacto" : "Agregar contacto" }[editor]}>
        <div className="mb-4 text-right"><button disabled={busy} className="text-sm underline" onClick={() => open(null)}>Cancelar</button></div>
        <Form key={`${editor}-${editingId}`} onSubmit={saveEditor} busy={busy}>
          {editor === "customer" && <CustomerFields customer={customer} />}
          {editor === "tax" && <TaxFields customer={customer} />}
          {editor === "address" && <AddressFields address={address} fiscalZip={customer.taxProfile?.taxZipCode} />}
          {editor === "contact" && <ContactFields contact={contact} />}
        </Form>
      </Panel>}
      <Panel title="Perfil fiscal">
        {customer.taxProfile ? <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">RFC</dt><dd className="font-semibold">{customer.taxProfile.rfc}</dd></div>
          <div><dt className="text-slate-500">Razón social</dt><dd>{customer.taxProfile.legalName}</dd></div>
          <div><dt className="text-slate-500">Régimen fiscal</dt><dd>{customer.taxProfile.taxRegime}</dd></div>
          <div><dt className="text-slate-500">Código postal fiscal</dt><dd>{customer.taxProfile.taxZipCode}</dd></div>
        </dl> : <p className="mb-4 text-sm text-slate-500">El cliente todavía no tiene datos fiscales.</p>}
        {editable && <button disabled={busy} className="text-sm text-teal-800 underline" onClick={() => open("tax")}>{customer.taxProfile ? "Editar perfil fiscal" : "Completar datos fiscales"}</button>}
      </Panel>
      <Panel title="Direcciones e historial">
        {customer.addresses.length === 0 && <p className="mb-4 text-sm text-slate-500">No hay direcciones registradas.</p>}
        <div className="grid gap-4 sm:grid-cols-2">{customer.addresses.map(item => <article key={item.idCustomerAddress} className="rounded-md border border-slate-200 p-4 text-sm">
          <p className="font-semibold">{addressLabels[item.addressType]} · {item.status === "ACTIVE" ? "Vigente" : "Inactiva"}</p>
          <p className="mt-2">{item.street} {item.externalNumber} {item.internalNumber && `Int. ${item.internalNumber}`}</p>
          <p>{[item.neighborhood, item.city, item.state, item.country].filter(Boolean).join(", ")}</p><p>CP {item.postalCode}</p>
          {editable && <div className="mt-3 flex gap-3">
            {item.status === "ACTIVE" && <button disabled={busy} className="text-teal-800 underline" onClick={() => open("address", item.idCustomerAddress)}>Editar</button>}
            <button disabled={busy} className="text-teal-800 underline" onClick={() => void mutate(() => api.setAddressStatus(id, item.idCustomerAddress, item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"), "Estado de la dirección actualizado.")}>{item.status === "ACTIVE" ? "Desactivar" : "Reactivar"}</button>
          </div>}
        </article>)}</div>
        {editable && <button disabled={busy} className="mt-4 text-sm text-teal-800 underline" onClick={() => open("address")}>Agregar dirección</button>}
      </Panel>
      <Panel title="Contactos">
        {customer.contacts.length === 0 && <p className="mb-4 text-sm text-slate-500">No hay contactos registrados.</p>}
        <div className="grid gap-4 sm:grid-cols-2">{customer.contacts.map(item => <article className="rounded-md border border-slate-200 p-4 text-sm" key={item.idCustomerContact}>
          <p className="font-semibold">{item.name} {item.lastName} · {item.status === "ACTIVE" ? "Activo" : "Inactivo"}</p>
          <p>{item.position}</p><p>{item.email}</p><p>{item.phone}</p>
          {editable && <div className="mt-3 flex gap-3">
            <button disabled={busy} className="text-teal-800 underline" onClick={() => open("contact", item.idCustomerContact)}>Editar</button>
            <button disabled={busy} className="text-teal-800 underline" onClick={() => void mutate(() => api.updateContact(id, item.idCustomerContact, { name: item.name, lastName: item.lastName, email: item.email, phone: item.phone, position: item.position, status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }), "Estado del contacto actualizado.")}>{item.status === "ACTIVE" ? "Desactivar" : "Reactivar"}</button>
          </div>}
        </article>)}</div>
        {editable && <button disabled={busy} className="mt-4 text-sm text-teal-800 underline" onClick={() => open("contact")}>Agregar contacto</button>}
      </Panel>
    </div>)}
  </>;
}
