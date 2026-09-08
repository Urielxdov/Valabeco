import { AuditEventSchema } from "@valabeco/contracts";
import { z } from "zod";
import { ApiClient } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const api = new ApiClient(API_BASE_URL);

export const auditApi = {
  listRecent(limit?: number, init?: RequestInit) {
    const query = limit ? `?limit=${limit}` : "";
    return api.get(`/audit-events${query}`, z.array(AuditEventSchema), init);
  },
};
