import { InvalidCredentialsError } from "../errors";
import type { AuthDto } from "../dto/auth.dto";
import { toUserDto } from "../mappers/user.mapper";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { TokenService } from "../ports/token-service.port";
import type { UserRepository } from "../ports/user-repository.port";

export type LoginUserInput = Readonly<{
  email: string;
  password: string;
}>;

export class LoginUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthDto> {
    const user = await this.repository.findUserByEmail(input.email.trim().toLowerCase());

    if (!user) {
      throw new InvalidCredentialsError("Email or password is incorrect.");
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new InvalidCredentialsError("Email or password is incorrect.");
    }

    const token = this.tokenService.issue({ idUser: user.idUser });

    return {
      user: toUserDto(user),
      token,
    };
  }
}
