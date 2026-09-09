import {
  CustomerSchema, CustomerDetailSchema, CustomerPageSchema,
  CreateCustomerSchema, UpdateCustomerSchema, SaveCustomerTaxProfileSchema,
  CreateCustomerAddressSchema, UpdateCustomerAddressSchema,
  CreateCustomerContactSchema, UpdateCustomerContactSchema,
  type CreateCustomerInput, type UpdateCustomerInput, type SaveCustomerTaxProfileInput,
  type CreateCustomerAddressInput, type UpdateCustomerAddressInput,
  type CreateCustomerContactInput, type UpdateCustomerContactInput, type CustomerStatus,
} from "@valabeco/contracts";
import { ApiClient } from "./client";

const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
export function customerApi(token: string) {
  const init = { headers: { Authorization: `Bearer ${token}` } };
  return {
    list(query: { search?: string; status?: CustomerStatus; page: number }, signal?: AbortSignal) {
      const params = new URLSearchParams({ page: String(query.page) });
      if (query.search) params.set("search", query.search);
      if (query.status) params.set("status", query.status);
      return api.get(`/customers?${params}`, CustomerPageSchema, { ...init, signal, cache: "no-store" });
    },
    get(id: string, signal?: AbortSignal) { return api.get(`/customers/${id}`, CustomerDetailSchema, { ...init, signal, cache: "no-store" }); },
    create(input: CreateCustomerInput) { return api.post("/customers", CustomerSchema, CreateCustomerSchema.parse(input), init); },
    update(id: string, input: UpdateCustomerInput) { return api.patch(`/customers/${id}`, CustomerSchema, UpdateCustomerSchema.parse(input), init); },
    saveTaxProfile(id: string, input: SaveCustomerTaxProfileInput) { return api.post(`/customers/${id}/tax-profile`, CustomerDetailSchema, SaveCustomerTaxProfileSchema.parse(input), init); },
    addAddress(id: string, input: CreateCustomerAddressInput) { return api.post(`/customers/${id}/addresses`, CustomerDetailSchema, CreateCustomerAddressSchema.parse(input), init); },
    updateAddress(id: string, addressId: string, input: UpdateCustomerAddressInput) { return api.patch(`/customers/${id}/addresses/${addressId}`, CustomerDetailSchema, UpdateCustomerAddressSchema.parse(input), init); },
    setAddressStatus(id: string, addressId: string, status: CustomerStatus) { return api.patch(`/customers/${id}/addresses/${addressId}/status`, CustomerDetailSchema, { status }, init); },
    addContact(id: string, input: CreateCustomerContactInput) { return api.post(`/customers/${id}/contacts`, CustomerDetailSchema, CreateCustomerContactSchema.parse(input), init); },
    updateContact(id: string, contactId: string, input: UpdateCustomerContactInput) { return api.patch(`/customers/${id}/contacts/${contactId}`, CustomerDetailSchema, UpdateCustomerContactSchema.parse(input), init); },
  };
}
