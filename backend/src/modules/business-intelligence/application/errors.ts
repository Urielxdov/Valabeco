export class BusinessIntelligenceApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BusinessIntelligenceApplicationError";
  }
}

export class BusinessIntelligenceValidationError extends BusinessIntelligenceApplicationError {
  constructor(message: string) {
    super("BI_VALIDATION_ERROR", message);
    this.name = "BusinessIntelligenceValidationError";
  }
}
