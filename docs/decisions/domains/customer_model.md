# ADR03: Dominio de Clientes (`customer`)

## Estado

Planificacion

## Contexto

El modulo de clientes tiene como objetivo administrar la informacion de las personas o entidades que adquieren bienes o servicios de la institucion

El cliente como una entidad central que psoteriormente se relacionara con otros modulos del ERP, principalmente

- Ventas
- Facturas
- Cuentas por cobrar
- Pagos
- Contabilidad

---

## Definicion de Cliente

Un cliente es una persona o entidad que adquiere bienes o servicios de la institucion

Un cliente puede ser:

- Persona fisica
- Persona moral / empresa

Un cliente puede realizar multiples operaciones comerciales a lo largo del tiempo

**Relacion principal**

```text
CUSTOMER 1 ───────── N SALE
```

Un cliente puede tener muchas ventas, pero cada venta pertenece a un cliente

---

## Entidades del modulo

El modulo esta compuesto inicialmente por las sigueintes entidades

```text
Customer
├── CustomerTaxProfile
├── CustomerAddress
└── CustomerContact
```

Estas entidades representan diferentes aspectos de la informacion del cliente

---

### Entidad Cliente (`customer`)

Representa al cliente dentro del sistema

| Campo | Tipo | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_customer` | UUID / BIGINT | PK | Identificador unico del cliente |
| `customer_type` | VARCHAR / ENUM | NOT NULL | Tipo de cliente |
| `legal_name` | VARCHAR | NOT NULL | Nombre legal o razon social |
| `trade_name` | VARCHAR | NULL | Nombre comercial |
| `status` | VARCHAR / ENUM | NOT NULL | Estado del cliente |
| `created_at` | TIMESTAMP | NOT NULL | Fecha de creacion |
| `updated_at` | TIMESTAMP | NOT NULL | Ultima modificacion |

#### `customer_type`

Valores propuestos:

- PERSON
- COMPANY

#### `status`

- ACTIVE
- INACTIVE

La desactivacion de un cliente no debe eliminar su informacion historica, especialmente si ya tiene ventas asociadas

---

### Entidad Perfil Fiscal del Cliente (`customer_tax_profile`)

Representa la informacion fiscal asociada al cliente

| Campo | Tipo | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_tax_profile` | UUID / BIGINT | PK | Identificador del perfil fiscal |
| `id_customer` | UUID / BIGINT | FK, UNIQUE | Cliente asociado |
| `rfc` | VARCHAR | NOT NULL | RFC del cliente |
| `legal_name` | VARCHAR | NOT NULL | Nombre o razon social fiscal |
| `tax_regime` | VARCHAR | NOT NULL | Regimen fiscal |
| `tax_zip_code` | VARCHAR | NOT NULL | Codigo postal fiscal |
| `ceated_at` | TIMESTAMP | NOT NULL | Fecha de creacion |
| `updated_at` | TIMESTAMP | NOT NULL | Ultima modificacion |

> **NOTA:** Los datos fiscales deberan validarse conforme a los requerimientos de facturacion de la institucion

---

### Entidad Direccion de Cliente (`customer_address`)

Representa las diferentes direcciones asociadas a un cliente

Un clietne puede tener multiples direcciones

```text
CUSTOMER 1 ───────── N CUSTOMER_ADDRESS
```

| Campo | Tipo | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_address` | UUID / BIGINT | PK | Identificador de la direccion |
| `id_customer` | UUID / BIGINT | FK | Cliente propietario |
| `address_type` | VARCHAR / ENUM | NOT NULL | Tipo de direccion |
| `street` | VARCHAR | NOT NULL | Calle |
| `external_number` | VARCHAR | NULL | Numero exterior |
| `internal_number` | VARCHAR | NULL | Numero interno |
| `neighborhood` | VARCHAR | NULL | Colonia |
| `city` | VARCHAR | NOT NULL | Ciudad |
| `municipality` | VARCHAR | NULL | Municipio |
| `state` | VARCHAR | NOT NULL | Estado |
| `country` | VARCHAR | NOT NULL | Pais |
| `postal_code` | VARCHAR | NOT NULL | Codigo postal |

#### `address_type`

Valores propuestos:

- FISCAL
- BILLING
- SHIPPING
- OTHER

**Ejemplo:**

```text
Cliente: Metalúrgica del Bajío

Direcciones:
├── Fiscal
├── Facturación
├── Entrega - Planta León
└── Entrega - Planta Silao
```

---

### Entidad Contacto del Cliente (`customer_contact`)

Representa a las personas de contacto relacionadas con un cliente

Un cliente puede tener multiples contactos

```text
CUSTOMER 1 ───────── N CUSTOMER_CONTACT
```

| Campo | Tipo | Restriccion | Descripcion |
| :--- | :--- | :--- | :--- |
| `id_contact` | UUID / BIGINT | PK | Identificador del contacto |
| `id_customer` | UUID / BIGINT | FK | Cliente asociado |
| `name` | VARCHAR | NOT NULL | Nombre |
| `last_name` | VARCHAR | NULL | Apellidos |
| `email` | VARCHAR | NULL | Correo electronico |
| `phone` | VARCHAR | NULL | Telefono |
| `position` | VARCHAR | NULL | Puesto o funcion |
| `status` | VARCHAR / ENUM | NOT NULL | Estado del contacto |
| `created_at` | TIMESTAMP | NOT NULL | Fecha de creacion |
| `updated_at` | TIMESTAMP | NOT NULL | Ultima modificacion |

**Ejemplo:**

```text
Contactos:
├── Juan Pérez
│   └── Compras
│
├── María López
│   └── Contabilidad
│
└── Pedro García
    └── Almacén
```

---

## Relaciones con otros modulos

El modulo de clientes no debe contener directamente toda la logica de modulos como lo puede ser ventas, facturacion o cotnabilidad.

Su responsabilidad principal es proporcionar la identidad e informacion necesaria del cliente

### Cliente -> Venta

```text
CUSTOMER 1 ───────── N SALE
```

Un cliente puede tener multiples ventas

La entidad `sale` debera contener la referencia:

> `id_customer` FK

---

### Cliente -> Cuenta por cobrar

Conceptualmente

```text
CUSTOMER
    │
    ▼
SALE
    │
    ▼
ACCOUNT_RECEIVABLE
    │
    ▼
PAYMENT
```

Una cuenta por cobrar representa una cantidad pendeinte de recibir del cliente

La implementacion exacta debera definirse al diseñar el modulo de cuentas por cobrar

---

## Ventas y cobros

Una venta no implica necesariamente que el cleinte haya realizado un pago

**Ejemplo:**

```text
Cliente
   │
   ▼
Venta $11,600
   │
   ├── Contado
   │      └── Pago inmediato
   │
   └── Crédito
          └── Cuenta por cobrar
                    │
                    └── Pago posterior
```

Por lo tanto, venta y pago no deben tratarse como conceptos diferentes

---

## Cancelacion de una venta

La cancelacion de una venta debe analizarse de acuerdo con el estado de la operacion

Una venta puede encontrarse por ejemplo en:
- CREATED
- CONFIRMED
- PAID
- CANCELLED

La cancelacion debe considerar si la operacion produjo efectos en otros modulos

**Venta sin pago**

```text
Venta
  ↓
Cancelación
  ↓
No existe devolución de dinero
```

**Venta ya pagada**

```text
Venta
  ↓
Pago
  ↓
Cancelación
  ↓
Devolución / reversión correspondiente
```

**Venta con cuenta por pagar**

```text
Venta
  ↓
Cuenta por cobrar
  ↓
Cancelación
  ↓
Cancelación o reversión de la cuenta por cobrar
```

> La forma exacta de realizar las reversiones contables, fiscales  y
> financieras debera definirse junto con las reglas del modulo de ventas y contabilidad

---

## Impacto contable

El modulo de clientes no debe ser responsable de generar directamente los movimientos contables

El cliente proporciona informacion que puede ser utilizada por otros dominios

**Por ejemplo:**

```text
Cliente
   ↓
Venta
   ↓
Evento de negocio
   ↓
Contabilidad
```

Una venta a credito podria producir conceptualmente:

```text
Debe:
    Cuentas por cobrar

Haber:
    Ventas
    IVA trasladado
```

Posteriormente, cuando se recibe el pago:

```text
Debe:
    Bancos / Caja

Haber:
    Cuentas por cobrar
```

Los detalles de estas operaciones pertenecen al dominio contable

---

## Modelo conceptual

```text
                         ┌─────────────────────┐
                         │      CUSTOMER       │
                         ├─────────────────────┤
                         │ id_customer         │
                         │ customer_type       │
                         │ legal_name          │
                         │ trade_name          │
                         │ status              │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             │ 1:1                  │ 1:N                  │ 1:N
             ▼                      ▼                      ▼
┌──────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│ CUSTOMER_TAX_PROFILE │  │ CUSTOMER_ADDRESS │  │ CUSTOMER_CONTACT    │
├──────────────────────┤  ├──────────────────┤  ├─────────────────────┤
│ id_tax_profile       │  │ id_address       │  │ id_contact          │
│ id_customer          │  │ id_customer      │  │ id_customer         │
│ rfc                  │  │ address_type     │  │ name                │
│ legal_name           │  │ street           │  │ last_name           │
│ tax_regime           │  │ city             │  │ email               │
│ tax_zip_code         │  │ state            │  │ phone               │
└──────────────────────┘  │ postal_code      │  │ position            │
                          └──────────────────┘  └─────────────────────┘

                         ┌──────────────────┐
                         │       SALE       │
                         ├──────────────────┤
                         │ id_sale          │
                         │ id_customer FK   │
                         │ ...              │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ ACCOUNT_RECEIVABLE│
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │      PAYMENT     │
                         └──────────────────┘
```

---

## Decisiones pendientes

Antes de consierar terminado el modelo, se debe definir las siguientes reglas de negocio:

- [ ] ¿Puede existir un cliente sin RFC?
- [ ] ¿El RFC debe ser unico?
- [ ] ¿Puede cambiar el RFC de un cliente?
- [ ] ¿La razon social pertenece a `customer` o exclusicamente a los datos fiscales?
- [ ] ¿Se requiere diferenciar nombre legal y nombre comercial?
- [ ] ¿Qué datos fiscales son obligatorios?
- [ ] ¿Qué tipos de direcciones necesita la institución?
- [ ] ¿Puede existir más de una dirección fiscal?
- [ ] ¿Puede existir más de una dirección de entrega?
- [ ] ¿Se requieren contactos para personas físicas?
- [ ] ¿Puede un cliente estar inactivo teniendo ventas históricas?
- [ ] ¿Puede una venta existir sin cliente?
- [ ] ¿Cómo se maneja una venta de contado?
- [ ] ¿Cómo se maneja una venta a crédito?
- [ ] ¿Qué ocurre con una cuenta por cobrar cuando se cancela una venta?
- [ ] ¿Qué ocurre si la venta ya fue pagada?
- [ ] ¿Qué ocurre si la venta ya fue facturada?
- [ ] ¿Qué eventos de venta generan movimientos contables?

---

## Alcance inical

Para la primera versión del módulo se propone implementar únicamente:

- `Customer`
- `CustomerTaxProfile`
- `CustomerAddress`
- `CustomerContact`

Las entidades:

- `Sale`
- `Invoice`
- `AccountReceivable`
- `Payment`
- `AccountingEntry`

se desarrollarán en sus respectivos módulos y se relacionarán posteriormente con Customer.
