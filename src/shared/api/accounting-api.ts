import {
  AccountSchema,
  CreateAccountRequestSchema,
  CreateTransactionRequestSchema,
  TransactionSchema,
  type CreateAccountRequest,
  type CreateTransactionRequest,
} from "@valabeco/contracts";
import { z } from "zod";
import { ApiClient } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const api = new ApiClient(API_BASE_URL);

export const accountingApi = {
  listAccounts(init?: RequestInit) {
    return api.get("/accounts", z.array(AccountSchema), init);
  },

  createAccount(input: CreateAccountRequest, init?: RequestInit) {
    const request = CreateAccountRequestSchema.parse(input);
    return api.post("/accounts", AccountSchema, request, init);
  },

  listTransactions(init?: RequestInit) {
    return api.get("/transactions", z.array(TransactionSchema), init);
  },

  createTransaction(input: CreateTransactionRequest, init?: RequestInit) {
    const request = CreateTransactionRequestSchema.parse(input);
    return api.post("/transactions", TransactionSchema, request, init);
  },

  getTransaction(idTransaction: string, init?: RequestInit) {
    return api.get(`/transactions/${idTransaction}`, TransactionSchema, init);
  },

  postTransaction(idTransaction: string, init?: RequestInit) {
    return api.post(`/transactions/${idTransaction}/post`, TransactionSchema, undefined, init);
  },

  voidTransaction(idTransaction: string, init?: RequestInit) {
    return api.post(`/transactions/${idTransaction}/void`, TransactionSchema, undefined, init);
  },
};
