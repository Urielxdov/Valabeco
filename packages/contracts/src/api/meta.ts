import { z } from "zod";

export const ApiMetaSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
});

export type ApiMeta = z.infer<typeof ApiMetaSchema>;
