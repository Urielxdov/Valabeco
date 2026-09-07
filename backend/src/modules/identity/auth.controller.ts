import { Body, Controller, Post } from "@nestjs/common";

import { LoginUserUseCase } from "./application/use-cases/login-user.use-case";
import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { Public } from "./presentation/http/public.decorator";
import { parseLoginInput, parseRegisterInput } from "./presentation/http/request-parsers";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Public()
  @Post("register")
  async register(@Body() body: Record<string, unknown>) {
    const input = parseRegisterInput(body);
    return this.registerUserUseCase.execute(input);
  }

  @Public()
  @Post("login")
  async login(@Body() body: Record<string, unknown>) {
    const input = parseLoginInput(body);
    return this.loginUserUseCase.execute(input);
  }
}
