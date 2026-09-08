import { Controller, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { DeactivateUserUseCase } from "./application/use-cases/deactivate-user.use-case";

@Controller("users")
export class UsersController {
  constructor(private readonly deactivateUser: DeactivateUserUseCase) {}
  @Post(":id/deactivate")
  deactivate(@Param("id", ParseUUIDPipe) id: string, @Req() request: { userId: string }) {
    return this.deactivateUser.execute(id, request.userId);
  }
}
