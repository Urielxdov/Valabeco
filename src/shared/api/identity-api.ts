import { UserSchema } from "@valabeco/contracts";
import { z } from "zod";
import { ApiClient } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const api = new ApiClient(API_BASE_URL);

const DeactivateResultSchema = z.object({
  idUser: z.string().uuid(),
  status: z.literal("INACTIVE"),
});

export const identityApi = {
  listUsers(status?: "ACTIVE" | "INACTIVE", init?: RequestInit) {
    const query = status ? `?status=${status}` : "";
    return api.get(`/users${query}`, z.array(UserSchema), init);
  },

  deactivateUser(idUser: string, init?: RequestInit) {
    return api.post(`/users/${idUser}/deactivate`, DeactivateResultSchema, undefined, init);
  },
};
