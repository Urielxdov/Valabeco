import { Prisma, type PrismaClient, type Customer } from "@prisma/client";
import type { CustomerRepository } from "../../application/ports/customer-repository.port";
import { CustomerApplicationError } from "../../application/errors";
import { assertFiscalPostalCode, assertIdentifiedCustomer, assertRfcChange } from "../../domain/customer-policy";
import { recordAudit } from "../../../../shared/infrastructure/audit-event";
import type {
  CreateCustomerInput, UpdateCustomerInput, SaveCustomerTaxProfileInput,
  CreateCustomerAddressInput, UpdateCustomerAddressInput, CreateCustomerContactInput,
  UpdateCustomerContactInput, CustomerStatus, ListCustomersQuery, CustomerDetailDto,
} from "../../../../../../packages/contracts/src/customer";

const includeDetail = {
  taxProfile: true,
  addresses: { orderBy: { createdAt: "desc" as const } },
  contacts: { orderBy: { name: "asc" as const } },
  _count: { select: { sales: true } },
} satisfies Prisma.CustomerInclude;

function dated<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async write<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      // Todos los escritores de clientes y ventas toman primero el mismo bloqueo de cliente.
      return await this.prisma.$transaction(work, { isolationLevel: "ReadCommitted" });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") throw new CustomerApplicationError("CUSTOMER_CONFLICT", "El RFC ya está registrado o existe otra dirección fiscal vigente.");
        if (error.code === "P2025") throw new CustomerApplicationError("CUSTOMER_NOT_FOUND", "El registro no existe.");
        if (["P2003", "P2034"].includes(error.code)) throw new CustomerApplicationError("CUSTOMER_CONFLICT", "No se pudo guardar por una referencia o cambio concurrente. Actualiza e intenta de nuevo.");
      }
      throw error;
    }
  }

  private async lock(tx: Prisma.TransactionClient, id: string): Promise<Customer> {
    const rows = await tx.$queryRaw<Array<{ id_customer: string }>>`SELECT id_customer FROM customer WHERE id_customer = ${id}::uuid FOR UPDATE`;
    if (!rows.length) throw new CustomerApplicationError("CUSTOMER_NOT_FOUND", "El cliente no existe.");
    return tx.customer.findUniqueOrThrow({ where: { idCustomer: id } });
  }

  private async detail(tx: Prisma.TransactionClient, id: string): Promise<CustomerDetailDto> {
    const row = await tx.customer.findUnique({ where: { idCustomer: id }, include: includeDetail });
    if (!row) throw new CustomerApplicationError("CUSTOMER_NOT_FOUND", "El cliente no existe.");
    const { taxProfile, addresses, contacts, _count, ...customer } = row;
    return {
      ...dated(customer),
      taxProfile: taxProfile ? dated(taxProfile) : null,
      addresses: addresses.map(dated),
      contacts: contacts.map(dated),
      hasTransactions: _count.sales > 0,
    };
  }

  async list(query: ListCustomersQuery) {
    const where: Prisma.CustomerWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { OR: [
        { displayName: { contains: query.search, mode: "insensitive" } },
        { tradeName: { contains: query.search, mode: "insensitive" } },
        { taxProfile: { is: { rfc: { contains: query.search, mode: "insensitive" } } } },
      ] } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where, include: { taxProfile: { select: { rfc: true } } },
        orderBy: [{ displayName: "asc" }, { idCustomer: "asc" }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ], { isolationLevel: "RepeatableRead" });
    return {
      items: rows.map(({ taxProfile, ...row }) => ({ ...dated(row), rfc: taxProfile?.rfc ?? null })),
      total, page: query.page, pageSize: query.pageSize,
    };
  }

  get(id: string) { return this.detail(this.prisma, id); }

  create(input: CreateCustomerInput, actor: string) {
    return this.write(async tx => {
      const row = await tx.customer.create({ data: input });
      await recordAudit(tx, actor, "CREATE_CUSTOMER", "Customer", row.idCustomer, null, row);
      return dated(row);
    });
  }

  update(id: string, input: UpdateCustomerInput, actor: string) {
    return this.write(async tx => {
      const before = await this.lock(tx, id);
      assertIdentifiedCustomer(before.isGeneric);
      const row = await tx.customer.update({ where: { idCustomer: id }, data: input });
      await recordAudit(tx, actor, "UPDATE_CUSTOMER", "Customer", id, before, row);
      return dated(row);
    });
  }

  saveTaxProfile(id: string, input: SaveCustomerTaxProfileInput, actor: string) {
    return this.write(async tx => {
      const customer = await this.lock(tx, id);
      assertIdentifiedCustomer(customer.isGeneric);
      const before = await tx.customerTaxProfile.findUnique({ where: { idCustomer: id } });
      const hasSales = await tx.sale.count({ where: { idCustomer: id } }) > 0;
      const { reason, ...data } = input;
      assertRfcChange(before?.rfc ?? null, data.rfc, hasSales, reason);
      const row = await tx.customerTaxProfile.upsert({
        where: { idCustomer: id }, create: { ...data, idCustomer: id }, update: data,
      });
      await recordAudit(tx, actor, "SAVE_CUSTOMER_TAX_PROFILE", "CustomerTaxProfile", row.idCustomerTaxProfile, before, { ...row, reason: reason ?? null });

      // El perfil es la fuente del CP fiscal. Un cambio conserva la dirección anterior.
      const fiscal = await tx.customerAddress.findFirst({ where: { idCustomer: id, addressType: "FISCAL", status: "ACTIVE" } });
      if (fiscal && fiscal.postalCode !== row.taxZipCode) {
        const { idCustomerAddress } = fiscal;
        const ended = await tx.customerAddress.update({ where: { idCustomerAddress }, data: { status: "INACTIVE" } });
        const replacement = await tx.customerAddress.create({ data: {
          idCustomer: id, addressType: "FISCAL", street: fiscal.street,
          externalNumber: fiscal.externalNumber, internalNumber: fiscal.internalNumber,
          neighborhood: fiscal.neighborhood, city: fiscal.city, municipality: fiscal.municipality,
          state: fiscal.state, country: fiscal.country, postalCode: row.taxZipCode,
        } });
        await recordAudit(tx, actor, "DEACTIVATE_CUSTOMER_ADDRESS", "CustomerAddress", idCustomerAddress, fiscal, ended);
        await recordAudit(tx, actor, "CREATE_CUSTOMER_ADDRESS", "CustomerAddress", replacement.idCustomerAddress, null, replacement);
      }
      return this.detail(tx, id);
    });
  }

  private async checkPostalCode(tx: Prisma.TransactionClient, id: string, type: string, postalCode: string) {
    if (type !== "FISCAL") return;
    const profile = await tx.customerTaxProfile.findUnique({ where: { idCustomer: id } });
    assertFiscalPostalCode(profile?.taxZipCode ?? null, postalCode);
  }

  private async closeFiscal(tx: Prisma.TransactionClient, id: string, actor: string) {
    const before = await tx.customerAddress.findFirst({ where: { idCustomer: id, addressType: "FISCAL", status: "ACTIVE" } });
    if (!before) return;
    const row = await tx.customerAddress.update({ where: { idCustomerAddress: before.idCustomerAddress }, data: { status: "INACTIVE" } });
    await recordAudit(tx, actor, "DEACTIVATE_CUSTOMER_ADDRESS", "CustomerAddress", row.idCustomerAddress, before, row);
  }

  addAddress(id: string, input: CreateCustomerAddressInput, actor: string) {
    return this.write(async tx => {
      assertIdentifiedCustomer((await this.lock(tx, id)).isGeneric);
      await this.checkPostalCode(tx, id, input.addressType, input.postalCode);
      if (input.addressType === "FISCAL") await this.closeFiscal(tx, id, actor);
      const row = await tx.customerAddress.create({ data: { ...input, idCustomer: id } });
      await recordAudit(tx, actor, "CREATE_CUSTOMER_ADDRESS", "CustomerAddress", row.idCustomerAddress, null, row);
      return this.detail(tx, id);
    });
  }

  updateAddress(id: string, addressId: string, input: UpdateCustomerAddressInput, actor: string) {
    return this.write(async tx => {
      assertIdentifiedCustomer((await this.lock(tx, id)).isGeneric);
      const before = await tx.customerAddress.findFirstOrThrow({ where: { idCustomer: id, idCustomerAddress: addressId } });
      if (before.status !== "ACTIVE") throw new CustomerApplicationError("CUSTOMER_CONFLICT", "Las direcciones históricas no se editan. Registra una nueva dirección.");
      await this.checkPostalCode(tx, id, before.addressType, input.postalCode);
      if (before.addressType === "FISCAL") {
        await this.closeFiscal(tx, id, actor);
        const row = await tx.customerAddress.create({ data: { ...input, addressType: "FISCAL", idCustomer: id } });
        await recordAudit(tx, actor, "CREATE_CUSTOMER_ADDRESS", "CustomerAddress", row.idCustomerAddress, null, row);
      } else {
        const row = await tx.customerAddress.update({ where: { idCustomerAddress: addressId }, data: input });
        await recordAudit(tx, actor, "UPDATE_CUSTOMER_ADDRESS", "CustomerAddress", addressId, before, row);
      }
      return this.detail(tx, id);
    });
  }

  setAddressStatus(id: string, addressId: string, status: CustomerStatus, actor: string) {
    return this.write(async tx => {
      assertIdentifiedCustomer((await this.lock(tx, id)).isGeneric);
      const before = await tx.customerAddress.findFirstOrThrow({ where: { idCustomer: id, idCustomerAddress: addressId } });
      if (status === "ACTIVE") await this.checkPostalCode(tx, id, before.addressType, before.postalCode);
      const row = await tx.customerAddress.update({ where: { idCustomerAddress: addressId }, data: { status } });
      await recordAudit(tx, actor, "UPDATE_CUSTOMER_ADDRESS", "CustomerAddress", addressId, before, row);
      return this.detail(tx, id);
    });
  }

  addContact(id: string, input: CreateCustomerContactInput, actor: string) {
    return this.write(async tx => {
      assertIdentifiedCustomer((await this.lock(tx, id)).isGeneric);
      const row = await tx.customerContact.create({ data: { ...input, idCustomer: id } });
      await recordAudit(tx, actor, "CREATE_CUSTOMER_CONTACT", "CustomerContact", row.idCustomerContact, null, row);
      return this.detail(tx, id);
    });
  }

  updateContact(id: string, contactId: string, input: UpdateCustomerContactInput, actor: string) {
    return this.write(async tx => {
      assertIdentifiedCustomer((await this.lock(tx, id)).isGeneric);
      const before = await tx.customerContact.findFirstOrThrow({ where: { idCustomer: id, idCustomerContact: contactId } });
      const row = await tx.customerContact.update({ where: { idCustomerContact: contactId }, data: input });
      await recordAudit(tx, actor, "UPDATE_CUSTOMER_CONTACT", "CustomerContact", contactId, before, row);
      return this.detail(tx, id);
    });
  }
}
