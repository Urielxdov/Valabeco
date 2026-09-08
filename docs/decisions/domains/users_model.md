# ADR03: Dominio de estructura organizacional

## Estado
Planificación

## Contexto
El ERP requiere representar la estructura organizacional de la empresa y relacionarla con los usuarios que operan el sistema.

Se busca evitar una relación directa entre las responsabilidades organizacionales y los usuarios, ya que un usuario puede dejar de pertenecer a la organización mientras que la posición que ocupaba puede continuar existiendo.

Por esta razón se establece una separación entre:
- **Puesto**: define una función o cargo dentro de la organización.
- **Posición**: representa una plaza concreta dentro de la estructura organizacional.
- **Usuario**: representa la identidad que utiliza el sistema.

La relación principal será:

```text
Puesto 1 ---- N Posiciones
Posición 1 ---- N Asignaciones de posición
Asignación de posición N ---- 1 Usuario
```

Una posición puede encontrarse vacante cuando no tiene una asignación activa.

La tabla `position` no tendrá una FK directa hacia `user`. La ocupación actual se obtiene desde `position_assignment`, tomando la asignación activa.

---

## Objetivos

El módulo debe permitir:
1. Definir los puestos existentes en la organización.
2. Crear múltiples posiciones a partir de un puesto.
3. Limitar el número de posiciones activas que puede tener un puesto.
4. Asignar un usuario a una posición.
5. Mantener el historial de usuarios que han ocupado una posición.
6. Permitir que la posición quede vacante.
7. Representar posteriormente la estructura jerárquica de la organización.
8. Servir como referencia para otros módulos del ERP.
9. Permitir identificar la posición responsable de una operación, independientemente del usuario que la haya ejecutado.

---

## Conceptos del dominio

### Puesto
Un puesto representa una función o cargo dentro de la organización.

Ejemplos:
- Gerente de Ventas
- Vendedor
- Contador
- Administrador de Sistemas
- Almacenista

El puesto describe qué función desempeña una persona, pero no representa a una persona específica.

**Características**
- Puede tener múltiples posiciones.
- Puede existir aunque actualmente ninguna posición esté ocupada.
- Puede limitar el número de posiciones activas asociadas a él.
- Puede utilizarse posteriormente para definir permisos, responsabilidades o características organizacionales.

**Ejemplo**
```text
Puesto
+-- Vendedor
    +-- Posición 001
    +-- Posición 002
    +-- Posición 003
```

---

### Posición
Una posición representa una plaza específica dentro de la organización.

Una posición pertenece obligatoriamente a un puesto.

```text
Puesto 1 ---- N Posiciones
```

Una posición puede estar estructuralmente:
- Activa
- Inactiva

La ocupación de una posición se deriva de sus asignaciones:
- **Ocupada**: tiene una asignación activa.
- **Vacante**: no tiene una asignación activa.

Una posición no debe eliminarse únicamente porque el usuario que la ocupaba haya sido dado de baja.

**Ejemplo**
```text
Puesto:
    Vendedor

Posiciones:
    Vendedor - Sucursal Norte
    Vendedor - Sucursal Centro
    Vendedor - Sucursal Sur
```

Cada una representa una plaza diferente aunque todas pertenezcan al mismo puesto.

---

### Usuario
El usuario representa una identidad que tiene acceso al ERP.

El usuario pertenece al dominio de Identidad y Acceso, no al dominio de Estructura Organizacional.

La estructura organizacional únicamente mantiene la relación histórica entre un usuario y una posición mediante `position_assignment`.

```text
Usuario
   |
   v
PositionAssignment
   |
   v
Posición
   |
   v
Puesto
```

Un usuario puede dejar de ocupar una posición sin necesidad de eliminar su registro de usuario.

---

## Relaciones

### Puesto -> Posición

```text
Puesto 1 ---- N Posiciones
```

Un puesto puede tener muchas posiciones.

Una posición pertenece a un único puesto.

**Ejemplo**
```text
Puesto: Gerente de Ventas

    +-- Posición: Gerente Norte
    +-- Posición: Gerente Centro
    +-- Posición: Gerente Sur
```

---

### Posición -> Usuario

No existirá una FK directa desde `position` hacia `user`.

La relación entre una posición y un usuario se representará mediante `position_assignment`.

```text
Posición 1 ---- N PositionAssignment
PositionAssignment N ---- 1 Usuario
```

La posición actual de un usuario, o el usuario actual de una posición, se obtiene consultando la asignación activa.

**Ejemplo de posición ocupada**
```text
Posición: Gerente Norte
Asignación activa:
    Usuario: Juan Pérez
    start_date: 2026-09-01
    end_date: NULL
    status: ACTIVE
```

**Ejemplo de posición vacante**
```text
Posición: Gerente Norte
Asignación activa: NULL
Estado de ocupación derivado: VACANTE
```

La posición sigue existiendo aunque no tenga asignación activa.

---

## Historial de asignaciones
La asignación entre posición y usuario se conservará en una entidad histórica.

La ocupación actual se obtiene desde la asignación activa, no desde una FK en `position`.

**Modelo conceptual**
```text
PositionAssignment
+-- id
+-- position_id
+-- user_id
+-- start_date
+-- end_date
+-- status
```

**Ejemplo**
```text
Posición: Gerente Norte

Historial:
Juan Pérez
01/01/2025 --- 31/08/2026

María López
01/09/2026 --- NULL
```

Esto permite conocer quién ocupó una posición en un periodo determinado.

---

## Estados

### Posición
Una posición podrá tener como mínimo:
- **ACTIVE**: la posición forma parte de la estructura organizacional activa.
- **INACTIVE**: la posición deja de formar parte de la estructura organizacional activa.

### Ocupación derivada
La ocupación no se guarda directamente en `position`; se deriva desde `position_assignment`.

- **VACANTE**: la posición existe, está activa y no tiene una asignación activa.
- **OCUPADA**: la posición existe, está activa y tiene una asignación activa.

No debe confundirse una posición inactiva con una posición vacante.

---

## Modelo de datos inicial

### Entidad Puesto (`job_position`)
Representa el cargo o función que existe dentro de la estructura organizacional de la empresa. Un puesto puede tener múltiples posiciones.

| Campo | Tipo de datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_job_position` | UUID / BIGINT | PK | Identificador único del puesto |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Código único del puesto |
| `name` | VARCHAR(150) | NOT NULL | Nombre del puesto |
| `description` | VARCHAR(500) | NULLABLE | Descripción de las funciones o características del puesto |
| `max_positions` | INT | NULLABLE, CHECK > 0 | Límite de posiciones activas permitidas para el puesto. `NULL` significa sin límite |
| `status` | ENUM | NOT NULL | Estado del puesto |
| `created_at` | TIMESTAMP | NOT NULL | Fecha de creación del puesto |
| `updated_at` | TIMESTAMP | NOT NULL | Fecha de última modificación |

**Relación**
```text
job_position 1 ---- N position
```

---

### Entidad Posición (`position`)
Representa una plaza específica dentro de la estructura organizacional. Una posición pertenece a un puesto y puede encontrarse vacante cuando no tiene una asignación activa.

| Campo | Tipo de datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_position` | UUID / BIGINT | PK | Identificador único de la posición |
| `id_job_position` | UUID / BIGINT | FK, NOT NULL | Puesto al que pertenece la posición |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Código único de la posición |
| `name` | VARCHAR(100) | NOT NULL | Nombre de la posición |
| `status` | ENUM | NOT NULL | Estado estructural de la posición |
| `created_at` | TIMESTAMP | NOT NULL | Fecha de creación de la posición |
| `updated_at` | TIMESTAMP | NOT NULL | Fecha de última modificación |

**Estados iniciales**
```text
ACTIVE
INACTIVE
```

`position` no debe tener `id_user`. La ocupación actual se obtiene desde `position_assignment`, consultando la asignación activa.

---

### Entidad Asignación de Posición (`position_assignment`)
Representa la asignación de un usuario a una posición durante un periodo determinado.

Permite conservar el historial de ocupantes de una posición.

| Campo | Tipo de datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_position_assignment` | UUID / BIGINT | PK | Identificador único de la asignación |
| `id_position` | UUID / BIGINT | FK, NOT NULL | Posición asignada |
| `id_user` | UUID / BIGINT | FK, NOT NULL | Usuario asignado a la posición |
| `start_date` | TIMESTAMP | NOT NULL | Fecha en que inicia la asignación |
| `end_date` | TIMESTAMP | NULLABLE | Fecha en que termina la asignación |
| `status` | ENUM | NOT NULL | Estado de la asignación |
| `created_at` | TIMESTAMP | NOT NULL | Fecha de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL | Fecha de última modificación |

**Estados iniciales**
```text
ACTIVE
ENDED
CANCELED
```

**Relación**
```text
position 1 ---- N position_assignment
position_assignment N ---- 1 user
```

**Regla importante**
```text
Una posición puede tener muchas asignaciones históricas,
pero solamente una asignación activa simultánea.
```

**Restricción recomendada**
```sql
CREATE UNIQUE INDEX uq_position_assignment_active_position
ON position_assignment (id_position)
WHERE status = 'ACTIVE' AND end_date IS NULL;
```

Si el negocio requiere que un usuario solo pueda ocupar una posición a la vez, también debe agregarse una restricción equivalente para `id_user`:

```sql
CREATE UNIQUE INDEX uq_position_assignment_active_user
ON position_assignment (id_user)
WHERE status = 'ACTIVE' AND end_date IS NULL;
```

**Ejemplo**
```text
Position: VENDEDOR-NORTE

PositionAssignment
----------------------------------------
Juan       01/01/2025 -> 31/08/2026
María      01/09/2026 -> NULL
```

---

## Reglas de negocio

### RN-001 - Una posición pertenece a un puesto
Toda posición debe estar asociada a un puesto existente.

---

### RN-002 - Una posición puede estar vacante
No es obligatorio que una posición tenga un usuario asignado.

Una posición está vacante cuando no existe una asignación activa en `position_assignment`.

La vacante no implica que la posición deba eliminarse.

---

### RN-003 - Una posición no puede tener múltiples usuarios activos
Una posición solamente puede tener una asignación activa.

```text
Position
    |
    +-- PositionAssignment activa
            |
            +-- Usuario actual
```

El historial puede contener múltiples usuarios, pero únicamente uno puede ocupar la posición en un momento determinado.

Esta regla debe reforzarse con una restricción de base de datos para evitar duplicados por concurrencia.

---

### RN-004 - Un usuario puede cambiar de posición
Cuando un usuario cambia de posición, debe cerrarse la asignación anterior y registrarse una nueva.

```text
Posición A
    |
    +-- Usuario X
            |
            v
         finaliza

Posición B
    |
    +-- Usuario X
            |
            v
      nueva asignación
```

---

### RN-005 - La baja de un usuario no elimina la posición
Cuando un usuario deja de pertenecer a la organización:

```text
Usuario  -> INACTIVE
Posición -> sin asignación activa
```

La posición permanece disponible para una futura asignación.

---

### RN-006 - No eliminar usuarios con historial operativo
Un usuario que haya participado en operaciones del ERP no debería eliminarse físicamente si esto provoca pérdida de trazabilidad.

Debe utilizarse borrado lógico mediante estados como:
- `ACTIVE`
- `INACTIVE`

---

### RN-007 - Limitar el número de posiciones por puesto
El límite recomendado debe vivir en `job_position.max_positions`.

`max_positions` representa el número máximo de posiciones activas permitidas para un puesto.

Reglas:
- Si `max_positions` es `NULL`, el puesto no tiene límite configurado.
- Si `max_positions` tiene valor, no se pueden crear o reactivar posiciones activas por encima de ese límite.
- Las posiciones con `status = INACTIVE` no cuentan contra el límite.
- Las posiciones vacantes sí cuentan contra el límite, porque siguen siendo plazas activas dentro de la estructura organizacional.
- No debe permitirse reducir `max_positions` por debajo del número actual de posiciones activas, salvo que antes se inactiven posiciones.

Esta regla debe validarse dentro del servicio de dominio que crea o reactiva posiciones. Si existe riesgo de concurrencia, la operación debe ejecutarse dentro de una transacción y bloquear el puesto afectado mientras se valida el conteo.

---

## Auditoría
La estructura organizacional debe integrarse con el sistema general de auditoría del ERP.

Las operaciones relevantes deberán registrar:
- Quién realizó la operación.
- Qué entidad modificó.
- Qué registro modificó.
- Qué cambió.
- Cuándo ocurrió.

**Ejemplo**
```text
Usuario: administrador
Acción: ASSIGN_USER
Entidad: Position
Registro: POS-001
Anterior: VACANTE
Nuevo: Juan Pérez
Fecha: 2026-09-08 12:30
```

La auditoría debe distinguir entre:

```text
Usuario que ejecutó la operación
Usuario que ocupa la posición afectada
```

No necesariamente son la misma persona.

---

## Integración con otros módulos
La estructura organizacional podrá ser utilizada por otros dominios del ERP.

**Ejemplo**
```text
Ventas
    |
    +-- vendedor -> Posición

Compras
    |
    +-- responsable -> Posición

Inventario
    |
    +-- responsable -> Posición

Contabilidad
    |
    +-- responsable -> Posición

Auditoría
    |
    +-- actor -> Usuario
```

Esto permite mantener separadas las responsabilidades.

---

## Ejemplo completo
Supongamos que existe el siguiente puesto:

```text
Puesto
+-- Vendedor
```

La empresa requiere tres plazas:

```text
Posiciones
+-- Vendedor Norte
+-- Vendedor Centro
+-- Vendedor Sur
```

Actualmente:
```text
Vendedor Norte
    +-- Juan

Vendedor Centro
    +-- María

Vendedor Sur
    +-- VACANTE
```

Si Juan deja la empresa:

```text
Vendedor Norte
    +-- VACANTE
```

El historial conserva:

```text
Vendedor Norte

Juan
Inicio: 01/01/2025
Fin: 08/09/2026
```

Posteriormente puede asignarse:

```text
Vendedor Norte
    +-- Carlos
```

Sin modificar la identidad histórica de la posición.

---

## Decisiones arquitectónicas

### Separar Usuario de Posición
El usuario representa identidad y acceso al sistema.

La posición representa una plaza dentro de la organización.

No deben utilizarse como sinónimos.

### No guardar `id_user` en `position`
La posición no conserva una FK directa al usuario actual.

La relación actual e histórica entre usuario y posición se obtiene desde `position_assignment`.

### Mantener las posiciones aunque estén vacantes
Una posición representa una necesidad estructural de la organización y no la existencia de una persona determinada.

### Mantener historial de asignaciones
La relación actual no es suficiente para un ERP debido a la necesidad de trazabilidad histórica.

### Utilizar Posición como referencia organizacional
Cuando otro módulo necesite identificar la responsabilidad organizacional de una operación, deberá preferirse la posición cuando conceptualmente corresponda.

El usuario deberá conservarse como el actor que ejecutó la operación.

---

## Evolución futura
El módulo puede extenderse posteriormente para soportar:
- Departamentos
- Áreas
- Sucursales
- Jerarquías organizacionales
- Supervisores
- Organigramas
- Centros de costo
- Permisos derivados del puesto
- Delegaciones temporales
- Sustituciones
- Historial organizacional
- Integración con Recursos Humanos
- Integraciones con nómina

Estas funciones no forman parte de la primera versión del módulo.

---

## Resumen del modelo
```text
Puesto
   |
   | 1:N
   v
Posición
   |
   | 1:N
   v
PositionAssignment
   |
   | N:1
   v
Usuario
```

La estructura fundamental del módulo queda definida como:

```text
Puesto
   -> 1:N
Posición
   -> 1:N
PositionAssignment
   -> N:1
Usuario
```

La ocupación actual se obtiene mediante:

```text
Posición
   -> asignación activa en PositionAssignment
   -> Usuario actual
```

Si no existe asignación activa, la posición está vacante.
