import { DomainError } from "../../../shared/domain/errors";

export class BusinessIntelligenceDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "BusinessIntelligenceDomainError";
  }
}

export class InvalidSaleError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSaleError";
  }
}

export class InvalidPurchaseError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPurchaseError";
  }
}

export class InvalidExpenseError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExpenseError";
  }
}

export class InvalidLoanError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLoanError";
  }
}

export class InvalidLoanPaymentError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLoanPaymentError";
  }
}

export class InvalidCapitalContributionError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCapitalContributionError";
  }
}

export class InvalidOwnerWithdrawalError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOwnerWithdrawalError";
  }
}

export class InvalidRefundError extends BusinessIntelligenceDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRefundError";
  }
}
