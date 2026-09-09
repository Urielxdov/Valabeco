# Convenciones técnicas de Valabeco

## Alcance y referencias

Esta guía consolida las decisiones de arquitectura y los patrones del código actual.
Se aplica a módulos nuevos y a código que se modifique. No implica que todo el código
anterior ya cumpla cada regla.

El ejemplo comentado de contabilidad que permanecía en `src/modules` se conserva
en [account-legacy.ts.txt](./examples/account-legacy.ts.txt) como material de consulta.
La implementación ejecutable está en el dominio contable del backend.

| Tema | Referencia en el proyecto |
| --- | --- |
| Límites y dependencias | [ADR 0001](./adr-0001-domain-hexagonal-fullstack.md), [estructura](./module-structure.md) |
| Tablas y columnas | [Modelado de base de datos](./database-modeling.md), `prisma/schema.prisma` |
| Contratos HTTP | [ADR 0002](./adr-0002-standard-response-and-API-contract.md), `packages/contracts/src/api` |
| Transacciones y auditoría | Repositorios de `organization` y `customer`, `shared/infrastructure/audit-event.ts` |
| Estado de interfaz | [ADR de estado](../decisions/adr/state_tool.md), `src/store/store.ts` |
| Ejemplo completo | [Implementación de clientes](../decisions/domains/customer_implementation.md) |

## Arquitectura y organización

- Next.js entrega interfaz y SSR puntual. NestJS contiene la API y la lógica de negocio.
- `app/` contiene páginas delgadas. Las features viven en `src/features/<domain>/`.
- El backend se organiza en `backend/src/modules/<domain>/` con `domain/`,
  `application/ports/`, `application/use-cases/`, `infrastructure/prisma/`,
  controlador y módulo Nest.
- El dominio utiliza TypeScript puro: no importa Prisma, Nest, React ni otros dominios.
- Los casos de uso dependen de puertos. Los módulos Nest conectan implementaciones
  mediante providers y factories; los adaptadores no se construyen en controladores.
- Los contratos de entrada/salida pueden compartirse como tipos con aplicación.
  Los modelos Prisma no salen de infraestructura.
- Las capacidades entre dominios se exponen explícitamente desde `index.ts`.
  Los adaptadores pueden coordinar relaciones en la misma base dentro de una transacción;
  esa coordinación debe estar documentada y probarse junto con sus invariantes.
- Las reglas puras viven en dominio. La comprobación de reglas que dependen de datos
  concurrentes se realiza dentro de la transacción del adaptador.

## Nombres y tipos

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Archivos y carpetas del backend | `kebab-case` | `customer-policy.ts`, `customer-repository.port.ts` |
| Clases y modelos | `PascalCase` | `Customer`, `ManageCustomersUseCase` |
| Propiedades TS y JSON HTTP | `camelCase` | `idCustomer`, `createdAt` |
| Tablas y columnas físicas | `snake_case` | `customer_tax_profile`, `created_at` |
| Llaves primarias | `id_<tabla>` | `id_customer_tax_profile` |
| Estados cerrados | Mayúsculas | `ACTIVE`, `INACTIVE` |
| Pruebas | Junto al código, `*.test.ts` | `customer-policy.test.ts` |

Se usa TypeScript estricto. Preferir `unknown` para entradas externas, tipos explícitos
en límites y `import type` cuando corresponda. Evitar `any` y conversiones que oculten
incompatibilidades. Los slices Redux existentes siguen la forma `<feature>Slice.ts`.

## Persistencia y migraciones

- PostgreSQL y Prisma son las tecnologías existentes. Los identificadores son UUID
  (`String @db.Uuid`), generados con `gen_random_uuid()`.
- Prisma usa `@map` y `@@map` para conservar los nombres físicos.
- Los catálogos cerrados usan enums; los códigos externos, como RFC y régimen fiscal,
  usan strings con límites y validaciones.
- Usar `created_at` y `updated_at` en entidades administrativas, y fechas ISO en DTOs.
  El proyecto almacena `TIMESTAMP(6)`; no cambiar la semántica horaria incidentalmente.
- Las relaciones de hijos son obligatorias. Los hijos opcionales se representan por
  ausencia del registro, como el perfil fiscal, no con una fila incompleta.
- Las FKs históricas usan `onDelete: Restrict`. Desactivar no elimina registros.
- Las restricciones de unicidad pertenecen a la base, además de los mensajes de aplicación.
  Los índices parciales y checks adicionales se conservan en las migraciones SQL.
- Las migraciones nuevas se agregan en `prisma/migrations/<fecha>_<intención>/migration.sql`.
  No modificar migraciones ya aplicadas.
- Revisar datos existentes antes de exigir nuevas FKs. No inventar identidades,
  reasignar documentos ni borrar datos para hacer pasar una migración.
- La configuración actual de la CLI está en `prisma7.config.ts`; pasar
  `--config prisma7.config.ts` explícitamente en procedimientos documentados.
- Regenerar Prisma Client después de cambiar el esquema.

## Consistencia y auditoría

Cada mutación compuesta debe ser atómica, incluyendo la auditoría. Se reutiliza
`recordAudit(tx, actor, action, entity, idRecord, before, after)`.

- El actor proviene del guard autenticado (`req.userId`), nunca del cuerpo enviado por el cliente.
- Registrar identidad del actor, acción, registro, valores anteriores/posteriores y fecha.
  Los cambios que requieran justificación incluyen el motivo.
- Nunca incluir contraseñas, tokens ni secretos en snapshots.
- Tomar los bloqueos necesarios antes de comprobar reglas que dependen de otros registros.
  Todos los caminos de escritura involucrados deben respetar el mismo protocolo.
- En clientes, venta y modificación bloquean primero la fila `customer` con
  `SELECT ... FOR UPDATE` dentro de una transacción `ReadCommitted`.
  Organización conserva su estrategia existente de transacciones serializables y reintentos.
- SQL parametrizado mediante tagged templates de Prisma; no interpolar datos en SQL crudo.
- Traducir errores esperados de Prisma a errores de aplicación. No devolver detalles internos
  de la base de datos ni mensajes genéricos que afirmen que se guardó una operación fallida.

Referencias: [bloqueos PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html)
e [índices parciales](https://www.postgresql.org/docs/current/indexes-partial.html).

## Contratos y HTTP

- Los contratos compartidos y esquemas Zod viven en `packages/contracts/src/<domain>/`.
- Validar cuerpos, query strings y UUIDs antes del caso de uso; rechazar propiedades
  inesperadas en los contratos nuevos.
- Normalizar strings en la entrada. Distinguir `undefined` (sin cambio) de `null`
  (limpiar un campo opcional). No sustituir datos obligatorios por strings vacíos.
- Los controladores devuelven DTOs; el interceptor global agrega el sobre
  `success/data/error`. El filtro global transforma errores de dominio, aplicación y HTTP.
- Usar 400 para entradas inválidas, 401 para autenticación, 404 para recursos inexistentes,
  409 para conflictos y 422 para reglas de dominio.
- Las rutas están autenticadas salvo `@Public()`. La autenticación actual no implementa
  permisos diferenciados por rol; no asumir que un puesto organizacional autoriza una acción.
- Para colecciones administrativas nuevas, usar búsqueda, filtros, orden estable y paginación
  acotada. No devolver relaciones completas en listados si solo se requieren en el detalle.
- El cliente HTTP compartido valida también las respuestas y devuelve `Result<T>`.

## Frontend y estado

- La interfaz administrativa utiliza español, Tailwind y los componentes comunes
  `AppSidebar`, `Panel` y `Alert`.
- La navegación usa `Link` y el router de Next. Los parámetros dinámicos se esperan
  como promesas, según la documentación local de la versión instalada.
- Las llamadas HTTP viven en `src/shared/api/`; las features nunca importan backend o Prisma.
- Mostrar carga, vacío, error y resultado de mutaciones. Deshabilitar envíos mientras
  se guardan y descartar respuestas de peticiones canceladas.
- Los formularios y editores de una vista usan estado local.
- Redux Toolkit mantiene contexto que cruza vistas, como sesión y borradores compartidos.
  Los slices pertenecen a su feature; `src/store/store.ts` solo los compone.
- El store se crea por instancia del provider, evitando un singleton compartido en SSR.
  La sesión actual permanece en memoria; no se persisten credenciales en almacenamiento web.
- No copiar el catálogo de clientes a Redux como fuente principal. Actualmente los módulos
  cargan datos por HTTP y refrescan después de guardar. TanStack Query figura como evolución
  en el ADR, pero todavía no está instalado ni es una convención implementada.

## Verificación

- Pruebas de dominio con `node:test` y `node:assert/strict`.
- Pruebas de persistencia para FKs, unicidad, historial, rollback y carreras entre operaciones.
  Usar `TEST_DATABASE_URL` y un esquema aleatorio por ejecución, eliminado al finalizar.
- Aplicar migraciones reales en los esquemas de prueba; un mock no comprueba índices ni bloqueos.
- Ejecutar validación Prisma, pruebas backend, lint y compilación de frontend/backend.
- No registrar secretos ni modificar datos de negocio para ejecutar pruebas.
