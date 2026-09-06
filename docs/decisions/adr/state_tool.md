# ADR-03: Arquitectura de Estado Global con Redux

## Estado
Planificacion

## Fecha
2026-09-05

## Contexto
La aplicacion esta evolucionando desde un sistema de contabilidad hacia un sistema empresarial modular que potencialmente incorporara funcionalidades de ventas, compras, gastos, prestamos, inventario, usuarios, reportes y otros modulos propios de un ERP.

El crecimiento esperado del sistema implica un aumento en:
- Numero de vistas y componentes
- Estado compartido entre diferentes modulos
- Dlujos de interaccion complejos
- Reglas de presentacion y navegacion
- Formularios de multiples pasos
- Filtros y selecciones persistentes entre vistas
- Operaciones asincronas contra la API
- Necesidad de trazabilidad y depuracion del estado

Se requiere una solucion de administracion de estado que sea:
- Escalable 
- Predecible
- Facil de entender para nuevos desarroladores
- Adecuada para equipos de desarrollo
- Compatible con una arquitectura modular por dominios
- Facil de depurar
- Independiente de la estructura fisica de los componentes de React

Se ha decidido utilizar Redux Toolkit como solucion principal para el estado global de la aplicacion
---
## Desicion
Se utilizara Redux Toolkit (RTK) para administrar el estado global de la aplicacion

Redux sera utilizado como una capa d eestado de aplicacion, y no como una representacion compelta del dominio ni como sustituto de la base de datos

La arquitectura distiguira tres categorias principales de estado

````
Aplicación
 │ 
 ┌─────────────┼─────────────┐ 
 │             │             │ 
 ↓             ↓             ↓ 
 Local State Application Server State 
             State 
 │             │             │ 
 useState /  Redux      TanStack Query 
 useReducer
````

## 1. Local State
Se utilizara `useState` o `useReducer` para estados cuya existencia este limitada a un componente o seccion especifica de la interfaz

Ejemplos:
- isOpen
- inputValue
- currentStep
- localFormState
- isExpanded

Estos estados no deberan trasladarse a Redux Store sin una razon concreta

---

## 2. Application State
Redux administrara informacion que:
- Necesite ser compartida por multiples componentes
- Persista durante varias vistas
- Represente el estado actual de la aplicacion
- Requiera transiciones de estado explicitas
- Sea relevante para multiples modulos

Ejemplos:
- Usuario autenticado
- Permisos cargados
- Organizacion seleccionada
- Cuenta seleccionada
- Filtros globales
- Preferencia de interfaz
- Estado de navegacion
- Contexto de trabajo
---
## 3. Server State
Los datos cuyo origen sea el backend no deberan almacenarse manualmente en Redux como fuente princiapl de verdad

Ejemplos:
- Accounts
- Transactions
- Sales
- Purchases
- Expenses
- Invoices
- Customers
- Suppliers
- Products

Estos datos pertenecen al servidor y sera gestionados mediante una solucion especializada para state, como `TanStack Query`

La responsabilidad sera:

Redux:
-> ¿Que esta haciendo el usuario y cual es el contexto actual de la aplicacion?

TranStack Query:
-> ¿Que datos existen actualmente en el servidor?

Backend:
-> ¿Que datos son validos y que reglas de negocio se pueden ejecutar?
---
## Estructura del Store
El Redux Store sera organizado por features/modulos, evitando crear un unico archivo global con toda la logica de la aplicacion

````
src/ 
└── store/ 
    ├── store.ts 
    ├── hooks.ts 
    └── middleware/
````

Cada modulo podra definir su propio slice:
````
src/ 
└── features/ 
    ├── auth/ 
    │   ├── store/  
    │   │     ├── authSlice.ts 
    │   │     └── authSelectors.ts 
    │   ├── components/ 
    │   ├── hooks/ 
    │   └── ... 
    ├── accounting/ 
    │   ├── store/ 
    │   │ ├── accountingSlice.ts 
    │   │ └── accountingSelectors.ts 
    │   └── ... 
    ├── sales/ 
    │   ├── store/ 
    │   │   ├── salesSlice.ts  
    │   │   └── salesSelectors.ts 
    │   └── ... 
    └── ui/ 
        └── store/ 
            ├── uiSlice.ts 
            └── uiSelectors.ts
````

La estructura podra evolucionar conforme el tamaño de cada modulo.
---
## Principios de la organizacion
### 1. Feature-first
La organizacion principal sera por funcionalidad o dominio y no por tipo tecnico

Se evitara una estructura global como:

components/
reducers/
actions/
services/
selectors/
hooks/

donde todas las funciones terminan mezcladas.

Se favorecera:
````
features/ 
├── accounting/ 
├── sales/ 
├── purchases/ 
├── inventory/ 
└── auth/
````
Cada feature sera responsable de su propio estado relacionado con la apliacion
---
### 2. Redux no representa el dominio
REdux no sera considerado una implementacion del dominio financiero ni ningun otro

Por ejemplo, no se debera colocar en Redux la regla:
Debe == Haber

ni reglas como:
- Una transaccion debe tener al menos dos entries
- Una cuenta no puede recibir determinadas operaciones
- Una transaccion confirmada no puede modificarse

Estas reglas pertenecen al dominio y deberan ser garantizadas por el backend

Redux solo representa el estado necesario para que la interfaz pueda interacuar con dicho dominio 

````
        Frontend 
            │ 
      Redux / UI State    
            │ 
            ↓ 
           API 
            │ 
            ↓ 
    Application Layer 
            │ 
            ↓ 
          Domain 
            │ 
            ↓ 
         Database
````
---
### 3. Actions como intencion
Las acciones de Redux deberan representar cambios significativos en el estado de la aplicacion y evitar acciones excesivamente genericas

Se favorecera:
- accountSelected
- transactionFormOpened
- transactionFormClosed
- transactionFormAdded
- transactionEntryRemoved

sobre acciones excesivamente genericas como:
- setData
- setValue
- updateState
- changeSomething

Esto mejora la trazabilidad y facilita la depuracion mediante Redux DevTools
--- 
### 4. Selectors
El acceso al estado Redux debera realizarse preferentemente mediante selectors

Ejemplo
- selectCurrentAccount
- selectSelectedDateRange
- selectTransactionDraft
- selectCurrentUser

los componentes no deberan depender innecesariamente de la estructura interna del Store

Esto permite modificar la estructura del estado sin tener que modificar todos los consumidores
---
### 5. Normalizacion
Cuando Redux necesite almacenar colecciones complejas de entidades, se favorecera el almacenamiento normalizado

Conceptualmente:

accounts:
    ids: [1, 2, 3]

    entities:
        1: {...}
        2: {...}
        3: {...}

En lugar de estructuras profundamente anidadas:
accounts:
    [
        {
            ...,
            transactions: [
                ...
            ]
        }
    ]

Esto reduce duplicacion y facilita actualizaciones parciales
---

### 6. Estado minimo
El Redux Store debera contener unicamente el estado necesario.

No se almacenaran valores que puedan derivarse facilmente de otros valores

Por ejemplo, si:

- quantity
- unitPrice

estan disponibles, no necesariamente se almacenara:

- subtotal

si este puede calcularse mediante un slector

La misma filosofia se aplicara al estado de interfaz
---
### 7. No duplicar Server State innecesariamente
No se debera realizar:
API 
 ↓ 
Redux 
 ↓ 
Component

Simplemente para mantener una copia manual de todos los datos del backend.

Cuando el estado corresponda a informacion remota:
API 
 ↓ 
TanStack Query 
 ↓ 
Component

Redux podra contener unicamente informacion derivada o necesaria para controlar el flujo de interaccion
---
## Integracion con los modulos de dominio
Los modulos del frontend estaran alineados conceptualmente con los modulos del backend, pero no seran implementacion identicas.

Por ejemplo: 

backend

accounting/ 
├── account 
├── transaction 
└── transaction_entry

puede corresponder en frontend a:
features/ 
└── accounting/ 
    ├── accounts/ 
    ├── transactions/ 
    ├── components/ 
    └── store/

La correspondencia representa una sepracion conceptual y no implica que el frontend y backend deban compartir modelos internos.
---
## Flujo de una operacion
Para una operacion financiera, el flujo esperado sera:

Usuario 
    │ 
    ↓ 
Componente 
    │ 
    ↓ 
Redux 
    │ 
    ↓ 
API Request 
    │
    ↓ 
Backend 
    │ 
    ↓ 
Application Service 
    │ 
    ↓ 
Domain 
    │ 
    ↓ 
Database

Ejemplo:
Usuario confirma una venta
        ↓
Frontend actualiza estado de UI
        ↓
Se realiza POST /sales
        ↓
Backend valida la venta
        ↓
Sale se confirma
        ↓
Se genera el hecho contable correspondiente
        ↓
Se registra Transaction
        ↓
Frontend invalida/refresca Server State

Redux no sera responsable de confirmar que la operacion sea contablemente valida
---
## Redux Middlaware
Redux Toolkit permitira incorporar middlaware cuando exista una necesidad concreta

Posibles usos futuros:

- Logging
- Analytics
- Auditing de acciones de UI
- Persistencia selectiva
- Integraciones
- Manejo de efectos especificos

No se agregaran middleware unicamente por anticipacion
---
## Persistencia
El Redux Store no sera tratado como almacenamiento permanente

El estado persistente debera pertenecer a mecanismos apropiados


Base de datos
    ↓
Server State

LocalStorage / IndexedDB
    ↓
Preferencias o estado local persistente

Redux
    ↓
Estado actual de la aplicación

La persistencia de partes del Store solamente se implementara cuando exista una necesidad concreta

---
## Convenciones 
Los desarroladores deberan:
- Utilziar Redux Toolkit en lugar de Redux clasico
- Crear slices por feature
- Utilizar slectors para acceder a estado complejo
- Evitar duplicar server state
- Evitar colocar reglas de negocio en reducers
- Mantener reducers puros
- Evitar almacenar informacion derivable
- Mantener el Store pequeño y explicitiro
- Documentar decisiones de estado no obvias
---
## Ejemplo conceptual
Un formulario de creacion de transaccion podria utilizar Redux para mantener su estado

transactionDraft
├── description
├── date
└── entries
    ├── accountId
    ├── debit
    └── credit

Redux puede permitir

- addEntry
- removeEntry
- updateEntry
- setDescription
- setDate
- clearDraft

Pero Redux no determina definitivamente si:
totalDebit = totalCredit

El backend debera validar dicha regla antes de crear la transaccion
---
## Concecuencias positivas
- Arquitectura predecible
- Estado global facilmente rastreable
- Buena integracion con Redux DevTools
- Facilita la incorporacion de nuevos desarroladores
- Permite separar estado local, estado de aplicacion y estado de servidor
- La estructura puede crecer junto con los modulos del ERP
-
- Permite estudiar patrones utilizados en aplicaciones empresariales
---
## Concecuencias negativas
- Introduce complejidad adicional frente a Context
- Requiere convenciones para evitar que el Store se convierta en un contenedor de todo
- Puede generar boilerplate si se utiliza para estados que deberian permanecer locales
- REquiere que el equipo comprenda la diferencia entre application state y server state
- El proyecto debera mantener disciplina arquitectonica para evitar acoplar el dominio a Redux
---
## Aternativas consideradas
### Context + useReducer
Fue considerado debido a su simplicidad y a que React proporciona ambas herramientas de manera nativa

Se descarta como mecanismo principal de estado gloabl debido al objetivo educativo y profesional del proyecto, asi como a la intencion de estudiar patrones de manejo de estados utilizados en aplicaciones empresariales

Podra seguir utilizandoce para casos especificos donde sea apropiado
---
### Zustand
Zustand presenta una API mas sencilla y menor cantidad de infraestructura

Se descarta como solucion principal debido a que el objetivo del proyecto incluye adquirir experiencia con Redux Toolkit y patrones de arquitectura de estado utilizado en equipos empresariales 

No se considera que Zustand sea tecnicamente inferior; simplemente no es la tecnologia seleccionada para este objetivo de aprendizaje
---

## Criterio de evolucion
La arquitectura no debera introducir mecanismos adicionales hasta que exista una necesidad concreta

La evolucion esparada sera:
useState
   ↓
useReducer
   ↓
Redux Toolkit
   ↓
Redux Toolkit + Server State Management
   ↓
Middleware / optimizaciones específicas

La complejidad debera introducirse progresivamente conforme el dominio y las necesidades de la aplicacion lo requieran
--- 
### Resultado esperado
Redux debera funcionar como una **infraestructura de estado de aplicacion**, proporcionando una forma consistente y observable de coordinar la interfaz y los flujos de interaccion a medida que la aplicacion evoluciona hacia un sistema ERP.

El dominio financiero permanecera desacoplado de Redux y continuara siendo responsabilidad de las capas de dominio y aplicacion del backend asi como cualquier otro dominio realizado actualmente y de manera futura