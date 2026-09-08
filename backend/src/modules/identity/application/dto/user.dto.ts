export type UserDto = Readonly<{
  idUser: string;
  email: string;
  name: string;
  createdAt: string;
  status: "ACTIVE" | "INACTIVE";
}>;
