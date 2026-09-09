"use client";

import type { FormEvent, ReactNode } from "react";
import type { CustomerDetailDto, CreateCustomerInput, CustomerAddressSchema, CustomerContactSchema } from "@valabeco/contracts";
import type { z } from "zod";

export const buttonClass = "rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50";
const fieldClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100";

export function Field({ name, label, value, required, maxLength, type = "text", readOnly = false }: {
  name: string; label: string; value?: string | null; required?: boolean; maxLength?: number; type?: string; readOnly?: boolean;
}) {
  return <label className="block text-sm font-medium text-slate-700">{label}
    <input className={fieldClass} name={name} defaultValue={value ?? ""} required={required} maxLength={maxLength} type={type} readOnly={readOnly} />
  </label>;
}

export function Form({ children, onSubmit, busy, label = "Guardar" }: {
  children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; label?: string;
}) {
  return <form onSubmit={onSubmit}><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">{children}
    <div className="sm:col-span-2"><button className={buttonClass} type="submit">{busy ? "Guardando…" : label}</button></div>
  </fieldset></form>;
}
export const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
export const nullable = (form: FormData, key: string) => value(form, key) || null;

export function CustomerFields({ customer }: { customer?: Pick<CustomerDetailDto, "displayName" | "tradeName" | "customerType"> }) {
  return <>
    <Field name="displayName" label="Nombre del cliente" value={customer?.displayName} required maxLength={255} />
    <label className="block text-sm font-medium text-slate-700">Tipo de cliente
      <select name="customerType" className={fieldClass} defaultValue={customer?.customerType ?? "PERSON"}>
        <option value="PERSON">Persona física</option><option value="COMPANY">Empresa</option>
      </select>
    </label>
    <Field name="tradeName" label="Nombre comercial (opcional)" value={customer?.tradeName} maxLength={255} />
  </>;
}
export function customerInput(form: FormData): CreateCustomerInput {
  return { displayName: value(form, "displayName"), tradeName: nullable(form, "tradeName"), customerType: value(form, "customerType") as CreateCustomerInput["customerType"] };
}

export function TaxFields({ customer }: { customer: CustomerDetailDto }) {
  const profile = customer.taxProfile;
  const locked = customer.hasTransactions && profile !== null;
  return <>
    <Field name="rfc" label="RFC" value={profile?.rfc} required maxLength={13} readOnly={locked} />
    <Field name="legalName" label="Nombre o razón social fiscal" value={profile?.legalName} required maxLength={255} />
    <Field name="taxRegime" label="Clave del régimen fiscal" value={profile?.taxRegime} required maxLength={3} />
    <Field name="taxZipCode" label="Código postal fiscal" value={profile?.taxZipCode} required maxLength={5} />
    {profile && !locked && <Field name="reason" label="Motivo (obligatorio al corregir el RFC)" maxLength={500} />}
    <p className="text-sm text-slate-500 sm:col-span-2">{locked ? "El RFC está protegido porque este cliente ya tiene ventas." : "Puedes completar los datos fiscales después de registrar al cliente."} Al cambiar el código postal se actualiza la dirección fiscal vigente y se conserva la anterior.</p>
  </>;
}

export function AddressFields({ address, fiscalZip }: { address?: z.infer<typeof CustomerAddressSchema>; fiscalZip?: string }) {
  return <>
    <label className="block text-sm font-medium text-slate-700">Tipo de dirección
      <select name="addressType" className={fieldClass} defaultValue={address?.addressType ?? "SHIPPING"} disabled={!!address}>
        <option value="FISCAL">Fiscal</option><option value="SHIPPING">Entrega</option><option value="BILLING">Facturación</option><option value="OTHER">Otra</option>
      </select>
    </label>
    <Field name="street" label="Calle" value={address?.street} required maxLength={255} />
    <Field name="externalNumber" label="Número exterior" value={address?.externalNumber} maxLength={50} />
    <Field name="internalNumber" label="Número interior" value={address?.internalNumber} maxLength={50} />
    <Field name="neighborhood" label="Colonia" value={address?.neighborhood} maxLength={150} />
    <Field name="city" label="Ciudad" value={address?.city} required maxLength={150} />
    <Field name="municipality" label="Municipio" value={address?.municipality} maxLength={150} />
    <Field name="state" label="Estado" value={address?.state} required maxLength={150} />
    <Field name="country" label="País" value={address?.country ?? "México"} required maxLength={100} />
    <Field name="postalCode" label="Código postal" value={address?.postalCode} required maxLength={20} />
    <p className="text-sm text-slate-500 sm:col-span-2">Una dirección fiscal nueva sustituye a la vigente y conserva su historial.{fiscalZip ? ` Su código postal debe ser ${fiscalZip}; puedes cambiarlo en el perfil fiscal.` : ""}</p>
  </>;
}
export function addressInput(form: FormData) {
  return {
    street: value(form, "street"), externalNumber: nullable(form, "externalNumber"), internalNumber: nullable(form, "internalNumber"),
    neighborhood: nullable(form, "neighborhood"), city: value(form, "city"), municipality: nullable(form, "municipality"),
    state: value(form, "state"), country: value(form, "country"), postalCode: value(form, "postalCode"),
  };
}

export function ContactFields({ contact }: { contact?: z.infer<typeof CustomerContactSchema> }) {
  return <>
    <Field name="name" label="Nombre" value={contact?.name} required maxLength={150} />
    <Field name="lastName" label="Apellidos" value={contact?.lastName} maxLength={150} />
    <Field name="email" label="Correo electrónico" value={contact?.email} type="email" maxLength={255} />
    <Field name="phone" label="Teléfono" value={contact?.phone} maxLength={50} />
    <Field name="position" label="Puesto o función" value={contact?.position} maxLength={150} />
  </>;
}
export function contactInput(form: FormData) {
  return { name: value(form, "name"), lastName: nullable(form, "lastName"), email: nullable(form, "email"), phone: nullable(form, "phone"), position: nullable(form, "position") };
}
