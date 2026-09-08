import type { UserDto } from "../dto/user.dto";
import { toUserDto } from "../mappers/user.mapper";
import type { UserRepository } from "../ports/user-repository.port";

export class ListUsersUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(status?: "ACTIVE" | "INACTIVE"): Promise<UserDto[]> {
    const users = await this.repository.listUsers(status);
    return users.map(toUserDto);
  }
}
