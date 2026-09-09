import { DomainError } from "../../../shared/domain/errors";

export function assertCustomerCanBuy(customer: { status: string } | null) {
  if (!customer) throw new DomainError("El cliente no existe.");
  if (customer.status !== "ACTIVE") throw new DomainError("El cliente está inactivo y no admite ventas nuevas.");
}

export function assertRfcChange(previousRfc: string | null, nextRfc: string, hasSales: boolean, reason?: string) {
  if (previousRfc === null || previousRfc === nextRfc) return;
  if (hasSales) throw new DomainError("El RFC no puede modificarse porque el cliente ya tiene ventas registradas.");
  if (!reason?.trim()) throw new DomainError("Indica el motivo de la corrección del RFC.");
}

export function assertFiscalPostalCode(profileZipCode: string | null, addressPostalCode: string | null) {
  if (profileZipCode !== null && addressPostalCode !== null && profileZipCode !== addressPostalCode) {
    throw new DomainError("El código postal fiscal debe coincidir con el de la dirección fiscal vigente.");
  }
}

export function assertIdentifiedCustomer(isGeneric: boolean) {
  if (isGeneric) throw new DomainError("Público general es un registro del sistema y no admite datos fiscales ni cambios de identidad.");
}
