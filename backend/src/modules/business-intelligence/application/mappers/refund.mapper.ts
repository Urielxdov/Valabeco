import type { Refund } from "../../domain/refund";
import type { RefundDto } from "../dto/refund.dto";

export function toRefundDto(refund: Refund): RefundDto {
  return {
    idRefund: refund.idRefund,
    idSale: refund.idSale,
    date: refund.date.toISOString(),
    amount: refund.amount.toDecimalString(),
    reason: refund.reason,
    status: refund.status,
  };
}
