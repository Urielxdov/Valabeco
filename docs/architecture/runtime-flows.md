# Flujos de Runtime

## Lecturas para UI

La UI consume el backend Nest por HTTP. Next puede usar Server Components para
SSR puntual, pero no debe importar casos de uso, repositorios ni Prisma.

```txt
Next page/component
  -> cliente HTTP del frontend
  -> controlador Nest
  -> caso de uso/query
  -> puerto
  -> adaptador de infraestructura con Prisma
  -> PostgreSQL
  -> DTO seguro
  -> componente UI
```

Reglas:

- No importar `backend/src/modules` desde `app/` ni desde `src/`.
- Si una pagina necesita SSR, puede hacer `fetch` al backend Nest usando una URL
  de servidor configurada, pero no debe saltarse la capa HTTP.
- Si la vista necesita interactividad, pasar DTOs serializables a Client
  Components.
- Iniciar lecturas independientes en paralelo cuando no dependan entre si.
- Usar `Suspense` o `loading.tsx` para datos lentos.

## Mutaciones desde UI

Las mutaciones iniciadas por formularios o eventos de usuario llaman al backend
Nest por HTTP.

```txt
form / Client Component
  -> fetch(NEXT_PUBLIC_API_URL)
  -> controlador Nest
  -> validar input
  -> autenticar y autorizar
  -> caso de uso
  -> puertos
  -> adaptadores Prisma
  -> PostgreSQL
  -> revalidatePath/revalidateTag o redirect
```

Reglas:

- Toda ruta Nest debe tratarse como endpoint publico alcanzable por HTTP.
- La autorizacion debe ocurrir dentro del controlador, guard o caso de uso, no
  solo en la pagina que renderizo el formulario.
- No devolver registros crudos de base de datos; devolver resultados minimos.
- No ejecutar mutaciones durante el render de un Server Component.

## APIs HTTP y webhooks

Usamos controladores Nest para:

- APIs consumidas por clientes externos;
- webhooks y callbacks de terceros;
- archivos o formatos no HTML como JSON, XML, TXT o imagenes;
- proxy validado hacia servicios externos;
- endpoints donde el contrato HTTP es parte del producto.

```txt
controller.ts
  -> parsear body/params una vez
  -> validar content-type, tamano, params y body
  -> autenticar/autorizar o verificar firma
  -> caso de uso
  -> mapear resultado a DTO/respuesta HTTP
```

Reglas:

- No confiar en params, headers, search params ni body.
- No exponer mensajes de error internos al cliente.
- Agregar rate limiting en operaciones costosas o sensibles.
- Definir `OPTIONS`/CORS solo cuando exista un consumidor cross-origin real.

## Composicion de dependencias

Cada dominio declara su composicion en el modulo Nest:

```txt
backend/src/modules/<domain>/<domain>.module.ts
```

Responsabilidades:

- construir adaptadores concretos;
- inyectarlos en casos de uso;
- leer configuracion privada;
- construir o reutilizar el cliente Prisma;
- mantener secretos fuera del cliente.

Los controladores reciben dependencias por constructor. Los providers se
registran en el modulo:

```txt
providers: [
  OrderRepository,
  CreateOrderUseCase,
  ListOrdersQuery,
]
```

Si un caso de uso depende de un puerto TypeScript, el modulo declara un provider
con `useFactory` o un token explicito.

## Seguridad de datos

- La capa de acceso a datos y adaptadores privados viven dentro de `backend/`.
- Solo `infrastructure` o `shared/config` leen `process.env`.
- Solo `infrastructure` usa `PrismaClient` directamente.
- Los DTOs hacia UI/API se disenan por caso de uso, no como espejo de tablas.
- Los Client Components no reciben entidades completas ni objetos con campos
  privados.
- Los errores de dominio pueden mapearse a mensajes de usuario, pero los errores
  de infraestructura se registran en servidor y se devuelven como respuestas
  genericas.

## Cache y revalidacion

- Las lecturas se modelan como queries/casos de uso.
- La decision de cache pertenece al frontend/SSR o al adaptador HTTP, no al
  dominio.
- Despues de una mutacion, la UI decide si refresca estado local, invalida cache
  o navega.
- Los casos de uso no importan `next/cache`.

## Testing esperado

- `domain`: unit tests rapidos, sin mocks de framework.
- `application`: unit tests con puertos fake/in-memory.
- `infrastructure`: integration tests contra servicios reales controlados o
  dobles de contrato.
- `presentation` y `app`: tests de componentes y e2e para flujos criticos.
