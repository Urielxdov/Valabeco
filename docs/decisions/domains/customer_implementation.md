# Implementación del módulo customer

## Alcance

Implementa Customer, CustomerTaxProfile, CustomerAddress y CustomerContact con API
autenticada e interfaz en `/clientes`, `/clientes/nuevo` y `/clientes/[id_customer]`.
Usa las [convenciones técnicas](../../architecture/technical-conventions.md) y desarrolla
el [modelo de clientes](./customer_model.md).

Ventas ya existe en `business-intelligence`. Esta entrega añade su relación real con
Customer y valida que el cliente exista y esté activo al crear una venta.
Facturación CFDI, cuentas por cobrar, pagos de clientes y automatización contable
permanecen en sus dominios y no se implementan en este módulo.

## Decisiones concretadas

- UUID y claves físicas `id_customer_tax_profile`, `id_customer_address`,
  `id_customer_contact`.
- Todas las ventas registradas cuentan para bloquear un cambio de RFC, incluyendo
  `DRAFT`, `CONFIRMED` y `CANCELLED`. El bloqueo afecta solo cambios de un RFC
  existente; la primera captura sigue permitida después de vender.
- La corrección exige motivo y auditoría. No hay endpoints para borrar clientes ni perfiles.
- Un cliente inactivo conserva toda su información y puede reactivarse. No admite ventas nuevas.
- `isGeneric` identifica el único registro PUBLICO GENERAL creado por la migración.
  Usa `PERSON` como valor técnico del enum; `isGeneric` distingue su significado.
  Es un registro protegido, activo, sin perfil fiscal, direcciones ni contactos; no se
  identifica por el texto del nombre ni por un UUID fijo.
- El RFC se guarda sin espacios exteriores y en mayúsculas. Las validaciones locales
  comprueban formato y obligatoriedad; no equivalen a una validación contra el SAT.
- El perfil fiscal es la fuente del código postal fiscal. Si cambia y hay dirección fiscal
  vigente, se crea una copia con el nuevo CP y se inactiva la anterior en la misma transacción.
  Crear o reactivar una dirección fiscal exige coincidencia con el perfil, si existe.
- Agregar una dirección fiscal sustituye la vigente. Editar una fiscal también crea
  un registro nuevo; los datos históricos inactivos no se editan. Otras direcciones
  activas se pueden editar. Reactivar una fiscal falla si ya hay otra vigente.
- Los contactos son opcionales. En personas físicas puede registrarse al propio cliente.
- Cada modificación audita responsable y valores anteriores/posteriores dentro de la misma
  transacción. Un fallo de auditoría revierte también el cambio de negocio.
- La creación de ventas y las mutaciones de clientes bloquean la misma fila Customer,
  evitando que la comprobación de ventas y el cambio del RFC se crucen.

## API

Todas las rutas requieren `Authorization: Bearer <token>`. El actor se toma de la sesión.

| Método y ruta | Operación |
| --- | --- |
| GET /customers | Búsqueda por nombre, nombre comercial o RFC; status; page y pageSize |
| POST /customers | Alta comercial sin perfil fiscal |
| GET /customers/:id | Detalle con perfil, direcciones, contactos y hasTransactions |
| PATCH /customers/:id | Editar identidad comercial o cambiar estado |
| POST /customers/:id/tax-profile | Crear o actualizar perfil completo |
| POST /customers/:id/addresses | Agregar dirección; reemplazar fiscal vigente |
| PATCH /customers/:id/addresses/:addressId | Editar dirección activa; conservar historial fiscal |
| PATCH /customers/:id/addresses/:addressId/status | Activar/inactivar dirección |
| POST /customers/:id/contacts | Agregar contacto |
| PATCH /customers/:id/contacts/:contactId | Editar contacto o cambiar su estado |

Los IDs de hijos se validan junto con su cliente para impedir modificar registros
de otro cliente. El listado devuelve `items`, `total`, `page` y `pageSize` dentro de
`data`; el tamaño predeterminado es 20 y el máximo 100.

## Interfaz y sesión

El módulo permite iniciar sesión o crear una cuenta con los endpoints de identidad existentes. La sesión
vive en un slice Redux compartido durante la navegación y se pierde al recargar la
página; cerrar sesión desmonta las vistas del cliente. El token no se guarda en
localStorage ni se incluye en snapshots de auditoría.

Las colecciones y los formularios usan estado local. Las rutas soportan acceso directo,
navegación atrás/adelante y actualización desde servidor. No se añade un slice de
clientes para duplicar la base de datos.

## Migración

La migración `20260908130000_customer` crea tablas, FKs, índices, checks y el cliente
genérico dentro de una transacción.

Antes de aplicarla, revisar si la instalación tiene ventas preexistentes sin catálogo
de clientes. La migración se detiene si encuentra ventas, para que se prepare una
migración de datos revisada que conserve cada `id_customer` y su identidad real antes
de exigir la FK. No reasigna ventas a público general ni elimina datos automáticamente.

En instalaciones sin ventas previas:

```powershell
npx prisma validate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

Para desarrollar y verificar:

```powershell
npm run test:backend
npm run lint
npm run build:backend
npm run build
```

Las pruebas de integración usan `TEST_DATABASE_URL` y crean esquemas aislados. No usan
el catálogo real de clientes ni requieren borrar o reiniciar la base configurada.
