import type { UserLifecycle } from "../ports/user-lifecycle.port";

export class DeactivateUserUseCase {
  constructor(private readonly lifecycle: UserLifecycle) {}
  execute(idUser: string, idActor: string) { return this.lifecycle.deactivate(idUser, idActor); }
}
