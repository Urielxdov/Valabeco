# Estandar de respuestas y contratos de API

## 1. Objetivo

Definir un standard para la comunicacion entre **Next.js** y **Nest.js**, utilizando:

- TypeScript para tipado estatico
- Zod para validacion en runtime
- Un formato estandar para respuestas HTTP
- Contratos compartidos entre frontend y backend
- Validacion de entrada y salida
- Codigos de error consistentes

## El objetico es que ningun dato externo pueda entrar al frontend o al dominio sin haber sido validado previamente

## 2. Principios

El sistema separa cuatro responsabilidades:

```
TypeScript
↓
Tipado durante desarrollo y compilación

Zod
↓
Validación de datos durante runtime

HTTP
↓
Comunicación y estado de la petición

Domain
↓
Validación de reglas de negocio
```

Cada capa responde una pregunta diferente

| Capa       | Pregunta                                            |
| ---------- | --------------------------------------------------- |
| TypeScript | ¿El codigo utiliza correctamente los tipos?         |
| Zod        | ¿Los datos recibidos tienen la estructura esperada? |
| HTTP       | ¿Que ocurrio con la peticion?                       |
| Domain     | ¿La operacion tiene sentido para el negocio?        |

---

## 3. Contratos compartidos

Los contratos de comunicacion estaran en un paquete compartido:

```
Valebeco/
├── apps/
│ ├── api/ # NestJS
│ └── web/ # Next.js
│
├── packages/
│ └── contracts/
│ └── src/
│ ├── api/
│ │ ├── response.ts
│ │ ├── error.ts
│ │ └── meta.ts
│ │
│ ├── account/
│ │ └── account.schema.ts
│ │
│ └── transaction/
│ └── transaction.schema.ts
│
└── package.json
```

## Los contratos representan la **API**, no las entidades internas del dominio.

## 4. Schemas como fuente de verdad

Zod sera utilizado como fuente de verdad para los contratos que necesiten validacion en runtime

Ejemplo:

```
import { z } from "zod";

export const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  type: z.enum([
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "REVENUE",
    "EXPENSE",
  ]),
});
```

El tipo de TypeScript sera definido directamente:

| export type Account = z.infer<typeof AccountSchema>

Esto permite utilizar el mismo contrato para:

```
AccountSchema
  │
  ├── Runtime
  │ └── Validación
  │
  └── TypeScript
  └── Account
```

No sera necesario mantener por separado:

| type Account = ...

y:

| const AccountSchema = ...

## si ambos representan exactamente el mismo contrato

## 5. Estandar de respuesta

Todas las respuestas HTTP de la API utilizaran un envelope estandar.

**Respuesta exitosa**

```
export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  meta?: ApiMeta;
};
```

**Respuesta fallida**

```
export type ApiFailure = {
  success: false;
  data: null;
  error: ApiError;
  meta?: ApiMeta;
};
```

**Respuesta completa**

```
export type ApiResponse<T> =
| ApiSuccess<T>
| ApiFailure;
```

El uso de una union discriminada permite que TypeScript determine automaticamente que propiedades estan disponibles

```
if (response.success) {
  response.data;
} else {
  response.error;
}
```

---

## 6. Error estandar

```
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
```

| export type ApiError = z.infer<typeof ApiErrorSchema>;

Ejemplo:

```
{
  "success": false,
  "data": null,
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "The specified account does not exist."
  }
}
```

El frontend no utilizara `message` para determinar logica de negocio

La logica utilizara:

| error.code

## El `message` estara destinado principalmente a mostrar informacion o facilitar el debugging

## 7. HTTP Status vs Error Code

Ambos conceptos tendran responsabilidades diferentes

**HTTP Status**

- 400 -> Bad Request
- 401 -> Unauthenticated
- 403 -> Forbidden
- 404 -> Not Found
- 409 -> Conflict
- 422 -> Unprocessable Entity
- 500 -> Internal Server Error

**Error Code**
Representa el error especifico de la aplicacion

Ejemplos:

- ACCOUNT_NOT_FOUND
- ACCOUNT_INACTIVE
- TRANSACTION_NOT_FOUND
- INVALID_ACCOUNT_TYPE
- PERMISSION_DENIED

Ejemplo:
| 422 Unprocessable Entity

```
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNBALANCED_TRANSACTION",
    "message": "Debit and credit totals must be equal."
  }
}
```

---

## 8. Metadata

Las respuestas que necesiten informacion adicional podran utilizar `meta`

```
export const ApiMetaSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
});
```

| export type ApiMeta = z.infer<typeof ApiMetaSchema>;

Ejemplo:

```
{
  "success": true,
  "data": [],
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

## 9. Validaciones de respuestas

El frontend no confiara unicamente en los tipos de TypeScript

Una respuesta proveniente de HTTP sera considerada datos externos no confiables hasta que pase la validacion correspondiente

Ejemplo:

```
const result = AccountSchema.safeParse(response.data);

if (!result.success) {
  // La respuesta no cumple el contrato
}

const account = result.data;
```

Una vez validado:

account.name;
account.type;
el objeto cumple realmente con `AccountSchema`

---

## 10. API Client

El frontend tendra un cliente HTTP centralizado

En lugar de realizar directamente

| const response = await fetch("/accounts/123")
| const data = await response.json()

se utilizara:

|const result = await api.get(
| "/accounts/123",
| AccountSchema
|);

El API Client sera responsable de:

1. Realizar la peticion HTTP
2. Validar el HTTP status
3. Parsear el JSON
4. Validar el envelope
5. Validar `data` utilizando el schema correspondiente
6. Convertir los errores a un formato estandar
7. Entregar datos ya validados al resto del frontend

---

## 11. Resultado del API Client

El cliente puede utilizar un resultado discriminado:

```
export type Result<T> =
  | {
    ok: true;
    data: T;
    meta?: ApiMeta;
  }
  | {
    ok: false;
    error: ApiError;
  };
```

Uso:

```
const result = await api.get(
  "/accounts/123",
  AccountSchema
);

if (!result.ok) {
  showError(result.error);
  return;
}

renderAccount(result.data);

Después de la validación:

result.data
```

## es un `Account` valido

## 12. Flujo de una respuesta

```
    GET /accounts/123
          │
          ▼
        NestJS
          │
          ▼
      HTTP Response
          │
          ▼
      API Client
          │
┌─────────┴─────────┐
│                   │
HTTP Status   JSON Parse
│                   │
└─────────┬─────────┘
          ▼
    Envelope Validation
          │
          ▼
    AccountSchema
          │
   ┌──────┴──────┐
   │             │
  VALID         INVALID
   │             │
   ▼             ▼
Account     ContractError
   │
   ▼
Next.js
```

---

## 13. Validacion de entrada

La validacion de entrada ocurren en NestJS

```
Next.js
  │
  │ Request
  ▼
NestJS
  │
  ▼
Request Validation
  │
  ▼
Use Case
  │
  ▼
Domain
```

Por ejemplo, una peticion para crear una trasaccion deber validar:

- Tipos
- Campos requeridos
- Formatos
- Rangos
- ID´s
- Estructura del request

## Sin embargo, Zod o DTO validation no sustituye las reglas del dominio

## 14. Validaciones de salida

La respuesta del backend sera validada por el frontend

```
NestJS
│
│ Response
▼
Next.js
│
▼
Envelope Validation
│
▼
Response Schema
│
├── Válido
│     ↓
│   Frontend
│
└── Inválido
      ↓
      Contract Error
```

## Esto permite detectar errores de contrato inmediatamente

## 15. Validacion estructural vs validacion de negocio

Las validaciones de estructura y las reglas de negocio son responsabilidades diferentes

**Validacion estructural**
Zod para validar

```
const TransaccionEntrySchema = z.object({
  accountId: z.string().uuid(),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative()
});
```

Esto responde:

| ¿Los datos tienen estructura y los tipos correctos?

**Validacion de dominio**

El dominio puede validar

| SUM(debitAmount) === SUM(creditAmount)

Esto responde:

| ¿La operacion es valida segun las reglas contables?

Por lo tanto:

```
Zod
 ↓
Estructura y tipos

Domain
 ↓
Reglas de negocio
```

## Zod no debe contener las reglas fundamentales del dominio contable

## 16. Ejemplo contable

```
const TransactionSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  date: z.coerce.date(),
  entries: z.array(TransactionEntrySchema),
});

type Transaction = z.infer<typeof TransactionSchema>;
```

Una respuesta valida podria ser:

```
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Compra de computadora",
    "date": "2026-09-06",
    "entries": [
      {
        "accountId": "11111111-1111-1111-1111-111111111111",
        "debitAmount": 15000,
        "creditAmount": 0
      },
      {
        "accountId": "22222222-2222-2222-2222-222222222222",
        "debitAmount": 0,
        "creditAmount": 15000
      }
    ]
  },
  "error": null
}
```

Zod puede comprobar la estructura

El dominio de NestJS debe comprobar que:

| 15000 = 15000

## y que la transaccion cumple todas las reglas contables correspondientes

## 17. Separacion entre contratos y dominio

Los contratos compartidos no deben convertise en la entidades internas del sistema

La arquitectura sera:

```
       API
        │
        ▼
    Response DTO
        │
        ▼
      Use Case
        │
        ▼
      Domain
        │
        ▼
    Persistence
```

El frontend conoce:

- AccountResponse
- TransactionResponse
- UserResponse

pero no necesita conocer:

- AccountEntity
- TransactionEntity
- DatabaseModel

## Esto evita acoplar la API con la implementacion del backend

## 18. Responsabilidades

| Componente        | Responsabilidad                |
| ----------------- | ------------------------------ |
| TypeScript        | Tipado estatico                |
| Zod               | Validacion runtime             |
| API Client        | Comunicacion HTTP y validacion |
| NestJS Controller | Adaptacion HTTP                |
| DTO               | Contrato de entrada/salida     |
| Use Case          | Orquestacion de la operacion   |
| Domain            | Reglas de negocio              |
| Repository        | Persistencia                   |
| PostgreSQL        | Almacenamiento                 |

---

## 19. Principios finales

1. Los contratos de API estaran centralizados
2. Los schemas Zod seran la fuente de verdad para los contratos que requieran validacion runtime
3. Los tipos TypeScript seran inferidos de los schemas cuandos sea posible
4. Todas las respuestas utilizaran un envelope estandar
5. HTTP Status y `error.code` tendran responsabilidades diferentes
6. El frontend no confiara ciegamente en los tipos de TypeScript provenientes de una API
7. Las respuestas deberan pasar validaciones runtime antes de entrar al frontend
8. Las reglas de negocio permaneceran en el dominio/backend
9. Los contratos compartidos no representan necesarimanete las entidades internas del dominio
10. El API Client centralizara la comunicacion y validacion HTTP
11. Los errores de contrato seran diferentes de los errores de negocio
12. El sistema debe fallar lo mas cerca posible de la frontera donde se detecta el dato invalido

---

## 12. Arquitectura general

```
                        ┌───────────────────┐
                        │ Next.js           │
                        │                   │
                        │ UI / Components   │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │ API Client        │
                        │                   │
                        │ HTTP              │
                        │ Envelope          |
                        │ Runtime Validation│
                        └─────────┬─────────┘
                                  │
                                  HTTP / JSON
                                  │
                                  ▼
                        ┌───────────────────┐
                        │ NestJS            │
                        │                   │
                        │ Controllers       │
                        │ DTO Validation    │
                        │ Use Cases         │
                        │ Domain            │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │ PostgreSQL        │
                        └───────────────────┘

                 ┌─────────────────────────────┐
                 │    Shared API Contracts     │
                 │                             │
                 │ Zod Schemas                 │
                 │ API Response                │
                 │ API Errors                  │
                 │ Response DTOs               │
                 └──────────────┬──────────────┘
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                      Next.js       NestJS

```

El obejtivo final es que la comunicacion siga el principio:

```
      Dato externo
          │
          ▼
      Validación
          │
   ┌──────┴──────┐
   │             │
  Válido      Inválido
   │             │
   ▼             ▼
  Continúa      Error
```

De esta forma, el sistema mantiene tipado estatico durante desarrollo y validacion fuerte durante runtime, sin transaladar las reglas de negocio al sistema de contratos
