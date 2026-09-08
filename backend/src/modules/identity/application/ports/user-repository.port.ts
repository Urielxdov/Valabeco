import type { NewUser, User } from "../../domain/user";

export interface UserRepository {
  createUser(user: NewUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(idUser: string): Promise<User | null>;
  listUsers(status?: "ACTIVE" | "INACTIVE"): Promise<User[]>;
}
