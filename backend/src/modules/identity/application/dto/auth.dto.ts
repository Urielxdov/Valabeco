import type { UserDto } from "./user.dto";

export type AuthDto = Readonly<{
  user: UserDto;
  token: string;
}>;
