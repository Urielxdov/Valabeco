import { z } from "zod";

export const CustomerTypeSchema = z.enum(["PERSON", "COMPANY"]);
export const CustomerStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const CustomerAddressTypeSchema = z.enum(["FISCAL", "BILLING", "SHIPPING", "OTHER"]);
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => text(max).nullable().optional();

export const CreateCustomerSchema = z.object({
  customerType: CustomerTypeSchema,
  displayName: text(255),
  tradeName: optionalText(255),
}).strict();
export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  status: CustomerStatusSchema.optional(),
}).strict().refine(value => Object.keys(value).length > 0, "Indica al menos un cambio.");

export const SaveCustomerTaxProfileSchema = z.object({
  rfc: z.string().trim().toUpperCase().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "El RFC debe tener 12 o 13 caracteres y un formato válido."),
  legalName: text(255),
  taxRegime: z.string().regex(/^\d{3}$/, "El régimen debe tener 3 dígitos."),
  taxZipCode: z.string().regex(/^\d{5}$/, "El código postal fiscal debe tener 5 dígitos."),
  reason: text(500).optional(),
}).strict();

export const CreateCustomerAddressSchema = z.object({
  addressType: CustomerAddressTypeSchema,
  street: text(255),
  externalNumber: optionalText(50),
  internalNumber: optionalText(50),
  neighborhood: optionalText(150),
  city: text(150),
  municipality: optionalText(150),
  state: text(150),
  country: text(100),
  postalCode: text(20),
}).strict();
export const UpdateCustomerAddressSchema = CreateCustomerAddressSchema.omit({ addressType: true });
export const SetCustomerStatusSchema = z.object({ status: CustomerStatusSchema }).strict();

export const CreateCustomerContactSchema = z.object({
  name: text(150),
  lastName: optionalText(150),
  email: z.string().trim().email().max(255).nullable().optional(),
  phone: optionalText(50),
  position: optionalText(150),
}).strict();
export const UpdateCustomerContactSchema = CreateCustomerContactSchema.extend({
  status: CustomerStatusSchema.optional(),
}).strict();

const timestamps = { createdAt: z.string().datetime(), updatedAt: z.string().datetime() };
export const CustomerSchema = z.object({
  idCustomer: z.string().uuid(),
  customerType: CustomerTypeSchema,
  displayName: z.string(),
  tradeName: z.string().nullable(),
  isGeneric: z.boolean(),
  status: CustomerStatusSchema,
  ...timestamps,
});
export const CustomerTaxProfileSchema = SaveCustomerTaxProfileSchema.omit({ reason: true }).extend({
  idCustomerTaxProfile: z.string().uuid(),
  idCustomer: z.string().uuid(),
  ...timestamps,
});
export const CustomerAddressSchema = CreateCustomerAddressSchema.extend({
  idCustomerAddress: z.string().uuid(),
  idCustomer: z.string().uuid(),
  status: CustomerStatusSchema,
  ...timestamps,
});
export const CustomerContactSchema = CreateCustomerContactSchema.extend({
  idCustomerContact: z.string().uuid(),
  idCustomer: z.string().uuid(),
  status: CustomerStatusSchema,
  ...timestamps,
});
export const CustomerDetailSchema = CustomerSchema.extend({
  taxProfile: CustomerTaxProfileSchema.nullable(),
  addresses: z.array(CustomerAddressSchema),
  contacts: z.array(CustomerContactSchema),
  hasTransactions: z.boolean(),
});
export const ListCustomersQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  status: CustomerStatusSchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
export const CustomerPageSchema = z.object({
  items: z.array(CustomerSchema.extend({ rfc: z.string().nullable() })),
  total: z.number().int().nonnegative(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type SaveCustomerTaxProfileInput = z.infer<typeof SaveCustomerTaxProfileSchema>;
export type CreateCustomerAddressInput = z.infer<typeof CreateCustomerAddressSchema>;
export type UpdateCustomerAddressInput = z.infer<typeof UpdateCustomerAddressSchema>;
export type CreateCustomerContactInput = z.infer<typeof CreateCustomerContactSchema>;
export type UpdateCustomerContactInput = z.infer<typeof UpdateCustomerContactSchema>;
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;
export type ListCustomersQuery = z.infer<typeof ListCustomersQuerySchema>;
export type CustomerDto = z.infer<typeof CustomerSchema>;
export type CustomerDetailDto = z.infer<typeof CustomerDetailSchema>;
export type CustomerPageDto = z.infer<typeof CustomerPageSchema>;
