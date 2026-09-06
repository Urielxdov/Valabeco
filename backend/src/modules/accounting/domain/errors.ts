export class AccountingDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountingDomainError";
  }
}

export class InvalidMoneyError extends AccountingDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMoneyError";
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
