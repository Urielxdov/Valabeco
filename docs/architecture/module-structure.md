# Estructura de Modulos

## Estructura objetivo

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

El proyecto actual tiene `app/` en la raiz porque viene de `create-next-app`.
Cuando empecemos a implementar dominios, la direccion recomendada es migrar a
`src/app` y ajustar el alias `@/*` hacia `./src/*`. Si preferimos evitar ese
movimiento inicial, podemos mantener `app/` en la raiz y usar imports como
`@/src/modules/<domain>`.

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
- clientes de APIs externas;
- adaptadores de almacenamiento;
- proveedores de email, pagos, archivos o IA;
- lectura de variables de entorno.

Regla: los archivos que toquen secretos, DB, SDKs privados o filesystem deben
marcarse con `import 'server-only'`.

### `presentation`

Adapta casos de uso al usuario o al contrato externo:

- componentes UI especificos del dominio;
- mappers de DTO a view model;
- adaptadores para formularios;
- Server Actions especificas del dominio, cuando convenga centralizarlas.

Regla: los Client Components reciben DTOs seguros y minimos. No deben importar
`infrastructure` ni codigo marcado como server-only.

## Entry points de Next.js

`src/app` define rutas, layouts, `loading.tsx`, `error.tsx`, Server Actions
cercanas a formularios y Route Handlers.

Ejemplo de una pagina:

```txt
src/app/(workspace)/orders/page.tsx
  -> importa un page component o mapper de modules/orders/presentation
  -> obtiene datos desde composition/use cases de orders
```

Ejemplo de una API:

```txt
src/app/api/orders/route.ts
  -> valida Request
  -> llama a un caso de uso de orders
  -> responde con DTO publico
```

## API publica de un dominio

Cada dominio expone solo lo necesario desde su `index.ts`:

```txt
src/modules/orders/index.ts
```

No importamos carpetas internas de otro dominio. Si un dominio necesita una
capacidad de otro, depende de un puerto y la infraestructura/composicion conecta
ambos lados.

## Nombres

- Dominios: `kebab-case`, por ejemplo `orders`, `lab-results`, `identity`.
- Casos de uso: verbo + intencion, por ejemplo `create-order.use-case.ts`.
- Puertos: sustantivo + `port.ts`, por ejemplo `order-repository.port.ts`.
- Adaptadores: tecnologia + rol + `adapter.ts`, por ejemplo
  `postgres-order-repository.adapter.ts`.
- Mappers: origen + destino + `mapper.ts`.
- Server Actions: funcion terminada en `Action`, por ejemplo
  `createOrderAction`.

## Shared

`src/shared` existe para capacidades realmente transversales:

- tipos base y errores comunes;
- utilidades puras;
- UI generica;
- logger, clock, id generator, config;
- helpers de testing.

Regla: no subir conceptos de negocio a `shared` solo porque dos dominios los
usan una vez. Primero duplicamos un poco; extraemos cuando haya una abstraccion
estable.

