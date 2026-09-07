import type { PrismaClient, User as PrismaUser } from "@prisma/client";

import type { UserRepository } from "../../application/ports/user-repository.port";
import type { NewUser, User } from "../../domain/user";
import { restoreUser } from "../../domain/user";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(user: NewUser): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
      },
    });

    return toDomainUser(created);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    return user ? toDomainUser(user) : null;
  }

  async findUserById(idUser: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { idUser } });

    return user ? toDomainUser(user) : null;
  }
}

function toDomainUser(user: PrismaUser): User {
  return restoreUser({
    idUser: user.idUser,
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    createdAt: user.createdAt,
  });
}
