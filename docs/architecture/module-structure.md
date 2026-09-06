# Estructura de Modulos

## Estructura objetivo

```txt
app/
  (public)/
  (workspace)/

src/
  features/
  store/
  shared/

backend/
  main.ts
  src/
    app.module.ts
    shared/
    modules/
      <domain>/
        domain/
          entities/
          value-objects/
          events/
          errors/
          services/
        application/
          dto/
          ports/
          use-cases/
        infrastructure/
          composition.ts
          prisma/
          persistence/
          external/
        presentation/
          http/
        <domain>.module.ts
        <resource>.controller.ts
```

Next.js queda como capa de interfaz y SSR puntual. Nest.js es dueno de los
modulos de negocio, los casos de uso, repositorios y contratos HTTP del backend.

La estructura actual mantiene `app/` en la raiz porque viene de
`create-next-app`. El codigo de soporte del frontend vive en `src/features` y
`src/store`; no debe importar `backend/src/modules`.

## Estructura anterior

Esta era la direccion original antes de separar Nest:

```txt
src/
  app/
    (public)/
    (workspace)/
    api/
  modules/
    <domain>/
      domain/
        entities/
        value-objects/
        events/
        errors/
        services/
      application/
        dto/
        ports/
        use-cases/
      infrastructure/
        composition.ts
        prisma/
        persistence/
        external/
      presentation/
        actions/
        components/
        mappers/
        view-models/
      index.ts
  shared/
    domain/
    application/
    infrastructure/
    ui/
    config/
```

No se debe volver a este modelo para nuevos dominios.

## Capas por dominio

### `domain`

Contiene el lenguaje central del negocio:

- entidades y agregados;
- value objects;
- eventos de dominio;
- errores de dominio;
- servicios de dominio puros.

Regla: debe ser TypeScript puro. No conoce Next.js, React, base de datos, HTTP,
cookies, sesiones ni variables de entorno.

### `application`

Orquesta casos de uso:

- comandos y queries;
- DTOs de entrada y salida;
- puertos requeridos por los casos de uso;
- validaciones de flujo que no son invariantes internas del dominio.

Regla: depende de `domain`, pero no de adaptadores concretos.

### `infrastructure`

Implementa detalles externos:

- repositorios concretos;
- Prisma Client y mapeos entre modelos Prisma y entidades/DTOs;
- clientes de APIs externas;
- adaptadores de almacenamiento;
- proveedores de email, pagos, archivos o IA;
- lectura de variables de entorno.

Regla: los archivos que toquen secretos, DB, SDKs privados o filesystem deben
vivir dentro de `backend/` y exponerse al frontend solo por HTTP.

La base de datos principal sera PostgreSQL y el ORM sera Prisma. Los modelos
Prisma representan persistencia, no el dominio; por eso deben mapearse hacia
entidades, value objects o DTOs antes de salir de `infrastructure`.

El modelo fisico de PostgreSQL debe seguir el estandar documentado en
[`database-modeling.md`](./database-modeling.md): tablas en minusculas con
palabras separadas por `_` y llaves primarias `id_{nombre_de_la_tabla}`.

### `presentation`

Adapta casos de uso al usuario o al contrato externo:

- controladores HTTP;
- parsers y validadores cercanos al request;
- mappers de DTO a contratos de API;
- filtros o adaptadores de error del modulo.

Regla: los Client Components reciben DTOs seguros y minimos. No deben importar
`backend/src/modules`, `infrastructure` ni Prisma.

## Entry points de Next.js

`app/` define rutas, layouts, `loading.tsx`, `error.tsx` y componentes de pagina.
No define Route Handlers de negocio bajo `app/api`.

Ejemplo de una pagina:

```txt
app/(workspace)/orders/page.tsx
  -> importa componentes del frontend
  -> consume el backend Nest por HTTP usando NEXT_PUBLIC_API_URL
```

## API publica de un dominio

Cada dominio expone solo lo necesario desde su `index.ts`:

```txt
backend/src/modules/orders/index.ts
```

No importamos carpetas internas de otro dominio. Si un dominio necesita una
capacidad de otro, depende de un puerto y el modulo Nest conecta ambos lados.

## Nombres

- Dominios: `kebab-case`, por ejemplo `orders`, `lab-results`, `identity`.
- Casos de uso: verbo + intencion, por ejemplo `create-order.use-case.ts`.
- Puertos: sustantivo + `port.ts`, por ejemplo `order-repository.port.ts`.
- Adaptadores: tecnologia + rol + `adapter.ts`, por ejemplo
  `postgres-order-repository.adapter.ts`.
- Mappers: origen + destino + `mapper.ts`.
- Controladores: recurso + `controller.ts`, por ejemplo
  `orders.controller.ts`.

## Shared

`backend/src/shared` y, si hace falta, `src/shared` existen para capacidades
realmente transversales:

- tipos base y errores comunes;
- utilidades puras;
- UI generica;
- logger, clock, id generator, config;
- helpers de testing.

Regla: no subir conceptos de negocio a `shared` solo porque dos dominios los
usan una vez. Primero duplicamos un poco; extraemos cuando haya una abstraccion
estable.
