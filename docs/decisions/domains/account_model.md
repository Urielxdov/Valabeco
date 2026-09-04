# ADR-01: Dominio Contable Base (`account`, `transaction` y `transaction_entry`)

## Estado
Planificación

## Fecha
2026-09-04

## Contexto

El sistema requiere un modelo de dominio financiero sólido basado en la **contabilidad de doble entrada (partida doble)**. Para garantizar la integridad contable, la auditoría y la consistencia matemática del libro mayor, es necesario definir la estructura estandarizada de las cuentas, las transacciones con sus estados de ciclo de vida y sus entradas individuales.

---

## Estructura Jerárquica del Dominio

Account
├── id_account
├── name
├── description
├── type
└── balance

Transaction
├── id_transaction
├── date
├── description
└── status

TransactionEntry
├── id_transaction_entry
├── id_transaction
├── id_account
├── amount
└── type

---

## Modelado de Entidades

### 1. Entidad Cuenta (`account`)

Representa una cuenta contable individual dentro del plan de cuentas del sistema:

| Campo | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_account` | `UUID` / `BIGINT` | `PK` | Identificador único de la cuenta. |
| `name` | `VARCHAR(255)` | `NOT NULL` | Concepto contable que la cuenta identifica dentro del sistema. |
| `description` | `TEXT` | `NULLABLE` | Detalle del propósito u operaciones que maneja la cuenta. |
| `type` | `ENUM` / `FK` | `NOT NULL` | Naturaleza contable. Asociado a la clave válida en `account_type`. |
| `balance` | `DECIMAL(15,2)`| `DEFAULT 0.00`| Saldo acumulado en la cuenta a un momento determinado. |

#### Tipos de Cuenta (`account_type`)

| Clave | Valor | Descripción | Naturaleza Contable |
| :--- | :--- | :--- | :--- |
| `ASSET` | `"ASSET"` | Activo | Recursos tangibles e intangibles de valor económico (Caja, Banco, Equipo). |
| `LIABILITY` | `"LIABILITY"` | Pasivo | Deudas y obligaciones contraídas con terceros (Préstamos, Proveedores). |
| `EQUITY` | `"EQUITY"` | Patrimonio | Valor neto perteneciente a los propietarios (Activos - Pasivos). |
| `REVENUE` | `"REVENUE"` | Ingreso | Entradas de beneficios económicos por actividades ordinarias (Ventas, Servicios). |
| `EXPENSE` | `"EXPENSE"` | Gasto | Consumo de recursos requeridos para operar (Renta, Nómina, Servicios). |

---

### 2. Entidad Transacción (`transaction`)

Representa un evento financiero completo (encabezado del asiento contable):

| Campo | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_transaction` | `UUID` / `BIGINT` | `PK` | Identificador único del asiento o transacción. |
| `date` | `TIMESTAMP` | `NOT NULL` | Fecha y hora en la que se originó o registró la transacción. |
| `description` | `VARCHAR(500)` | `NOT NULL` | Glosa o justificación de la razón de la transacción. |
| `status` | `ENUM` | `NOT NULL` | Estado del ciclo de vida de la transacción según `TransactionStatus`. |

#### Estado de Transacción (`TransactionStatus`)

enum TransactionStatus {
  DRAFT = "DRAFT",   // Borrador (no afecta saldos)
  POSTED = "POSTED", // Asentado (afecta saldos contables)
  VOIDED = "VOIDED"  // Anulado (desactivado/revertido)
}

| Estado | Descripción | Afecta Balance |
| :--- | :--- | :--- |
| `DRAFT` | Asiento en preparación o revisión. Permite modificaciones. | No |
| `POSTED` | Transacción confirmada y registrada en el libro mayor. Inmutable. | Sí |
| `VOIDED` | Transacción anulada explícitamente sin borrar el historial. | No (Revertido) |

---

### 3. Entidad Detalle de Entrada (`transaction_entry`)

Representa cada movimiento individual (débito o crédito) asociado a una transacción y cuenta específica:

| Campo | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_transaction_entry` | `UUID` / `BIGINT` | `PK` | Identificador único de la línea de detalle. |
| `id_transaction` | `UUID` / `BIGINT` | `FK` | Transacción financiera a la que pertenece la entrada. |
| `id_account` | `UUID` / `BIGINT` | `FK` | Cuenta contable afectada por el movimiento. |
| `amount` | `DECIMAL(15,2)` | `CHECK (> 0)` | Monto monetario positivo de la operación. |
| `type` | `ENUM` / `FK` | `NOT NULL` | Tipo de movimiento según la tabla/enum `EntryType`. |

#### Tipo de Movimiento (`EntryType`)

enum EntryType {
  DEBIT = "DEBIT",   // Debe (Cargar)
  CREDIT = "CREDIT"  // Haber (Acreditar)
}

| Clave | Valor | Concepto | Efecto en Balance |
| :--- | :--- | :--- | :--- |
| `DEBIT` | `"DEBIT"` | Debe / Cargar | Incrementa: `ASSET`, `EXPENSE` | Decrementa: `LIABILITY`, `EQUITY`, `REVENUE` |
| `CREDIT` | `"CREDIT"` | Haber / Acreditar | Incrementa: `LIABILITY`, `EQUITY`, `REVENUE` | Decrementa: `ASSET`, `EXPENSE` |

---

## Ejemplo Ilustrativo: Asiento Contable Equilibrado

Muestra visual de la relación entre `transaction`, `transaction_entry` y la ecuación fundamental de patrimonio:

Transacción #1001: Venta de Servicio [POSTED]
------------------------------------------------------------------
Cuenta (`id_account`)               | Debe (`DEBIT`) | Haber (`CREDIT`)
------------------------------------------------------------------
1010 - Caja General (`ASSET`)       | $150.00        | -
4010 - Ingresos x Venta (`REVENUE`) | -              | $150.00
------------------------------------------------------------------
Total Balanceado                    | $150.00        | $150.00

---

## Decisión

1. **Modificación Única de Saldo (`balance`):** El campo `balance` de la entidad `account` es estrictamente de **solo lectura** y únicamente puede ser modificado mediante la ejecución de un evento de asentado de transacción (`TransactionStatus.POSTED`), aplicando los débitos o créditos correspondientes definidos en sus `transaction_entry`. Queda prohibida cualquier mutación directa de `balance` fuera de este flujo contable.
2. **Invariante de Suma Cero (Partida Doble):** Para que una transacción pase a estado `POSTED`, debe cumplir strictly la condición de balance:
   SUM(Amount_DEBIT) = SUM(Amount_CREDIT)
3. **Atomicidad e Inmutabilidad:** Las transacciones en estado `POSTED` son inmutables. Si se requiere anular o modificar una operación, la transacción cambiará a estado `VOIDED` (o se generará una transacción de reverso/contraasiento), revirtiendo la afectación al saldo.
4. **Restricción de Enum:** Se implementarán `account_type`, `TransactionStatus` y `EntryType` a nivel de base de datos (`ENUM` / `CHECK constraint`) y capa de dominio.
5. **Precisión Numérica:** Todos los campos monetarios (`balance`, `amount`) utilizarán tipos de datos de punto fijo (`DECIMAL(15,2)` / `NUMERIC`), prohibiendo estrictamente tipos de coma flotante (`FLOAT`/`DOUBLE`).

---

## Consecuencias

* **Positivas:**
  * **Integridad Garantizada:** La restricción sobre la actualización de `balance` evita descuadres manuales o incongruencias entre los saldos globales y los historiales de detalle.
  * **Ciclo de Vida Claro:** El estado `DRAFT` permite la preparación y validación de asientos complejos antes de impactar los saldos contables oficiales.
  * **Auditoría Completa:** Trazabilidad total de cada movimiento de saldo vinculado a transacciones registradas e inmutables.
* **Riesgos / Mitigación:**
  * **Concurrencia en Saldos:** Al procesar múltiples transacciones simultáneas que afecten la misma cuenta, se requiere usar bloqueos pesimistas/optimistas (`SELECT FOR UPDATE`) para evitar condiciones de carrera (*race conditions*) al calcular e incrementar el campo `balance`.
