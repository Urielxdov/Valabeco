export type CapitalContributionDto = Readonly<{
  idContribution: string;
  idOwner: string;
  date: string;
  amount: string;
}>;

export type OwnerWithdrawalDto = Readonly<{
  idWithdrawal: string;
  idOwner: string;
  date: string;
  amount: string;
  reason: string | null;
}>;
