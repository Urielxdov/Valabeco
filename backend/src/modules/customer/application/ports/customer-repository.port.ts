import type {
  CreateCustomerInput, UpdateCustomerInput, SaveCustomerTaxProfileInput,
  CreateCustomerAddressInput, UpdateCustomerAddressInput, CreateCustomerContactInput,
  UpdateCustomerContactInput, CustomerStatus, ListCustomersQuery,
  CustomerDto, CustomerDetailDto, CustomerPageDto,
} from "../../../../../../packages/contracts/src/customer";

export interface CustomerRepository {
  list(query: ListCustomersQuery): Promise<CustomerPageDto>;
  get(id: string): Promise<CustomerDetailDto>;
  create(input: CreateCustomerInput, actor: string): Promise<CustomerDto>;
  update(id: string, input: UpdateCustomerInput, actor: string): Promise<CustomerDto>;
  saveTaxProfile(id: string, input: SaveCustomerTaxProfileInput, actor: string): Promise<CustomerDetailDto>;
  addAddress(id: string, input: CreateCustomerAddressInput, actor: string): Promise<CustomerDetailDto>;
  updateAddress(id: string, addressId: string, input: UpdateCustomerAddressInput, actor: string): Promise<CustomerDetailDto>;
  setAddressStatus(id: string, addressId: string, status: CustomerStatus, actor: string): Promise<CustomerDetailDto>;
  addContact(id: string, input: CreateCustomerContactInput, actor: string): Promise<CustomerDetailDto>;
  updateContact(id: string, contactId: string, input: UpdateCustomerContactInput, actor: string): Promise<CustomerDetailDto>;
}
