# ADR-02: Dominio de Inteligencia de Negocio Base 

## Estado
Implementación parcial — revisado el 2026-09-08.

El registro y la consulta de documentos de negocio están implementados. La
integración automática con Contabilidad descrita en este ADR sigue pendiente.

## Implementación actual

El módulo [business-intelligence](../../../backend/src/modules/business-intelligence/)
separa dominio, casos de uso, puertos, repositorio Prisma y controladores NestJS.
Los [contratos compartidos](../../../packages/contracts/src/business-intelligence/)
definen la validación HTTP con Zod. Las rutas requieren la autenticación global.

| Método | Ruta | Operación |
| :--- | :--- | :--- |
| GET / POST | `/bi/sales` | Listar / crear ventas con partidas |
| GET / POST | `/bi/purchases` | Listar / crear compras con partidas |
| GET / POST | `/bi/expenses` | Listar / crear gastos |
| GET / POST | `/bi/loans` | Listar préstamos con pagos / crear préstamo |
| POST | `/bi/loan-payments` | Registrar pago de préstamo |
| GET / POST | `/bi/capital-contributions` | Listar / crear aportaciones |
| GET / POST | `/bi/owner-withdrawals` | Listar / crear retiros |
| GET / POST | `/bi/refunds` | Listar / crear reembolsos |

Los cuerpos HTTP usan nombres en camelCase, UUID y cadenas decimales para
importes, cantidades y tasas. Por ejemplo, una venta recibe:

```json
{
  "idCustomer": "11111111-1111-4111-8111-111111111111",
  "tax": "16.00",
  "items": [
    { "description": "Servicio", "quantity": "1", "unitPrice": "100.00" }
  ]
}
```

El servidor calcula `subtotal = 100.00` y `total = 116.00`. `date` es opcional
en las altas salvo las fechas de inicio y vencimiento del préstamo.

### Reglas implementadas y persistencia

- Ventas y compras requieren partidas, cantidades positivas, precios no negativos
  e impuestos no negativos. El subtotal suma los importes de las partidas y el
  total agrega el impuesto. `Money` guarda centavos como enteros seguros de
  JavaScript y usa `bigint` para multiplicar cantidades y redondear cada producto
  al centavo; la API transporta cadenas decimales.
- Gastos, préstamos, pagos, aportaciones, retiros y reembolsos requieren importes
  positivos. Los pagos validan `amount = principalAmount + interestAmount`.
- El vencimiento del préstamo no puede ser anterior al inicio.
- La migración [20260905221624_bi_model](../../../prisma/migrations/20260905221624_bi_model/migration.sql)
  crea las tablas, enums, índices, claves foráneas internas y restricciones `CHECK`.
  Los identificadores físicos son UUID; el dinero usa `DECIMAL(15,2)`, las
  cantidades `DECIMAL(15,4)` y la tasa `DECIMAL(8,4)`.
- Las FK internas unen partidas con documentos, pagos con préstamos y reembolsos
  con ventas; usan `ON DELETE RESTRICT`. Las referencias a clientes, proveedores,
  terceros, prestamistas y propietarios son UUID sin FK en el esquema actual.

### Alcance de los estados

Venta, compra y gasto comparten el enum físico `business_document_status`.
Sus altas aceptan `DRAFT`, `CONFIRMED` o `CANCELLED`, con `DRAFT` por defecto.
Préstamos y reembolsos aceptan sus estados declarados y usan `ACTIVE` y `PENDING`
por defecto. No existen endpoints de transición, edición o eliminación.
Registrar un documento como `CONFIRMED` no genera un asiento contable.

### Pendientes para completar el ADR

- Emitir y procesar eventos de negocio con políticas contables, vínculo entre
  documento y asiento y protección contra contabilización duplicada.
- Definir transiciones de confirmación, cancelación y ejecución; impedir saltos
  arbitrarios de estado durante la creación.
- Integrar los catálogos externos y sus claves foráneas.
- Limitar reembolsos acumulados al importe elegible de la venta y validar su estado.
- Controlar el principal pendiente, sobrepagos y estado del préstamo; calcular
  intereses y actualizar `PAID` cuando corresponda.
- Resolver una diferencia del contrato de pagos: HTTP exige ambos componentes
  estrictamente positivos, mientras dominio y SQL permiten que uno sea cero.
- Registrar actor y cambios de estas operaciones en la auditoría general.

### Verificación y referencias

Existen pruebas de ventas, préstamos, pagos y del caso de uso de creación de
ventas. No equivalen a cobertura completa de todos los documentos ni de su
integración contable. Se ejecutan con `npm run test:backend`.

Para aplicar las migraciones del proyecto y generar el cliente:

```sh
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

El estado de despliegue de cada base debe comprobarse por separado. El modelo
conceptual siguiente conserva las relaciones y flujos objetivo; los pendientes
anteriores indican qué partes todavía no están implementadas.

## Fecha 
2026-09-05

## Contexto
Se requiere aplicar reglas de negocio que conecten directamente con el módulo **account** para realizar acciones que afecten a las finanzas. La finalidad es reducir el riesgo en la captura de datos, garantizando que cada acción de negocio tenga repercusiones en los registros contables del sistema.

## Estructura Jerárquica
````
sale
├── id_sale
├── id_customer
├── date
├── subtotal
├── tax
├── total
└── status

sale_item
├── id_sale_item
├── id_sale
├── description
├── quantity
└── unit_price

purchase
├── id_purchase
├── id_supplier
├── date
├── subtotal
├── tax
├── total
└── status

purchase_item
├── id_purchase_item
├── id_purchase
├── description
├── quantity
└── unit_price

purchase_item podría generar:
transaction
├── transaction_entry -> equipment
├── transaction_entry -> VAT
└── transaction_entry -> Bank

expense
├── id_expense
├── id_party
├── date
├── description
├── amount
└── status

loan
├── id_loan
├── id_lender
├── principal
├── interest_rate
├── start_date
├── maturity_date
└── status

loan_payment
├── id_loan_payment
├── id_loan
├── date
├── amount
├── principal_amount
└── interest_amount

capital_contribution
├── id_contribution
├── id_owner
├── date
└── amount

owner_withdrawal
├── id_withdrawal
├── id_owner
├── date
├── amount
└── reason

refund
├── id_refund
├── id_sale
├── date
├── amount
├── reason
└── status
````
---

## Modelado de Entidades

### 1. Entidad de Venta (`sale`)
Representa la operación comercial mediante la cual la empresa proporciona bienes o servicios a un cliente a cambio de una contraprestación.

| Campo | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_sale` | UUID / BIGINT | PK | Identificador único de la venta |
| `id_customer` | UUID / BIGINT | FK, NOT NULL | Cliente asociado a la venta |
| `date` | TIMESTAMP | NOT NULL | Fecha y hora en que ocurrió la venta |
| `subtotal` | DECIMAL(15, 2) | NOT NULL | Valor de los bienes o servicios antes de impuestos |
| `tax` | DECIMAL(15, 2) | NOT NULL | Impuestos asociados a la venta |
| `total` | DECIMAL(15, 2) | NOT NULL | Importe total de la venta |
| `status` | ENUM | NOT NULL | Estado de la operación comercial |

#### Estado de la Venta (`sales_status`)

enum sales_status {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED"
}

| Estado | Descripción |
| :--- | :--- |
| `DRAFT` | Venta en preparación |
| `CONFIRMED` | Venta confirmada y válida para el negocio |
| `CANCELLED` | Venta cancelada sin eliminar del historial |

#### Reglas de Venta
- Una venta puede contener uno o mas `sale_item`
- `subtotal` debe corresponder a la suma de los importes de sus partidas
- `total` debe corresponder a `subtotal + tax`
- Una venta confirmada representa un hecho economico que puede generar un evento contable
- La venta no debe crear directamente una `transaction`; el dominio contable recibirá el evento correspondiente cuando se implemente la integración.

---
### 2. Entidad Detalle de venta (`sale_item`)
Representa un bien o servicio individual incluido dentro de una venta
| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_sale_item` | UUID / BIGINT | PK | Identificador de la partida |
| `id_sale` | UUID / BIGINT | FK, NOT NULL | Venta a la que pertenece la partida |
| `description` | VARCHAR(255) | NOT NULL | Descripción del bien o servicio vendido |
| `quantity` | DECIMAL (15, 4) | CHECK(> 0) | Cantidad vendida |
| `unit_price` | DECIMAL(15, 2) | CHECK(>=0) | Precio unitario de la partida |
El importe de la partida se obtiene conceptualmente mediante: 
quantity x unit_price
No es necesario almacenar un subtotal por partida si puede derivarse estos valores

---
### 3. Entidad Compra (`purchase`)
Representa la adquisición de bienes o servicios por parte de la empresa a un proveedor

| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_purchase` | UUID / BIGINT | PK | Identificador unico de la compra |
| `id_supplier` | UUID / BIGINT | FK, NOT NULL | Proveedor asociado a la compra |
| `date` | TIMESTAMP | NOT NULL | Fecha y hora de la compra | 
| `subtotal` | DECIMAL(15,2) | NOT NULL | Valor de los bienes o servicios antes de impuestos |
| `tax` | DECIMAL(15,2) | NOT NULL | Impuestos asociados a la compra |
| `total` | DECIMAL(15,2) | NOT NULL | Importe total de la compra |
| `status` | ENUM | NOT NULL | Estado de la operacion |

#### Estado de Compra (`purchase_status`)
````

enum purchase_status {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED"
}

````

| Estado | Descripcion |
| :--- | :--- |
| `DRAFT` | Compra en preparacion |
| `CONFIRMED` | Compra confirmada y valida |
| `CANCELLED` | Compra cancelada conservando el historial |

---

### 4. Entidad de detalle de compra (purchase_item)
Representa un bien o servicio individual adquirido dentro de una compra 
| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_purchase_item` | UUID / BIGINT | PK | Identificador unico de la partida |
| `id_purchase` | UUID / BIGINT | FK, NOT NULL | Compra a la que pertenece la partida |
| `description` | VARCHAR(255) | NOT NULL | Descripcion del bien o servicio adquirido |
| `quantity` | DECIMAL(15, 4) | CHECK(> 0) | Cantidad adquirida |
| `unit_price` | DECIMAL(15,2) | CHECK(>=0) | Precio unitario |

---

### 5. Entidad Gasto (`expense`)
Representa un consumo de recursos que cosntituye un gasto para la empresa, independientemente de si ha sido pagado inmediatamente

| Campo | Tipo de Datos | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_expense` | UUID / BIGINT | PK | Identificador unico del gasto |
| `id_party` | UUID / BIGINT | FK, NULLABLE | Persona o entidad relacionada con el gasto |
| `date` | TIMESTAMP | NOT NULL | Fecha en que se reconoce el gasto |
| `description` | VARCHAR(500) | NOT NULL | Concepto o motivo del gasto |
| `amount` | DECIMAL(15, 2) | CHECK(> 0) | Importe del gasto |
| `status` | ENUM | NOT NULL | Estado del gasto |

Estado de Gasto (`expense_status`)

````
enum ExpenseStatus 
{ 
    DRAFT = "DRAFT", 
    CONFIRMED = "CONFIRMED", 
    CANCELLED = "CANCELLED" 
}
````

Un gasto puede representar tanto:

Gasto reconocido y pagado inmediatamente
    Gasto DEBIR
    Banco CREDIT

Gasto reconocido a credito
    Gasto DEBIT
    Cuentas por pagar CREDIT
y posteriormente

Cuentas por pagar DEBIR
Banco CREDIT

Por lo tanto, `Expense` representa el hecho economico del gasto, no necesariamente el movimiento de dinero

---
### 6. Entidad Prestamo (`loan`)
Representa una obligacion financiera mediante la cual la empresa recibe recursos de un prestamista y adquiere el compromiso de devolverlos bajor determinadas condiciones

| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_loan` | UUID / BIGINT | PK | Identificador unico del prestamo |
| `id_lender` | UUID / BIGINT | FK, NOT NULL | Entidad que proporciona el prestamo |
| `principal` | DECIMAL(15, 2) | CHECK(> 0) | Capital principal recibido |
| `interest_rate` | DECIMAL(8,4) | CHECK(>=0) | Tasa de interes acordada |
| `start_date` | DATE | NOT NULL | Fecha de inicio del prestamo | 
| `maturity_date` | DATE | NOT NULL | Fecha limite o vencimiento del prestamo |
| `status` | ENUM | NOT NULL | Estado del prestamo |

Estado de prestamo (`loan_status`)
````
enum loan_status {
    ACTIVE = "ACTIVE", 
    PAID = "PAID", 
    DEFAULTED = "DEFAULTED", 
    CANCELLED = "CANCELLED"
}
````

### 7. Entidad Pago de Prestamo (`loan_payment`)
Representa un pago realizado sobre una obligacion financiera

| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_loan_payment` | UUID / BIGINT | PK | Identificador unico del pago |
| `id_loan` | UUID / BIGINT | FK, NOT NULL | Prestamo al que se aplica el pago |
| `date` | TIMESTAMP | NOT NULL | Fecha del pago |
| `amount` | DECIMAL(15,2) | CHECK(>0) | Importe pagado |
| `principal_amount` | DECIMAL(15,2) | CHECK(>=0) | Parte del pago destinada a reducir el principal | 
| `interest_amount` | DECIMAL(15,2) | CHECK(>=0) | Parte del pago correspondiente a intereses |

Regla
amount = principal_amount + interest_amount

El pago puede generar diferentes movimiento contable segun la composicion del importe

---
### 8. Entidad Aportacion de Capital(`capital_contribution`)
Representa recursos aportados por un propietario a la empresa

| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_contribution` | UUID / BIGINT | PK | Identificador unico de la aportación |
| `id_owner` | UUID / BIGINT | FK, NOT NULL | Propietario que realiza la aportación | 
| `date` | TIMESTAMP | NOT NULL | Fecha de la aportacion |
| `amount` | DECIMAL(15,2) | CHECK(> 0) | Importe aportado | 

La entidad no necesita conocer que cuenta contable recibe el dinero. Esa desicion pertenece al dominio contable

Ejemplo:
````
CapitalContribution 
    ↓ 
CapitalContributionCreated 
    ↓ 
Accounting Policy 
    ↓ 
Banco DEBIT 
Capital CREDIT
````

---
### 9. Entidad Retiro del Propietario
Representa recursos retirados de la empresa por uno de sus propietarios

| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_withdrawal` | UUID / BIGINT | PK | Identificador unico del retiro |
| `id_owner` | UUID / BIGINT | FK, NOT NULL | Propietrario que realiza el retiro | 
| `date` | TIMESTAMP | NOT NULL | Fecha del retiro |
| `amount` | DECIMAL(15,2) | CHECK(> 0) | Importe retirado |
| `reason` | VARCHAR(500) | NULLABLE | Motivo o descripcion del retiro | 
---
### 10. Entidad Reembolso (`refund`)
Representa la devolucion total o parcial de un improte asociado a una venta previamente realizada

| Campo | Tipo de Dato | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_refund` | UUID / BIGINT | PK | Identificador unico del rembolso |
| `id_sale` | UUID / BIGINT | FK, NOT NULL | Venta relacionada con el reembolso | 
| `date` | TIMESTAMP | NOT NULL | Fecha del reembolso |
| `amount` | DECIMAL(15, 2) | CHECK(> 0) | Importe reembolsado | 
| `reason` | VARCHAR(500) | NOT NULL | Motivo del reembolso |
| `status` | ENUM | NOT NULL | Estado del reembolso |

#### Estado de Reembolso (`refund_status`)
````
enum RefundStatus { 
    PENDING = "PENDING", 
    COMPLETED = "COMPLETED", 
    CANCELLED = "CANCELLED" 
}
````

| Estado | Descripcion |
| :--- | :--- |
| `PENDING` | Reembolso solicitado pero todavia no ejecutado |
| `COMPLETED` | Reembolso realizado |
| `CANCELLED` | Solicitud de reembolso cancelada |

### Desiciones tomadas sobre ADR-01
1. `balance`: conceptualmente no debera ser la fuente de verdad. Los `transaction_entry` son los que determinan el saldo; `balance` seria un valor materializado para rendimiento si posteriormente lo necesitamos
2. Dinero: PostgreSQL utiliza NUMERIC/DECIMAL y Prisma utiliza `Decimal`. El dominio representa importes en centavos enteros seguros (`number`, validado con `Number.isSafeInteger`); la multiplicación por cantidades utiliza `bigint`. No se calculan saldos con importes fraccionarios en coma flotante.
