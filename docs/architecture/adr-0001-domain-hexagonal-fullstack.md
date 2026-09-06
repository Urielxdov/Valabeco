# ADR 0001: Arquitectura modular hexagonal fullstack

## Estado

Aceptada.

## Contexto

Valabeco parte de una aplicacion Next.js 16 con App Router, React 19 y TypeScript.
Queremos que el proyecto pueda crecer como producto fullstack sin mezclar reglas
de negocio, UI, persistencia e integraciones externas en los mismos archivos.

Next.js permite componer backend y frontend en el mismo deployable, pero en este
proyecto decidimos que Next sea responsable del frontend y de SSR puntual. La
capa de negocio y los endpoints HTTP viven en Nest.js para mantener una frontera
clara y familiar para el equipo.

Para persistencia, usaremos PostgreSQL como gestor de base de datos y Prisma como
ORM/cliente de acceso a datos.

El modelado fisico de base de datos seguira un estandar de nombres: tablas en
minusculas con palabras separadas por `_`, e identificadores primarios con el
formato `id_{nombre_de_la_tabla}`.

## Decision

Adoptamos un monolito modular por dominio con patron hexagonal dentro de cada
modulo.

La unidad principal de organizacion sera el dominio de negocio:

```txt
backend/src/modules/<domain>/
  domain/
  application/
  infrastructure/
  presentation/
  <domain>.module.ts
  <resource>.controller.ts
```

La capa de entrega de Next.js queda en `app/` y el estado/soporte del frontend en
`src/`. Sus archivos deben consumir el backend por HTTP y no importar dominio,
casos de uso, repositorios ni Prisma.

## Reglas de dependencia

```txt
Nest controller / presentation
        |
        v
application ---> domain
        ^
        |
infrastructure
```

- `domain` no importa React, Next.js, ORM, clientes HTTP, variables de entorno ni
  codigo de otros dominios.
- `application` importa `domain` y define puertos para persistencia,
  autorizacion, reloj, archivos, correo, pagos, IA u otros servicios externos.
- `infrastructure` implementa puertos. Aqui viven ORM, SDKs externos,
  `process.env`, clientes HTTP y detalles de almacenamiento.
- Prisma vive en `infrastructure` y no debe filtrarse hacia `domain` ni
  `application`; los casos de uso dependen de puertos, no de `PrismaClient`.
- PostgreSQL es el almacenamiento transaccional principal de la aplicacion.
- Las tablas PostgreSQL usan `snake_case` en minusculas y sus llaves primarias
  usan `id_{nombre_de_la_tabla}`.
- `presentation` transforma datos para contratos HTTP y adaptadores cercanos al
  usuario externo.
- `app/` llama al backend Nest por HTTP, pero no contiene decisiones de negocio.

## Consecuencias

Beneficios:

- Los casos de uso se prueban sin Next.js, navegador ni base de datos real.
- Es mas facil cambiar persistencia, proveedor externo o forma de entrega.
- La seguridad de datos queda centralizada en el lado servidor.
- Los dominios pueden evolucionar con bajo acoplamiento.
- La estructura del backend sigue convenciones conocidas de Nest.

Costos:

- Hay mas archivos que en una app CRUD rapida.
- La composicion de dependencias debe declararse en los modulos Nest.
- Necesitamos disciplina para no importar adaptadores desde dominio o aplicacion.

## No decisiones

- No elegimos aun proveedor de autenticacion ni libreria de validacion.
- No separamos backend y frontend en repos o deployables distintos. La separacion
  inicial es logica, dentro del mismo proyecto.
