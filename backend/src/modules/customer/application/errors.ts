export class CustomerApplicationError extends Error {
  constructor(public readonly code: "CUSTOMER_NOT_FOUND" | "CUSTOMER_CONFLICT", message: string) {
    super(message);
    this.name = "CustomerApplicationError";
  }
}
