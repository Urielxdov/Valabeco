# Flujos de Runtime

## Lecturas para UI

Preferimos Server Components para cargar datos del servidor.

```txt
page.tsx / Server Component
  -> composition del dominio
  -> caso de uso o query
  -> puerto
  -> adaptador de infraestructura
  -> DTO seguro
  -> componente UI
```

Reglas:

- No hacer `fetch` desde un Server Component hacia un Route Handler interno.
  Eso agrega un salto HTTP innecesario y puede fallar durante build cuando no
  hay servidor escuchando.
- Si la vista necesita interactividad, pasar DTOs serializables a Client
  Components.
- Iniciar lecturas independientes en paralelo cuando no dependan entre si.
- Usar `Suspense` o `loading.tsx` para datos lentos.

## Mutaciones desde UI

Las mutaciones iniciadas por formularios o eventos de usuario usan Server
Actions.

```txt
form / Client Component
  -> createThingAction
  -> validar input
  -> autenticar y autorizar
  -> caso de uso
  -> puertos
  -> adaptadores
  -> revalidatePath/revalidateTag o redirect
```

Reglas:

- Toda Server Action debe tratarse como endpoint publico alcanzable por POST.
- La autorizacion debe ocurrir dentro de la action o dentro del caso de uso/DAL,
  no solo en la pagina que renderizo el formulario.
- No devolver registros crudos de base de datos; devolver resultados minimos.
- No ejecutar mutaciones durante el render de un Server Component.

## APIs HTTP y webhooks

Usamos Route Handlers para:

- APIs consumidas por clientes externos;
- webhooks y callbacks de terceros;
- archivos o formatos no HTML como JSON, XML, TXT o imagenes;
- proxy validado hacia servicios externos;
- endpoints donde el contrato HTTP es parte del producto.

```txt
route.ts
  -> parsear Request una vez
  -> validar content-type, tamano, params y body
  -> autenticar/autorizar o verificar firma
  -> caso de uso
  -> mapear resultado a Response
```

Reglas:

- No confiar en params, headers, search params ni body.
- No exponer mensajes de error internos al cliente.
- Agregar rate limiting en operaciones costosas o sensibles.
- Definir `OPTIONS`/CORS solo cuando exista un consumidor cross-origin real.

## Composicion de dependencias

Cada dominio tendra una composicion server-only:

```txt
src/modules/<domain>/infrastructure/composition.ts
```

Responsabilidades:

- construir adaptadores concretos;
- inyectarlos en casos de uso;
- leer configuracion privada;
- mantener secretos fuera del cliente.

Empezamos con factories explicitas:

```txt
makeCreateOrderUseCase()
makeListOrdersQuery()
```

Si la composicion crece demasiado, evaluaremos un contenedor DI, pero no sera
la primera opcion.

## Seguridad de datos

- La capa de acceso a datos y adaptadores privados usan `import 'server-only'`.
- Solo `infrastructure` o `shared/config` leen `process.env`.
- Los DTOs hacia UI/API se disenan por caso de uso, no como espejo de tablas.
- Los Client Components no reciben entidades completas ni objetos con campos
  privados.
- Los errores de dominio pueden mapearse a mensajes de usuario, pero los errores
  de infraestructura se registran en servidor y se devuelven como respuestas
  genericas.

## Cache y revalidacion

- Las lecturas se modelan como queries/casos de uso.
- La decision de cache pertenece al adaptador de entrega o a funciones
  server-only cercanas a la lectura, no al dominio.
- Despues de una mutacion, la Server Action o Route Handler decide entre
  `revalidatePath`, `revalidateTag`, `refresh` o `redirect`.
- Los casos de uso no importan `next/cache`.

## Testing esperado

- `domain`: unit tests rapidos, sin mocks de framework.
- `application`: unit tests con puertos fake/in-memory.
- `infrastructure`: integration tests contra servicios reales controlados o
  dobles de contrato.
- `presentation` y `app`: tests de componentes y e2e para flujos criticos.

