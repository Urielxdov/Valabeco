import { DomainError } from "../../../shared/domain/errors";

export class AccountingDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "AccountingDomainError";
  }
}

export class InvalidAccountError extends AccountingDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAccountError";
  }
}

export class InvalidTransactionError extends AccountingDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionError";
  }
}
