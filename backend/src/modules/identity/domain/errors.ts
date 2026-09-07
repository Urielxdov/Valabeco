import { DomainError } from "../../../shared/domain/errors";

export class IdentityDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "IdentityDomainError";
  }
}

export class InvalidUserError extends IdentityDomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserError";
  }
}
