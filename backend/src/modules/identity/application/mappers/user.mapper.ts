import type { User } from "../../domain/user";
import type { UserDto } from "../dto/user.dto";

export function toUserDto(user: User): UserDto {
  return {
    idUser: user.idUser,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
