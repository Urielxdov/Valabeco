export class BusinessIntelligenceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BusinessIntelligenceError";
  }
}

export class BusinessIntelligenceValidationError extends BusinessIntelligenceError {
  constructor(message: string) {
    super("BI_VALIDATION_ERROR", message);
    this.name = "BusinessIntelligenceValidationError";
  }
}
