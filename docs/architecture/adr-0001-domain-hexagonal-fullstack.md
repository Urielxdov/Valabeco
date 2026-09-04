# ADR 0001: Arquitectura modular hexagonal fullstack

## Estado

Aceptada.

## Contexto

Valabeco parte de una aplicacion Next.js 16 con App Router, React 19 y TypeScript.
Queremos que el proyecto pueda crecer como producto fullstack sin mezclar reglas
de negocio, UI, persistencia e integraciones externas en los mismos archivos.

Next.js permite componer backend y frontend en el mismo deployable mediante Server
Components, Server Actions y Route Handlers. Eso es util, pero tambien facilita
que la logica de negocio termine acoplada a componentes, requests HTTP o clientes
de base de datos. Para evitarlo, necesitamos limites claros desde el inicio.

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
src/modules/<domain>/
  domain/
  application/
  infrastructure/
  presentation/
```

La capa de entrega de Next.js quedara en `src/app` cuando migremos desde la
plantilla actual. Mientras esa migracion no ocurra, el `app/` de la raiz cumple
el mismo rol. Sus archivos deben ser adaptadores delgados, no contenedores de
reglas de negocio.

## Reglas de dependencia

```txt
Next app / presentation
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
- `presentation` transforma datos para UI/API y contiene componentes de dominio,
  view models y adaptadores cercanos al usuario.
- `src/app` llama a `presentation` o a factories de composicion, pero no contiene
  decisiones de negocio.

## Consecuencias

Beneficios:

- Los casos de uso se prueban sin Next.js, navegador ni base de datos real.
- Es mas facil cambiar persistencia, proveedor externo o forma de entrega.
- La seguridad de datos queda centralizada en el lado servidor.
- Los dominios pueden evolucionar con bajo acoplamiento.

Costos:

- Hay mas archivos que en una app CRUD rapida.
- La composicion de dependencias debe ser explicita.
- Necesitamos disciplina para no importar adaptadores desde dominio o aplicacion.

## No decisiones

- No elegimos aun proveedor de autenticacion ni libreria de validacion.
- No creamos un contenedor global de inyeccion de dependencias. Empezaremos con
  factories simples por dominio y solo agregaremos un contenedor si el costo de
  composicion lo justifica.
- No separamos backend y frontend en repos o deployables distintos. La separacion
  inicial es logica, dentro del mismo proyecto.
