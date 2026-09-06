export class AccountingApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AccountingApplicationError";
  }
}

export class AccountingNotFoundError extends AccountingApplicationError {
  constructor(message: string) {
    super("ACCOUNTING_NOT_FOUND", message);
    this.name = "AccountingNotFoundError";
  }
}

export class AccountingConflictError extends AccountingApplicationError {
  constructor(message: string) {
    super("ACCOUNTING_CONFLICT", message);
    this.name = "AccountingConflictError";
  }
}

export class AccountingValidationError extends AccountingApplicationError {
  constructor(message: string) {
    super("ACCOUNTING_VALIDATION_ERROR", message);
    this.name = "AccountingValidationError";
  }
}
