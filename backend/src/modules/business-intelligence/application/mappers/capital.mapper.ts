import type { CapitalContribution, OwnerWithdrawal } from "../../domain/capital";
import type { CapitalContributionDto, OwnerWithdrawalDto } from "../dto/capital.dto";

export function toCapitalContributionDto(
  contribution: CapitalContribution,
): CapitalContributionDto {
  return {
    idContribution: contribution.idContribution,
    idOwner: contribution.idOwner,
    date: contribution.date.toISOString(),
    amount: contribution.amount.toDecimalString(),
  };
}

export function toOwnerWithdrawalDto(withdrawal: OwnerWithdrawal): OwnerWithdrawalDto {
  return {
    idWithdrawal: withdrawal.idWithdrawal,
    idOwner: withdrawal.idOwner,
    date: withdrawal.date.toISOString(),
    amount: withdrawal.amount.toDecimalString(),
    reason: withdrawal.reason,
  };
}
