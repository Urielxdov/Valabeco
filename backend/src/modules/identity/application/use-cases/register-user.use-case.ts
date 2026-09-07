import { createNewUser } from "../../domain/user";
import { EmailAlreadyRegisteredError } from "../errors";
import type { AuthDto } from "../dto/auth.dto";
import { toUserDto } from "../mappers/user.mapper";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { TokenService } from "../ports/token-service.port";
import type { UserRepository } from "../ports/user-repository.port";

export type RegisterUserInput = Readonly<{
  email: string;
  password: string;
  name: string;
}>;

export class RegisterUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthDto> {
    const existing = await this.repository.findUserByEmail(input.email.trim().toLowerCase());

    if (existing) {
      throw new EmailAlreadyRegisteredError("This email is already registered.");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = createNewUser({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    const created = await this.repository.createUser(user);
    const token = this.tokenService.issue({ idUser: created.idUser });

    return {
      user: toUserDto(created),
      token,
    };
  }
}
