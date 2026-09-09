# Architecture

Este directorio documenta la arquitectura objetivo de Valabeco.

Decidimos usar una arquitectura modular por dominio, con patron hexagonal por
modulo. La app Next.js funciona como frontend y SSR puntual. Nest.js expone la
API HTTP y contiene la logica de negocio en dominios aislados.

## Documentos

- [ADR 0001: arquitectura modular hexagonal](./adr-0001-domain-hexagonal-fullstack.md)
- [Estructura de modulos](./module-structure.md)
- [Flujos de runtime](./runtime-flows.md)
- [Modelado de base de datos](./database-modeling.md)
- [Convenciones técnicas del proyecto](./technical-conventions.md)

## Principios

1. Cada dominio es una unidad de negocio con modelo, casos de uso, puertos y
   adaptadores propios.
2. `app/` contiene entrypoints de Next.js y debe mantenerse delgado.
3. Las dependencias apuntan hacia adentro: infraestructura y entrega dependen de
   aplicacion; aplicacion depende de dominio; dominio no depende de frameworks.
4. Next consume el backend Nest por HTTP; no importa `backend/src/modules`.
5. Las mutaciones desde la UI llaman controladores Nest delgados que validan
   entrada, autorizan y ejecutan un caso de uso.
6. Los controladores Nest publican APIs, webhooks, integraciones y endpoints de
   producto.
7. Los datos que crucen al cliente deben ser DTOs seguros y minimos.

## Estado actual

El repositorio conserva `app/` en la raiz por la plantilla de Next.js, pero el
backend vive en `backend/` y el soporte del frontend en `src/`.
