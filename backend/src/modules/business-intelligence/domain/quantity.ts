const ZERO_QUANTITY_PATTERN = /^0+(\.0+)?$/;

/**
 * Verifica que una cantidad de partida (`sale_item`/`purchase_item`) sea
 * mayor a cero sin convertirla a `Number`. El formato ya fue validado por
 * `Money.multiplyByQuantity`; esta funcion solo protege la regla de negocio
 * "quantity > 0" definida en `docs/decisions/domains/BI_model.md`.
 */
export function isZeroQuantity(quantity: string): boolean {
  return ZERO_QUANTITY_PATTERN.test(quantity.trim());
}
