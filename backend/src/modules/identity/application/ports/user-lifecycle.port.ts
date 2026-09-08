export interface UserLifecycle {
  deactivate(idUser: string, idActor: string): Promise<{ idUser: string; status: "INACTIVE" }>;
}
