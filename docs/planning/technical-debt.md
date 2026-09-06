# Deuda tecnica y decisiones abiertas

## BI y contabilidad

- Definir la politica exacta que convierte eventos de negocio (`SaleConfirmed`, `PurchaseConfirmed`, `ExpenseConfirmed`, etc.) en `transaction` y `transaction_entry`.
- Definir si los documentos BI confirmados deben crear transacciones en `DRAFT` o directamente en `POSTED`.
- Resolver el catalogo de cuentas por defecto para ventas, IVA, bancos, proveedores, gastos, prestamos, aportaciones y retiros.
- Decidir si `balance` permanece materializado o si se calcula siempre desde `transaction_entry`.

## Personas y terceros

- `id_customer`, `id_supplier`, `id_lender`, `id_owner` e `id_party` se modelaron como UUID externos sin tablas propias.
- Falta decidir si existira un modulo `party` unico o catalogos separados por cliente/proveedor/prestamista/propietario.

## Dinero y precision

- El backend BI valida dinero como string decimal y PostgreSQL lo persiste como `Decimal`.
- El calculo de subtotales en memoria usa centavos enteros para dinero, pero cantidades permiten 4 decimales. Conviene mover esta aritmetica a un value object compartido antes de crecer reglas fiscales.

## Ciclo de vida

- Los estados de venta, compra y gasto comparten `BusinessDocumentStatus`.
- Falta definir transiciones permitidas, permisos e inmutabilidad despues de `CONFIRMED` o `CANCELLED`.

## API

- Los endpoints BI actuales cubren `GET` y `POST` iniciales.
- Faltan endpoints de detalle, confirmacion, cancelacion, paginacion, filtros y busqueda.
- Falta contrato formal de respuesta DTO; por ahora se devuelve la entidad Prisma serializada.

## Integracion futura

- Las operaciones BI aun no publican eventos de dominio ni llaman al modulo contable.
- Se debe evitar que BI dependa directamente de casos de uso concretos de accounting; preferir eventos o una politica de aplicacion explicita.
