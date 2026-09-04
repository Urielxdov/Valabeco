# Modelado de Base de Datos

Este documento define las convenciones de nombres para el modelo relacional en
PostgreSQL. El objetivo es mantener un estandar consistente entre dominios,
migraciones, Prisma y consultas SQL.

## Tablas

Las tablas siempre se nombran en minusculas y con palabras separadas por guion
bajo.

Formato:

```txt
nombre_de_la_tabla
```

Ejemplos:

```txt
account
user_profile
lab_result
service_order
```

## Llaves primarias

El identificador principal de cada tabla siempre se nombrara con el formato:

```txt
id_{nombre_de_la_tabla}
```

Ejemplos:

```txt
account.id_account
user_profile.id_user_profile
lab_result.id_lab_result
service_order.id_service_order
```

Esta regla aplica aunque el modelo de dominio o el modelo Prisma usen nombres
mas idiomaticos en TypeScript.

## Prisma

Prisma puede usar modelos en `PascalCase` y propiedades idiomaticas para
TypeScript, pero siempre debe mapear explicitamente a los nombres reales de
PostgreSQL cuando haga falta.

Ejemplo:

```prisma
model UserProfile {
  idUserProfile String @id @map("id_user_profile")

  @@map("user_profile")
}
```

Reglas:

- Los nombres fisicos de PostgreSQL son la fuente de verdad para tablas y
  columnas.
- Los nombres del schema Prisma pueden adaptarse a TypeScript, siempre que usen
  `@map` y `@@map` para respetar el estandar de base de datos.
- Los modelos Prisma siguen siendo modelos de persistencia; no sustituyen a las
  entidades del dominio.

