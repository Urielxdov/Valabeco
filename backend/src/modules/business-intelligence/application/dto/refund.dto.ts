import type { RefundStatus } from "../../domain/enums";

export type RefundDto = Readonly<{
  idRefund: string;
  idSale: string;
  date: string;
  amount: string;
  reason: string;
  status: RefundStatus;
}>;
