import { InvalidMoneyError } from "./errors";

const MONEY_PATTERN = /^-?\d+(\.\d{1,2})?$/;

export class Money {
  private constructor(private readonly cents: number) {}

  static zero(): Money {
    return new Money(0);
  }

  static fromDecimal(value: string): Money {
    const normalized = value.trim();

    if (!MONEY_PATTERN.test(normalized)) {
      throw new InvalidMoneyError(
        "Money values must be decimal strings with up to two decimal places.",
      );
    }

    const sign = normalized.startsWith("-") ? -1 : 1;
    const unsigned = normalized.replace("-", "");
    const [units, decimals = ""] = unsigned.split(".");
    const cents = Number.parseInt(units, 10) * 100 + Number.parseInt(decimals.padEnd(2, "0"), 10);
    const signedCents = sign * cents;

    if (!Number.isSafeInteger(signedCents)) {
      throw new InvalidMoneyError("Money value exceeds the safe supported range.");
    }

    return new Money(signedCents);
  }

  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents)) {
      throw new InvalidMoneyError("Money cents must be a safe integer.");
    }

    return new Money(cents);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  negate(): Money {
    return Money.fromCents(-this.cents);
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  toDecimalString(): string {
    const sign = this.cents < 0 ? "-" : "";
    const absoluteCents = Math.abs(this.cents);
    const units = Math.trunc(absoluteCents / 100);
    const cents = String(absoluteCents % 100).padStart(2, "0");

    return `${sign}${units}.${cents}`;
  }
}
