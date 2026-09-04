# Architecture

Este directorio documenta la arquitectura objetivo de Valabeco.

Decidimos usar una arquitectura fullstack modular por dominio, con patron hexagonal
por modulo. La app Next.js funciona como Backend for Frontend y capa de entrega:
renderiza UI, expone Server Actions y publica Route Handlers cuando necesitamos API
HTTP. La logica de negocio no vive en `app/`; vive en dominios aislados.

## Documentos

- [ADR 0001: arquitectura modular hexagonal](./adr-0001-domain-hexagonal-fullstack.md)
- [Estructura de modulos](./module-structure.md)
- [Flujos de runtime](./runtime-flows.md)
- [Modelado de base de datos](./database-modeling.md)

## Principios

1. Cada dominio es una unidad de negocio con modelo, casos de uso, puertos y
   adaptadores propios.
2. `app/` o `src/app/` contiene entrypoints de Next.js y debe mantenerse delgado.
3. Las dependencias apuntan hacia adentro: infraestructura y entrega dependen de
   aplicacion; aplicacion depende de dominio; dominio no depende de frameworks.
4. Los Server Components leen datos desde casos de uso o queries del servidor, no
   desde Route Handlers internos.
5. Las mutaciones desde la UI usan Server Actions delgadas que validan entrada,
   autorizan, ejecutan un caso de uso y revalidan o redirigen.
6. Los Route Handlers se reservan para clientes externos, webhooks, integraciones,
   archivos o APIs publicas.
7. Los datos que crucen al cliente deben ser DTOs seguros y minimos.

## Estado actual

El repositorio aun esta en la plantilla inicial de Next.js. Estos documentos
definen la direccion para el primer crecimiento del codigo; no obligan a crear
todos los directorios hasta que exista el primer dominio real.
