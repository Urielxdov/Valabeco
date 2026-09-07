import { z } from "zod";

export const UserSchema = z.object({
  idUser: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
