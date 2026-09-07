# Auditoría del Sistema — Valabeco

**Fecha:** 2026-09-07

> **Actualización 2026-09-07 (ronda 1):** los hallazgos #2 y #3 (uso de `Number` para dinero en BI y arquitectura no hexagonal de `business-intelligence`) fueron corregidos. Ver "Remediación aplicada".
> **Actualización 2026-09-07 (ronda 2):** los hallazgos #1 (autenticación/autorización) y #4 (cero pruebas automatizadas) también fueron atendidos. Ver "Remediación aplicada — ronda 2" al final del documento.
**Alcance:** backend (`backend/`), contratos compartidos (`packages/contracts/`), frontend (`app/`, `src/`), modelo de datos (`prisma/schema.prisma`) y documentos de arquitectura/decisiones (`docs/`).

**Método:** lectura completa de los 34 archivos TypeScript del backend, los contratos compartidos, el cliente HTTP del frontend, el schema de Prisma y los ADRs/planning existentes. No se ejecutó la aplicación ni se corrió `npm audit`/escáneres automáticos; los hallazgos son de inspección estática.

---

## Resumen ejecutivo

El dominio contable (`backend/src/modules/accounting`) está muy bien implementado: arquitectura hexagonal limpia, `Money` como value object sin punto flotante, invariante de partida doble validada en el dominio, y concurrencia de saldos resuelta correctamente con `updateMany` + `increment` atómico dentro de una transacción Prisma. Es el módulo de referencia del proyecto.

El resto del sistema no está a la misma altura, y no por falta de criterio sino porque **contradice reglas que el propio proyecto ya se impuso por escrito**:

1. **Seguridad crítica:** no existe autenticación ni autorización en ningún endpoint, pese a que `docs/architecture/runtime-flows.md` dice explícitamente *"La autorizacion debe ocurrir dentro del controlador, guard o caso de uso"*.
2. **Arquitectura:** el módulo `business-intelligence` no sigue el patrón hexagonal del proyecto (sin `domain/`, sin `infrastructure/`, sin casos de uso) y devuelve entidades Prisma crudas al cliente, violando *"No devolver registros crudos de base de datos"* (mismo documento).
3. **Regla de dominio contable violada:** `docs/decisions/domains/BI_model.md` (ADR-02) decide *"Dinero: no usara `Number` de javascript **nunca**"*, pero `business-intelligence.service.ts` calcula subtotales, impuestos y pagos de préstamos con `Number`/`Math.round`.
4. **Calidad:** cero pruebas automatizadas en todo el repositorio, pese a que `runtime-flows.md` define expectativas de testing por capa.
5. **Auditoría contable (trazabilidad):** no existe ningún registro de auditoría (quién hizo qué y cuándo) más allá del propio historial de estados `DRAFT/POSTED/VOIDED`. Se propone un diseño al final de este documento.

A continuación el detalle por dimensión.

---

## 1. Auditoría de arquitectura e implementación

### 1.1 Módulo `accounting` — cumple el estándar

Estructura real vs. la definida en `docs/architecture/module-structure.md`:

```
backend/src/modules/accounting/
  domain/           ✅ entities, value objects, errores, políticas — TS puro, sin Prisma
  application/      ✅ dto/, ports/, use-cases/, errors.ts
  infrastructure/   ✅ prisma/ — único lugar que importa PrismaClient
  presentation/     ✅ http/request-parsers.ts — valida con Zod antes de entrar al caso de uso
```

Puntos fuertes verificados:

- `domain/money.ts` representa el dinero en centavos enteros (`Number.isSafeInteger`), nunca `float`/`Decimal` de JS para aritmética — cumple ADR-01 y BI_model.md.
- `domain/transaction.ts` (`assertCanPostTransaction`) exige `SUM(DEBIT) = SUM(CREDIT)` antes de postear — invariante de partida doble en el dominio, no en Zod, tal como pide `adr-0002-standard-response-and-API-contract.md` §15.
- `infrastructure/prisma/prisma-accounting.repository.ts:119-151` resuelve el riesgo de concurrencia que el propio ADR-01 señalaba (*"Concurrencia en Saldos... SELECT FOR UPDATE"*): usa `updateMany({ where: { status: 'DRAFT' }})` como guardia optimista + `increment` atómico de Postgres dentro de `$transaction`. Es una solución válida y más simple que un lock pesimista.
- El módulo expone `index.ts` como API pública, conforme a `module-structure.md` §"API pública de un dominio".

Ningún hallazgo bloqueante en este módulo.

### 1.2 Módulo `business-intelligence` — no sigue el patrón del proyecto

Estructura real:

```
backend/src/modules/business-intelligence/
  business-intelligence.module.ts
  business-intelligence.controller.ts
  application/
    business-intelligence.service.ts   ← contiene TODO: reglas + acceso a datos
    errors.ts
```

Faltan `domain/`, `infrastructure/`, `presentation/`, casos de uso y puerto de repositorio. Consecuencias concretas:

- `business-intelligence.service.ts:42` instancia `PrismaClient` directamente dentro de lo que se supone es la capa de "aplicación" (`private readonly prisma = getPrisma()`), violando la regla de `adr-0001` *"Prisma vive en `infrastructure` y no debe filtrarse hacia `domain` ni `application`"*.
- Los métodos `listSales`, `listPurchases`, `listExpenses`, etc. (líneas 44-227) devuelven directamente el resultado de `prisma.*.findMany(...)`/`create(...)` — es decir, entidades Prisma serializadas — al controlador y de ahí al cliente. Esto es exactamente lo que `runtime-flows.md` §"Seguridad de datos" prohíbe: *"No devolver registros crudos de base de datos; devolver resultados minimos"*. Ya estaba anotado como deuda conocida en `docs/planning/technical-debt.md` ("Falta contrato formal de respuesta DTO; por ahora se devuelve la entidad Prisma serializada"), pero conviene tratarlo como hallazgo de auditoría porque además rompe el principio de contratos de `adr-0002` (§17: *"el frontend... no necesita conocer... DatabaseModel"*).
- Es un "service" único con 8 sub-dominios (`sale`, `purchase`, `expense`, `loan`, `loan_payment`, `capital_contribution`, `owner_withdrawal`, `refund`) mezclados en una sola clase de 270 líneas — ver hallazgo de calidad §3.2.
- La integración con `accounting` sigue sin existir: ninguna de estas operaciones genera una `Transaction`/`TransactionEntry`, tal como ya reconoce `technical-debt.md` ("Las operaciones BI aun no publican eventos de dominio ni llaman al modulo contable") y como exige `docs/decisions/domains/BI_model.md` (*"La venta no crea directamente una transaction; el dominio contable recibe el evento correspondiente"*).

**Recomendación:** antes de seguir agregando entidades BI, migrar este módulo a la misma estructura hexagonal que `accounting` (al menos `sale` y `purchase`, que son los que más se acercan a tocar contabilidad), o documentar explícitamente que es un módulo transitorio/spike y su fecha de reemplazo.

### 1.3 Documentación

- `docs/decisions/adr/adr-0004-sales-use-cases.md` y `docs/decisions/domains/customer_model.md` están **vacíos** (0 bytes). Son referencias colgantes: `adr-0004` promete decidir el patrón de casos de uso de ventas —justo el hueco que describe el punto 1.2— pero no tiene contenido.
- `docs/architecture/README.md` no fue leído en detalle en esta pasada; conviene verificar que enlace a los 5 documentos de `docs/architecture/` y a los ADRs de dominio.

### 1.4 Frontend

- `src/shared/api/client.ts` y `accounting-api.ts` implementan exactamente el patrón de `adr-0002`: valida el envelope con `ApiResponseSchema`, valida `data` con el schema Zod específico, y expone un `Result<T>` discriminado. Es la mejor pieza de "contrato cumplido" del repo.
- Las páginas bajo `app/` (`app/transactions/new/page.tsx`, `app/accounts/page.tsx`, etc.) son wrappers de 5 líneas alrededor de un único componente `AccountingApp` en `app/page.tsx`; no importan `backend/src/modules` ni Prisma, cumpliendo `module-structure.md`. La UI real vive casi toda en `app/page.tsx`, que no se auditó línea por línea — si crece, conviene dividirla antes de que se vuelva un monolito de presentación.
- `src/features/accounting/store/transactionDraftSlice.ts` respeta `state_tool.md` (ADR-03): solo estado de borrador/UI, ninguna regla contable (el balanceo se *sugiere* en el selector `selectIsTransactionDraftBalanced`, pero la fuente de verdad sigue siendo el backend al postear).

---

## 2. Auditoría de seguridad

| # | Hallazgo | Severidad | Evidencia |
|---|----------|-----------|-----------|
| 1 | **Cero autenticación/autorización.** Ningún controlador (`accounts.controller.ts`, `transactions.controller.ts`, `business-intelligence.controller.ts`) tiene guards, y `backend/src/app.module.ts` no registra ningún `AuthModule`/`APP_GUARD` global. Cualquiera con acceso de red al puerto 3001 puede crear cuentas, postear transacciones, anular asientos y crear ventas/gastos/préstamos. | **Crítica** | Grep de `guard`/`auth`/`jwt` en `backend/` → 0 coincidencias. Contradice `runtime-flows.md`: *"La autorizacion debe ocurrir dentro del controlador, guard o caso de uso, no solo en la pagina"*. |
| 2 | **Sin rate limiting.** `runtime-flows.md` pide *"Agregar rate limiting en operaciones costosas o sensibles"*; `main.ts` no registra `@nestjs/throttler` ni ningún middleware equivalente. Postear/anular transacciones y crear registros BI son operaciones sensibles y quedan sin límite. | Alta | `backend/main.ts` completo (24 líneas), sin throttler. |
| 3 | **Sin protección de tamaño/forma de payload más allá de Zod.** Los controladores tipan el body como `Record<string, unknown>` y delegan toda la validación a `parseContract`/`parseBiContract`; no hay límite explícito de tamaño de body ni de profundidad de JSON (se depende del default de Express/Nest, no verificado). | Media | `accounts.controller.ts:19`, `business-intelligence.controller.ts` (todos los `@Post`). |
| 4 | **Endpoints financieros sin protección de doble envío (idempotencia).** `POST /transactions`, `POST /transactions/:id/post`, `POST /bi/sales`, etc. no aceptan una idempotency key. Un doble clic o un retry de red puede crear una transacción o venta duplicada; no hay unicidad a nivel de dominio que lo evite. | Media-Alta | `transactions.controller.ts:24-28`, `business-intelligence.controller.ts` (todos los `create*`). |
| 5 | **CORS con `credentials: true` sobre un solo origen configurable por env var, sin autenticación real detrás.** No es explotable hoy (no hay cookies de sesión que proteger), pero es una bandera para revisar en cuanto se introduzca auth basada en cookies: confirmar que `FRONTEND_ORIGIN` nunca acepte `*` en producción. | Baja (preventiva) | `backend/main.ts:12-15`. |
| 6 | **Manejo de errores:** correcto — `domain-exception.filter.ts` solo hace `console.error` de errores 500 en servidor y devuelve `"Unexpected server error."` genérico al cliente (no hay fuga de stack traces ni mensajes internos). Cumple `runtime-flows.md` ("los errores de infraestructura... se devuelven como respuestas genericas"). | ✅ Sin hallazgo | `backend/src/shared/domain-exception.filter.ts:20-22,74-78`. |
| 7 | **Secretos:** buen manejo. `.env*` está en `.gitignore` (excepto `.env.example`), `git ls-files` no devuelve ningún archivo `.env` real, y `.env.example` no contiene credenciales reales (usuario/contraseña `postgres/postgres` de desarrollo local). `prisma-client.ts` valida `DATABASE_URL` requerido y lanza si falta, en vez de usar un default silencioso. | ✅ Sin hallazgo | `.gitignore`, `.env.example`, `prisma-client.ts:13-17`. |
| 8 | **Sin headers de seguridad HTTP** (`helmet` o equivalente): no se configura `Content-Security-Policy`, `X-Frame-Options`, etc. Impacto limitado mientras la API sea puramente JSON consumida por el propio frontend, pero es una práctica esperable antes de exponer el backend fuera de `localhost`. | Baja | `backend/main.ts` no importa `helmet`. |
| 9 | **Dependencias:** no se ejecutó `npm audit`/`npm outdated` como parte de esta revisión estática; recomendable correrlo antes de cualquier despliegue. | Info | — |

**Prioridad de remediación sugerida:** #1 (auth) antes que cualquier otra cosa — es el único hallazgo que por sí solo hace inviable exponer este backend fuera de un entorno de desarrollo local. Le sigue #2 (rate limiting) y #4 (idempotencia) porque afectan directamente la integridad contable, no solo la seguridad perimetral.

---

## 3. Auditoría de calidad de código

### 3.1 Sin pruebas automatizadas

No existe un solo archivo `*.spec.ts`/`*.test.ts` en el repositorio, y `package.json` no tiene configurado ningún test runner (`jest`, `vitest`) ni script `test`. `docs/architecture/runtime-flows.md` define expectativas explícitas por capa (*"domain: unit tests rapidos, sin mocks... application: unit tests con puertos fake/in-memory... infrastructure: integration tests..."*) que hoy no se cumplen en absoluto.

El módulo `accounting` es, precisamente por su diseño limpio, el más barato de testear primero: `domain/transaction.ts` y `domain/accounting-policy.ts` son funciones puras sin dependencias — se podrían cubrir con unit tests sin mocks en una sesión de trabajo.

### 3.2 Lógica de dinero duplicada 4 veces

La conversión decimal↔centavos para dinero está reimplementada de forma independiente en:

1. `backend/src/modules/accounting/domain/money.ts` (la versión "oficial", como value object, con `Number.isSafeInteger`).
2. `backend/src/modules/business-intelligence/application/business-intelligence.service.ts:242-253` (`moneyToCents`/`centsToMoney`, funciones sueltas con `Number`).
3. `packages/contracts/src/accounting/account.schema.ts:44-47` (otra función local `moneyToCents`, solo para el `refine` de `PositiveMoneyStringSchema`).
4. `src/features/accounting/store/transactionDraftSlice.ts:143-159` (`parseMoneyCents`/`centsToDecimalString`, para totales de UI).

Ya estaba anotado en `docs/planning/technical-debt.md` ("Conviene mover esta aritmetica a un value object compartido"), pero al revisar el código se confirma que **no es solo redundancia**: la versión de `business-intelligence.service.ts` usa `Number()`/`Math.round()` sobre valores monetarios, lo cual contradice directamente la decisión ya tomada en `docs/decisions/domains/BI_model.md`: *"Dinero: no usara `Number` de javascript **nunca**"*. Con montos grandes o cantidades con 4 decimales (`quantity` permite `DECIMAL(15,4)` en el schema) existe riesgo real de arrastre de error de punto flotante antes del `Math.round` final.

**Recomendación:** mover `Money` (o un primitivo equivalente sin dependencias de Nest) a un paquete compartido (`packages/contracts` o uno nuevo `packages/kernel`) y hacer que `business-intelligence.service.ts` y el `transactionDraftSlice` lo consuman, eliminando las tres reimplementaciones.

### 3.3 `business-intelligence.service.ts` como "god service"

270 líneas, 8 sub-dominios de negocio (venta, compra, gasto, préstamo, pago de préstamo, aportación de capital, retiro, reembolso), cada uno con su propio `list*`/`create*` y sin capa de dominio que valide invariantes propias más allá de lo que ya hace Zod (la única regla de negocio real que se ve es `principalAmount + interestAmount === amount` en `createLoanPayment`, línea 158). Si BI crece (los próximos módulos ya anticipados: inventario, clientes, proveedores según `state_tool.md`), este archivo se vuelve inmanejable. Ligado al hallazgo 1.2 — la solución arquitectónica y la de calidad son la misma: separar por sub-dominio con la estructura hexagonal ya probada en `accounting`.

### 3.4 Detalles menores

- `domain/accounting-policy.ts:12-30` tiene comentarios línea por línea que narran *qué* hace el código (`// Genera un listado para...`, `// Busca en el repositorio...`) en vez de *por qué*; son redundantes con nombres ya descriptivos (`accountsById`, `deltasByAccount`) y no siguen la convención de "comentar solo lo no obvio" que el resto del dominio contable sí respeta.
- No hay paginación en ningún endpoint de listado (`GET /accounts`, `GET /transactions`, `GET /bi/sales`, etc.), pese a que el contrato ya define `ApiMeta` con `page`/`limit`/`total` (`packages/contracts/src/api/meta.ts`). Ya está anotado en `technical-debt.md` para BI, pero aplica igual a `accounting`.
- Integridad referencial débil por diseño: `id_customer`, `id_supplier`, `id_lender`, `id_owner`, `id_party` son UUIDs sin FK a una tabla real (decisión ya documentada como deuda abierta en `technical-debt.md`), así que hoy Postgres no impide crear una venta con un `id_customer` inexistente.

---

## 4. Propuesta: módulo de auditoría contable (audit trail)

Esto es una **propuesta de diseño**, no implementada. No se ha creado código ni ADR formal — se deja aquí para su discusión antes de construirla.

### Contexto

El propio ADR-01 (`account_model.md`) ya reclama *"Auditoría Completa: Trazabilidad total de cada movimiento de saldo"* como consecuencia positiva del modelo, pero hoy esa trazabilidad se limita a: (a) el estado `DRAFT/POSTED/VOIDED` de cada `Transaction`, y (b) el hecho de que `POSTED` es inmutable. No existe registro de **quién** creó/posteó/anuló una transacción, **cuándo** exactamente ocurrió cada transición de estado, ni un historial de cambios sobre `Account` (nombre, tipo, descripción).

Esto está bloqueado en parte por una "no decisión" explícita de `adr-0001`: *"No elegimos aun proveedor de autenticacion"*. Sin un concepto de usuario/actor, el campo "quién" de cualquier bitácora de auditoría no tiene qué contener todavía.

### Diseño propuesto (para ADR futuro, p. ej. `adr-0005-audit-trail.md`)

Tabla nueva, siguiendo el estándar de `database-modeling.md` (`snake_case`, `id_{tabla}`):

```
audit_log
├── id_audit_log       UUID, PK
├── entity_type        VARCHAR — "account" | "transaction" | futuros dominios
├── id_entity          UUID — id_account o id_transaction afectado
├── action             ENUM — CREATED | POSTED | VOIDED | UPDATED
├── performed_by        UUID, NULLABLE FK -> user (hasta que exista modulo identity)
├── performed_at        TIMESTAMP, NOT NULL, default now()
├── before_state        JSONB, NULLABLE — snapshot previo (para UPDATED/VOIDED)
├── after_state         JSONB, NOT NULL — snapshot resultante
└── metadata            JSONB, NULLABLE — request id, IP, origen, etc.
```

Reglas de diseño alineadas con el resto del sistema:

1. **Vive en `domain`/`application` de `accounting`, no en `infrastructure`.** Cada caso de uso que muta estado (`PostTransactionUseCase`, `VoidTransactionUseCase`, `CreateAccountUseCase`, etc.) debe producir un registro de auditoría como parte de la misma unidad de trabajo, igual que hoy produce los `balanceDeltas` — no como un trigger de base de datos oculto, para mantener la regla de `adr-0001` de que las reglas de negocio viven en el dominio/aplicación, no en la infraestructura.
2. **Se escribe dentro de la misma `$transaction` de Prisma** que ya envuelve `postTransaction`/`voidTransaction` en `prisma-accounting.repository.ts`, para que el registro de auditoría nunca quede desincronizado del cambio real.
3. **`performed_by` queda `NULLABLE` hoy y se vuelve `NOT NULL`** en cuanto exista un módulo de autenticación (bloqueado por el hallazgo de seguridad #1 de este documento — hay una dependencia directa: no tiene sentido "completar" la auditoría de auditoría sin resolver primero quién es el actor).
4. **Es de solo lectura desde la API** — un endpoint `GET /accounts/:id/audit-log` y `GET /transactions/:id/audit-log`, sin `POST`/`PUT`/`DELETE`: la bitácora nunca se edita, solo se consulta.
5. **No sustituye el historial de `TransactionStatus`** (`DRAFT/POSTED/VOIDED` ya documentado en ADR-01); lo complementa con el "quién y cuándo" que ese enum no captura.

### Orden de trabajo sugerido

1. Resolver primero el hallazgo de seguridad #1 (autenticación) — sin un actor identificado, `performed_by` no puede llenarse con datos reales.
2. Escribir el ADR formal (`docs/decisions/adr/adr-0005-audit-trail.md`) con esta propuesta, revisada por el equipo.
3. Implementar sobre `accounting` primero (es el módulo hexagonal completo); extender a `business-intelligence` solo después de que ese módulo tenga su propia capa de dominio (ver hallazgo 1.2).

---

## Lista de hallazgos priorizada (todas las dimensiones)

| Prioridad | Hallazgo | Sección | Estado |
|---|---|---|---|
| 1 | Cero autenticación/autorización en toda la API | 2, #1 | ✅ Resuelto (ronda 2) |
| 2 | `business-intelligence` usa `Number` para dinero, violando ADR-02 (BI_model.md) | 3.2 | ✅ Resuelto (ronda 1) |
| 3 | `business-intelligence` no sigue arquitectura hexagonal y devuelve entidades Prisma crudas | 1.2 | ✅ Resuelto (ronda 1) |
| 4 | Cero pruebas automatizadas en todo el repo | 3.1 | ✅ Resuelto (ronda 2) |
| 5 | Sin rate limiting en endpoints sensibles | 2, #2 | Pendiente |
| 6 | Sin protección de idempotencia en POSTs financieros | 2, #4 | Pendiente |
| 7 | Lógica de conversión de dinero duplicada 4 veces | 3.2 | Parcial — resuelta en BI (ronda 1); queda en `contracts` y frontend |
| 8 | Sin trazabilidad de "quién/cuándo" (audit trail) | 4 | Pendiente (propuesta de diseño ya documentada) |
| 9 | Sin paginación en listados | 3.4 | Pendiente |
| 10 | ADRs vacíos (`adr-0004-sales-use-cases.md`, `customer_model.md`) | 1.3 | Pendiente |
| 11 | Integridad referencial débil (`id_customer`/`id_supplier`/etc. sin FK) | 3.4 | Pendiente |
| 12 | Sin headers de seguridad HTTP (`helmet`) | 2, #8 | Pendiente |

---

*Documento generado por revisión estática asistida; no reemplaza una revisión de seguridad con herramientas dinámicas (SAST/DAST) ni un `npm audit` de dependencias antes de producción.*

---

## Remediación aplicada (2026-09-07)

Se resolvieron los hallazgos **#2** (uso de `Number` para dinero en BI, violando `BI_model.md`) y **#3** (arquitectura no hexagonal de `business-intelligence`) mediante un refactor del módulo `business-intelligence` a la misma estructura que `accounting`.

### Qué cambió

- **`Money` y `getPrisma` se movieron a `backend/src/shared`** (`shared/domain/money.ts`, `shared/domain/errors.ts`, `shared/infrastructure/prisma-client.ts`). `accounting` y `business-intelligence` ahora comparten una única implementación — elimina 1 de las 4 duplicaciones de dinero señaladas en 3.2 y corrige que `business-intelligence.service.ts` importara `getPrisma` desde dentro de `accounting/infrastructure` (una violación adicional del límite de dominios que no se había listado explícitamente).
- **`Money` gana `multiplyByQuantity(quantity: string)`**: multiplica un importe por una cantidad decimal (hasta 4 decimales) usando `BigInt` puro — sin `Number`, sin `Math.round`. El redondeo es "mitad hacia arriba" al centavo más cercano. Esto es lo que ahora calcula `subtotal` en `sale`/`purchase` a partir de `quantity × unitPrice`, en vez de la aritmética `Number` original.
- **`business-intelligence` se reestructuró en capas hexagonales**, igual que `accounting`:
  - `domain/`: `sale.ts`, `purchase.ts`, `expense.ts`, `loan.ts`, `capital.ts`, `refund.ts`, `enums.ts`, `errors.ts` — entidades y factories con las invariantes ya documentadas en `BI_model.md` (`subtotal = Σ(quantity × unitPrice)`, `total = subtotal + tax`, `amount = principalAmount + interestAmount` para `loan_payment`, cantidades y montos positivos).
  - `application/`: `dto/`, `mappers/`, `ports/business-intelligence-repository.port.ts`, y 15 casos de uso (uno por operación: `create-sale`, `list-sales`, `create-purchase`, etc.), igual de granulares que en `accounting`.
  - `infrastructure/prisma/prisma-business-intelligence.repository.ts`: único lugar que toca `PrismaClient` para BI; mapea entidades Prisma a entidades de dominio.
  - `presentation/http/request-parsers.ts`: valida cada request con los schemas Zod ya existentes en `@valabeco/contracts` antes de llegar a un caso de uso.
  - El controlador único `business-intelligence.controller.ts` se dividió en 8 controladores por recurso (`sales.controller.ts`, `purchases.controller.ts`, `expenses.controller.ts`, `loans.controller.ts`, `loan-payments.controller.ts`, `capital-contributions.controller.ts`, `owner-withdrawals.controller.ts`, `refunds.controller.ts`), igual que `accounting` separa `accounts.controller.ts`/`transactions.controller.ts`.
  - Los endpoints (`GET`/`POST /bi/sales`, `/bi/purchases`, etc.) **no cambiaron de ruta** — es un refactor interno, compatible con cualquier consumidor existente.
- **Ya no se devuelven entidades Prisma crudas**: cada caso de uso retorna un DTO (`SaleDto`, `LoanDto`, etc.) mapeado explícitamente desde el dominio, cerrando la violación de `runtime-flows.md` ("No devolver registros crudos de base de datos").
- **`domain-exception.filter.ts`** se simplificó: ahora reconoce un `DomainError` compartido (del que heredan `AccountingDomainError`, `BusinessIntelligenceDomainError` e `InvalidMoneyError`) en una sola rama, en vez de una rama por módulo.
- `tsconfig.backend.json` sube su `target` a `ES2020` (necesario para la sintaxis de literales `BigInt` que usa el nuevo `Money`); no afecta al frontend, que mantiene su propio `tsconfig.json`.

### Verificación

- `tsc -p tsconfig.backend.json --noEmit`: sin errores de tipos propios del cambio (los únicos restantes son `Cannot find module '@nestjs/*'|'rxjs'` porque esos paquetes no están instalados en `node_modules` de este entorno — preexistente, afecta igual a archivos no tocados como `app.module.ts`).
- `eslint backend`: sin errores ni advertencias.
- Se regeneró el cliente Prisma (`prisma generate`) para que sus tipos coincidan con `schema.prisma`; antes de este refactor el propio `business-intelligence.service.ts` ya necesitaba un tipo `BusinessPrisma` hecho a mano para compensar un cliente desactualizado — ya no hace falta.

### Lo que quedó pendiente tras esta ronda (resuelto en la ronda 2, ver abajo)

- ~~Hallazgo #1 (autenticación/autorización)~~ — resuelto en la ronda 2.
- ~~Hallazgo #4 (cero pruebas)~~ — resuelto en la ronda 2.
- Las otras 2 duplicaciones de dinero fuera de BI (`packages/contracts/src/accounting/account.schema.ts` y `src/features/accounting/store/transactionDraftSlice.ts` en el frontend) no se tocaron; no eran parte de este pedido y no usan `Number` para sumas acumuladas de dinero, solo para validación estructural o totales de UI de un borrador aún no persistido.

---

## Remediación aplicada — ronda 2 (2026-09-07)

Se resolvieron los hallazgos **#1** (cero autenticación/autorización) y **#4** (cero pruebas automatizadas).

### Hallazgo #1 — Autenticación y autorización

Se agregó un módulo `identity` con la misma estructura hexagonal que `accounting`/`business-intelligence`, y un guard global que ahora protege **toda** la API por defecto.

- **`prisma/schema.prisma`**: nuevo modelo `User` (`id_user`, `email` único, `password_hash`, `name`, `created_at`), siguiendo el estándar de `database-modeling.md`.
- **`backend/src/modules/identity/`**:
  - `domain/user.ts`: entidad `User` + `createNewUser`/`restoreUser` (valida formato de email y nombre; nunca ve la contraseña en texto plano, solo recibe un `passwordHash` ya calculado).
  - `application/`: puertos `UserRepository`, `PasswordHasher`, `TokenService`; casos de uso `RegisterUserUseCase` y `LoginUserUseCase`; DTOs/mappers que nunca exponen `passwordHash`.
  - `infrastructure/crypto/scrypt-password-hasher.ts`: hashing de contraseñas con `scrypt` de `node:crypto` (salt aleatorio de 16 bytes, comparación con `timingSafeEqual`). **No se agregó `bcrypt` ni ninguna dependencia nueva** — este entorno no tiene acceso a `npm install` (sin conexión a `registry.npmjs.org`), así que se usó únicamente la librería estándar de Node.
  - `infrastructure/crypto/hmac-token-service.ts`: token firmado con HMAC-SHA256 (`payload.firma`, base64url), con expiración (`AUTH_TOKEN_TTL_SECONDS`) y verificación de firma con `timingSafeEqual`. Por la misma razón (sin `npm install` disponible) no se usó `jsonwebtoken`/`@nestjs/jwt`; es funcionalmente equivalente a un JWT HS256 pero no intercambiable con librerías JWT estándar.
  - `presentation/http/auth.guard.ts` + `public.decorator.ts`: guard `AuthGuard` registrado como `APP_GUARD` global (protege toda ruta Nest por defecto); `@Public()` exime únicamente `POST /auth/register` y `POST /auth/login`.
  - `auth.controller.ts`: `POST /auth/register`, `POST /auth/login`.
- **`packages/contracts/src/identity/`**: `UserSchema`, `RegisterRequestSchema`, `LoginRequestSchema`, `AuthResponseSchema`.
- **`.env.example`**: nuevas variables `AUTH_TOKEN_SECRET` y `AUTH_TOKEN_TTL_SECONDS`.
- **`domain-exception.filter.ts`**: mapea los nuevos errores de `identity` (`IDENTITY_INVALID_CREDENTIALS` → 401, `IDENTITY_EMAIL_ALREADY_REGISTERED` → 409).

**Importante — acción manual pendiente antes de desplegar:**

1. **Migración de base de datos:** este entorno no tiene una instancia de Postgres alcanzable (`localhost:5432` no responde), así que no fue posible correr `prisma migrate dev`. Además, `prisma/migrations/` ya no tenía ninguna migración previa para *ninguno* de los 15 modelos existentes (solo existía `migration_lock.toml`), por lo que no había una línea base sobre la cual generar el diff de forma segura. **Alguien con acceso a una base de datos de desarrollo debe correr `prisma migrate dev --name add_user`** para generar y aplicar la migración real de la tabla `user`. El cliente Prisma ya fue regenerado (`prisma generate`) para que el código compile contra el nuevo modelo.
2. **`AUTH_TOKEN_SECRET`:** el valor en `.env.example` es un placeholder; cada entorno real necesita un secreto largo y aleatorio propio (por ejemplo `openssl rand -hex 32`).
3. **Alcance de la autorización:** lo implementado es *autenticación* (¿quién eres?) para toda la API. No incluye *autorización* fina (roles/permisos por recurso, ej. "solo un admin puede anular transacciones") — eso queda como trabajo futuro sobre esta misma base (`request.userId` ya queda disponible en cada request autenticado para ese trabajo).

### Hallazgo #4 — Pruebas automatizadas

No había ningún framework de pruebas configurado (`package.json` no tenía `jest`/`vitest` ni script `test`) y este entorno tampoco tiene acceso a `npm install` para agregar uno. Se usó el test runner nativo de Node.js (`node:test` + `node:assert/strict`, ambos incluidos en Node ≥ 18, sin dependencias nuevas) compilando con el `tsc` que ya usa el proyecto.

- **41 pruebas nuevas**, siguiendo exactamente la expectativa de `docs/architecture/runtime-flows.md` ("domain: unit tests rapidos, sin mocks de framework" / "application: unit tests con puertos fake/in-memory"):
  - `backend/src/shared/domain/money.test.ts` — aritmética de `Money`, incluyendo los dos casos de redondeo de `multiplyByQuantity` (mitad hacia arriba y hacia abajo) que son el corazón de la corrección del hallazgo #2.
  - `backend/src/modules/accounting/domain/transaction.test.ts` y `accounting-policy.test.ts` — invariante de partida doble, ciclo de vida `DRAFT/POSTED/VOIDED`, cálculo de deltas de saldo por tipo de cuenta.
  - `backend/src/modules/accounting/application/use-cases/post-transaction.use-case.test.ts` — `PostTransactionUseCase` contra un `AccountingRepository` falso en memoria (sin Prisma, sin DB).
  - `backend/src/modules/business-intelligence/domain/sale.test.ts` y `loan.test.ts` — invariantes de `BI_model.md` (`subtotal = Σ(quantity×unitPrice)`, `amount = principalAmount + interestAmount`).
  - `backend/src/modules/business-intelligence/application/use-cases/create-sale.use-case.test.ts` — caso de uso contra un repositorio BI falso.
  - `backend/src/modules/identity/domain/user.test.ts`, `application/use-cases/register-user.use-case.test.ts` (con `UserRepository`/`PasswordHasher`/`TokenService` falsos), `infrastructure/crypto/scrypt-password-hasher.test.ts` y `hmac-token-service.test.ts`.
- **`package.json`**: nuevo script `"test:backend": "tsc -p tsconfig.backend.json && node --test \"dist/backend/backend/src/**/*.test.js\""`.
- **Lo que queda fuera:** pruebas de `infrastructure/prisma/*` (integración contra una base real) y `e2e` de los controladores — `runtime-flows.md` las clasifica como una capa distinta ("infrastructure: integration tests contra servicios reales") que requiere una base de datos de prueba, no disponible en este entorno.

### Verificación de esta ronda

- `tsc -p tsconfig.backend.json --noEmit`: mismos 27 errores preexistentes (`Cannot find module '@nestjs/*'|'rxjs'`, paquetes no instalados en este entorno) — cero errores nuevos atribuibles a `identity` o a las pruebas.
- `eslint backend`: 0 errores, 10 advertencias (parámetros no usados en los métodos de repositorios falsos que no aplican a una prueba puntual — patrón esperado al implementar una interfaz completa solo para una prueba).
- `node --test "dist/backend/backend/src/**/*.test.js"`: **41/41 pruebas pasando**.
- `prisma generate`: cliente regenerado correctamente contra el `schema.prisma` con el modelo `User` agregado.
