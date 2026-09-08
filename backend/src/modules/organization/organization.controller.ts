import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from "@nestjs/common";
import { z } from "zod";
import { AssignPositionSchema, CreateJobPositionSchema, CreatePositionSchema, TransferPositionSchema,
  UpdateJobPositionSchema, UpdatePositionSchema } from "../../../../packages/contracts/src/organization";
import { ManageOrganizationUseCase } from "./application/use-cases/manage-organization.use-case";

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException(result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  return result.data;
}
type ActorRequest = { userId: string };

@Controller("organization")
export class OrganizationController {
  constructor(private readonly useCase: ManageOrganizationUseCase) {}
  @Get("job-positions") listJobs() { return this.useCase.listJobs(); }
  @Post("job-positions") createJob(@Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.createJob(parse(CreateJobPositionSchema, body), req.userId);
  }
  @Patch("job-positions/:id") updateJob(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.updateJob(id, parse(UpdateJobPositionSchema, body), req.userId);
  }
  @Get("positions") listPositions() { return this.useCase.listPositions(); }
  @Post("positions") createPosition(@Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.createPosition(parse(CreatePositionSchema, body), req.userId);
  }
  @Patch("positions/:id") updatePosition(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.updatePosition(id, parse(UpdatePositionSchema, body), req.userId);
  }
  @Get("positions/:id/assignments") history(@Param("id", ParseUUIDPipe) id: string) { return this.useCase.history(id); }
  @Get("users/:id/assignments") userAssignments(@Param("id", ParseUUIDPipe) id: string) { return this.useCase.userAssignments(id); }
  @Post("positions/:id/assignments") assign(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.assign(id, parse(AssignPositionSchema, body).idUser, req.userId);
  }
  @Post("assignments/:id/end") end(@Param("id", ParseUUIDPipe) id: string, @Req() req: ActorRequest) {
    return this.useCase.close(id, "ENDED", req.userId);
  }
  @Post("assignments/:id/cancel") cancel(@Param("id", ParseUUIDPipe) id: string, @Req() req: ActorRequest) {
    return this.useCase.close(id, "CANCELED", req.userId);
  }
  @Post("assignments/:id/transfer") transfer(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: ActorRequest) {
    return this.useCase.transfer(id, parse(TransferPositionSchema, body).idPosition, req.userId);
  }
}
