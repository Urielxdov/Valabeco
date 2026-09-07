export class IdentityApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "IdentityApplicationError";
  }
}

export class EmailAlreadyRegisteredError extends IdentityApplicationError {
  constructor(message: string) {
    super("IDENTITY_EMAIL_ALREADY_REGISTERED", message);
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class InvalidCredentialsError extends IdentityApplicationError {
  constructor(message: string) {
    super("IDENTITY_INVALID_CREDENTIALS", message);
    this.name = "InvalidCredentialsError";
  }
}

export class IdentityValidationError extends IdentityApplicationError {
  constructor(message: string) {
    super("IDENTITY_VALIDATION_ERROR", message);
    this.name = "IdentityValidationError";
  }
}
