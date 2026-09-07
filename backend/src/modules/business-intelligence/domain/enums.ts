export const BUSINESS_DOCUMENT_STATUSES = ["DRAFT", "CONFIRMED", "CANCELLED"] as const;

export type BusinessDocumentStatus = (typeof BUSINESS_DOCUMENT_STATUSES)[number];

export const LOAN_STATUSES = ["ACTIVE", "PAID", "DEFAULTED", "CANCELLED"] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const REFUND_STATUSES = ["PENDING", "COMPLETED", "CANCELLED"] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];
