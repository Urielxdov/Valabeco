import type { CustomerRepository } from "../ports/customer-repository.port";
import type {
  CreateCustomerInput, UpdateCustomerInput, SaveCustomerTaxProfileInput,
  CreateCustomerAddressInput, UpdateCustomerAddressInput, CreateCustomerContactInput,
  UpdateCustomerContactInput, CustomerStatus, ListCustomersQuery,
} from "../../../../../../packages/contracts/src/customer";

// El repositorio garantiza las reglas que dependen de lecturas y escrituras atómicas.
export class ManageCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}
  list(query: ListCustomersQuery) { return this.repository.list(query); }
  get(id: string) { return this.repository.get(id); }
  create(input: CreateCustomerInput, actor: string) { return this.repository.create(input, actor); }
  update(id: string, input: UpdateCustomerInput, actor: string) { return this.repository.update(id, input, actor); }
  saveTaxProfile(id: string, input: SaveCustomerTaxProfileInput, actor: string) { return this.repository.saveTaxProfile(id, input, actor); }
  addAddress(id: string, input: CreateCustomerAddressInput, actor: string) { return this.repository.addAddress(id, input, actor); }
  updateAddress(id: string, addressId: string, input: UpdateCustomerAddressInput, actor: string) { return this.repository.updateAddress(id, addressId, input, actor); }
  setAddressStatus(id: string, addressId: string, status: CustomerStatus, actor: string) { return this.repository.setAddressStatus(id, addressId, status, actor); }
  addContact(id: string, input: CreateCustomerContactInput, actor: string) { return this.repository.addContact(id, input, actor); }
  updateContact(id: string, contactId: string, input: UpdateCustomerContactInput, actor: string) { return this.repository.updateContact(id, contactId, input, actor); }
}
