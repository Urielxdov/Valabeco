import { InvalidMoneyError } from "./errors";

const MONEY_PATTERN = /^-?\d+(\.\d{1,2})?$/;
const QUANTITY_PATTERN = /^\d+(\.\d{1,4})?$/;

/**
 * Value object monetario. Representa el importe internamente en centavos
 * enteros y nunca opera con `Number`/punto flotante para sumas, restas o
 * multiplicaciones: toda aritmetica de escalado usa `BigInt`.
 */
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

  /**
   * Multiplica el importe por una cantidad decimal (hasta 4 decimales, no
   * negativa) sin pasar por `Number`/punto flotante: escala ambos operandos a
   * enteros, multiplica con `BigInt` y redondea al centavo mas cercano
   * (mitad hacia arriba).
   */
  multiplyByQuantity(quantity: string): Money {
    const normalized = quantity.trim();

    if (!QUANTITY_PATTERN.test(normalized)) {
      throw new InvalidMoneyError(
        "Quantity must be a non-negative decimal string with up to four decimal places.",
      );
    }

    const [units, decimals = ""] = normalized.split(".");
    const scaledQuantity = BigInt(units) * 10_000n + BigInt(decimals.padEnd(4, "0"));
    const scaledProduct = BigInt(this.cents) * scaledQuantity;
    const roundedCents = divideRoundHalfUp(scaledProduct, 10_000n);

    if (
      roundedCents > BigInt(Number.MAX_SAFE_INTEGER) ||
      roundedCents < BigInt(Number.MIN_SAFE_INTEGER)
    ) {
      throw new InvalidMoneyError("Money value exceeds the safe supported range.");
    }

    return Money.fromCents(Number(roundedCents));
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
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

function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const isNegative = numerator < 0n;
  const absoluteNumerator = isNegative ? -numerator : numerator;
  const result = (absoluteNumerator + denominator / 2n) / denominator;

  return isNegative ? -result : result;
}
