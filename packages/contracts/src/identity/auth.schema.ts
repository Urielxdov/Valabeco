import { z } from "zod";
import { UserSchema } from "./user.schema";

export const RegisterRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(255),
});

export const LoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string().min(1),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
