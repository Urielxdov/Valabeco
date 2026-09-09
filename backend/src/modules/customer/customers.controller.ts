import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { z } from "zod";
import {
  CreateCustomerSchema, UpdateCustomerSchema, SaveCustomerTaxProfileSchema,
  CreateCustomerAddressSchema, UpdateCustomerAddressSchema, SetCustomerStatusSchema,
  CreateCustomerContactSchema, UpdateCustomerContactSchema, ListCustomersQuerySchema,
} from "../../../../packages/contracts/src/customer";
import { ManageCustomersUseCase } from "./application/use-cases/manage-customers.use-case";

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException({
    code: "CUSTOMER_VALIDATION_ERROR",
    message: result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; "),
  });
  return result.data;
}
type ActorRequest = { userId: string };

@Controller("customers")
export class CustomersController {
  constructor(private readonly useCase: ManageCustomersUseCase) {}
  @Get() list(@Query() query: unknown) { return this.useCase.list(parse(ListCustomersQuerySchema, query)); }
  @Get(":id") get(@Param("id", ParseUUIDPipe) id: string) { return this.useCase.get(id); }
  @Post() create(@Body() body: unknown, @Req() req: ActorRequest) { return this.useCase.create(parse(CreateCustomerSchema, body), req.userId); }
  @Patch(":id") update(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.update(id, parse(UpdateCustomerSchema, body), req.userId);
  }
  @Post(":id/tax-profile") saveTaxProfile(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.saveTaxProfile(id, parse(SaveCustomerTaxProfileSchema, body), req.userId);
  }
  @Post(":id/addresses") addAddress(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.addAddress(id, parse(CreateCustomerAddressSchema, body), req.userId);
  }
  @Patch(":id/addresses/:addressId") updateAddress(@Param("id", ParseUUIDPipe) id: string, @Param("addressId", ParseUUIDPipe) addressId: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.updateAddress(id, addressId, parse(UpdateCustomerAddressSchema, body), req.userId);
  }
  @Patch(":id/addresses/:addressId/status") setAddressStatus(@Param("id", ParseUUIDPipe) id: string, @Param("addressId", ParseUUIDPipe) addressId: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.setAddressStatus(id, addressId, parse(SetCustomerStatusSchema, body).status, req.userId);
  }
  @Post(":id/contacts") addContact(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.addContact(id, parse(CreateCustomerContactSchema, body), req.userId);
  }
  @Patch(":id/contacts/:contactId") updateContact(@Param("id", ParseUUIDPipe) id: string, @Param("contactId", ParseUUIDPipe) contactId: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.updateContact(id, contactId, parse(UpdateCustomerContactSchema, body), req.userId);
  }
}
