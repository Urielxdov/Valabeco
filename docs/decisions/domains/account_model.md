# ADR-01: Dominio Contable Base (`account`, `transaction` y `transaction_entry`)

## Estado
Realizado para el alcance contable base — revisado el 2026-09-08.

Están implementadas las cuentas, los asientos y sus partidas, el asentado y la
anulación con actualización atómica de saldos. La integración con BI y la
auditoría general quedan pendientes.

## Implementación actual

El módulo [accounting](../../../backend/src/modules/accounting/) contiene dominio,
políticas contables, casos de uso, puertos, repositorio Prisma y controladores
NestJS. Los [contratos HTTP](../../../packages/contracts/src/accounting/) usan
Zod, UUID, nombres camelCase e importes como cadenas decimales. Todas las rutas
requieren la autenticación global.

| Método | Ruta | Operación |
| :--- | :--- | :--- |
| GET / POST | `/accounts` | Listar / crear cuentas con saldo inicial cero |
| GET / POST | `/transactions` | Listar / crear asientos en `DRAFT` |
| GET | `/transactions/:idTransaction` | Consultar asiento con partidas |
| POST | `/transactions/:idTransaction/post` | Asentar y afectar saldos |
| POST | `/transactions/:idTransaction/void` | Anular y revertir saldos si estaba asentado |

No hay endpoints de edición de borradores, eliminación ni modificación directa
de saldos. Las operaciones `post` y `void` devuelven HTTP 200.

### Ciclo de vida implementado

```text
DRAFT --post--> POSTED --void--> VOIDED
  |
  +------------void-----------> VOIDED
```

- Crear un asiento exige al menos dos partidas con importe positivo y cuentas
  existentes. El estado inicial siempre es `DRAFT`; no afecta los saldos.
- Asentar exige `SUM(DEBIT) = SUM(CREDIT)` y estado `DRAFT`. Un borrador puede
  estar desbalanceado hasta que se intente asentar.
- Anular un borrador solo cambia su estado. Anular un asiento `POSTED` aplica
  los deltas inversos y conserva sus partidas. No se crea un contraasiento separado.
- Un asiento `VOIDED` no puede volver a anularse ni asentarse.
- `ASSET` y `EXPENSE` aumentan con débito; `LIABILITY`, `EQUITY` y `REVENUE`
  aumentan con crédito. El movimiento contrario reduce su saldo.

### Persistencia, precisión y concurrencia

La migración [20260904220000_init_accounting](../../../prisma/migrations/20260904220000_init_accounting/migration.sql)
crea tablas con UUID, enums `account_type`, `transaction_status` y `entry_type`,
FK restrictivas y `CHECK (amount > 0)` en las partidas.

El dominio opera con `Money` basado en centavos enteros seguros de JavaScript
(`Number.isSafeInteger`); la multiplicación por cantidades usa `bigint`.
PostgreSQL guarda `DECIMAL(15,2)`. `account.balance` es el saldo materializado de los movimientos
vigentes. Para reconstruirlo deben considerarse las partidas de asientos `POSTED`
y el signo correspondiente al tipo de cuenta.

El repositorio ejecuta el cambio de estado y los incrementos de saldo en una
misma transacción Prisma. El cambio usa `updateMany` condicionado al estado
esperado y comprueba que haya actualizado un registro; una operación concurrente
incompatible produce conflicto. Los saldos se modifican con incrementos atómicos,
sin leer un saldo previo para sobrescribirlo. No se usa `SELECT FOR UPDATE`
explícito ni un mecanismo de reintentos en este repositorio.

La partida doble y las transiciones se validan en dominio y aplicación; no
existen triggers SQL que impongan esas reglas ante escrituras directas.

### Pendientes y límites

- Integrar eventos de [BI](./BI_model.md) con políticas que seleccionen cuentas
  y eviten asientos duplicados. Actualmente el registro de BI no afecta saldos.
- Registrar actor, instante y motivo de asentado/anulación en la auditoría
  general. Conservar partidas no constituye todavía una auditoría completa.
- Implementar edición de borradores si se necesita el flujo previsto por el modelo.
- Añadir reconciliación del saldo materializado y pruebas de integración de
  asentado/anulación concurrentes sobre PostgreSQL.
- Definir cierres de períodos, permisos contables y políticas de contraasientos
  si se amplía el alcance del módulo.

### Verificación

Existen pruebas de las invariantes de transacción, signos y reversión de deltas,
y del caso de uso de asentado. El caso de uso utiliza un repositorio de prueba;
esa cobertura no demuestra por sí sola el comportamiento concurrente de PostgreSQL.

```sh
npm run test:backend
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

Estos comandos permiten verificar el código y preparar la base de destino;
la existencia de la migración no acredita que esté aplicada en cada entorno.

## Fecha
2026-09-04

## Contexto

El sistema requiere un modelo de dominio financiero sólido basado en la **contabilidad de doble entrada (partida doble)**. Para garantizar la integridad contable, la auditoría y la consistencia matemática del libro mayor, es necesario definir la estructura estandarizada de las cuentas, las transacciones con sus estados de ciclo de vida y sus entradas individuales.

---

## Estructura Jerárquica del Dominio
````
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
````
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
| `DRAFT` | Asiento en preparación o revisión. Edición todavía no expuesta por la API. | No |
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
| `DEBIT` | `"DEBIT"` | Debe / Cargar | Incrementa `ASSET`, `EXPENSE`; decrementa `LIABILITY`, `EQUITY`, `REVENUE` |
| `CREDIT` | `"CREDIT"` | Haber / Acreditar | Incrementa `LIABILITY`, `EQUITY`, `REVENUE`; decrementa `ASSET`, `EXPENSE` |

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

1. **Modificación de Saldo (`balance`):** La API crea cuentas con saldo cero y modifica el saldo únicamente al asentar una transacción o al anular una previamente asentada. Aplica los deltas de sus partidas o los deltas inversos, respectivamente. El saldo es de solo lectura para el consumidor de la API.
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
  * **Historial de Partidas:** Se conservan las partidas y el estado del asiento. La auditoría de actores y cambios sigue pendiente.
* **Riesgos / Mitigación:**
  * **Concurrencia en Saldos:** Al procesar múltiples transacciones simultáneas que afecten la misma cuenta, se requiere usar bloqueos pesimistas/optimistas (`SELECT FOR UPDATE`) para evitar condiciones de carrera (*race conditions*) al calcular e incrementar el campo `balance`.
