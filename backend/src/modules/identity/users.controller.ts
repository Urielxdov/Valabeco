import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from "@nestjs/common";
import { DeactivateUserUseCase } from "./application/use-cases/deactivate-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";

@Controller("users")
export class UsersController {
  constructor(
    private readonly deactivateUser: DeactivateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
  ) {}

  @Get()
  list(@Query("status") status?: string) {
    if (status !== undefined && status !== "ACTIVE" && status !== "INACTIVE") {
      throw new BadRequestException("status must be ACTIVE or INACTIVE.");
    }

    return this.listUsers.execute(status);
  }

  @Post(":id/deactivate")
  deactivate(@Param("id", ParseUUIDPipe) id: string, @Req() request: { userId: string }) {
    return this.deactivateUser.execute(id, request.userId);
  }
}
