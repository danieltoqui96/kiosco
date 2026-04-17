# Plan de Trabajo Backend (Kiosco)

Fecha de inicio: 2026-04-16

## Objetivo
Ordenar y ejecutar mejoras del backend en este orden:
1. Adaptar productos al nuevo esquema relacional.
2. Crear endpoints para `brands` y `categories`.
3. Agregar CORS.
4. Mejorar calidad de codigo y comentarios.

Regla de trabajo activa: pedir aprobacion antes de cada cambio.

## Plan por etapas

### Etapa 1: Adaptacion de productos
- Cambiar `status` a `isActive`.
- Cambiar `brand`/`category` a `brandId`/`categoryId`.
- Ajustar schema, tipos, mapper y modelo.

### Etapa 2: Endpoints de tablas nuevas
- Crear modulo `brands` (schema, model, controller, router).
- Crear modulo `categories` (schema, model, controller, router).
- Integrar rutas en `app.ts`.

### Etapa 3: CORS
- Instalar y configurar middleware CORS.
- Parametrizar origenes permitidos por variable de entorno.

### Etapa 4: Mejora de codigo y comentarios
- Reducir duplicacion donde aporte claridad.
- Agregar comentarios utiles en bloques no triviales.

## Bitacora de cambios y resumenes

### Cambio 0 - Documento de seguimiento creado
**Fecha:** 2026-04-16  
**Resumen:** Se creo este archivo para centralizar el plan de trabajo y registrar un resumen despues de cada cambio.

### Cambio 1 - Campos `stock` y `status` en productos
**Fecha:** 2026-04-16  
**Resumen:** Se agregaron los campos `stock` y `status` al contrato del producto en la API y se ajustaron validaciones, tipos y mapeo.
**Validacion:** `npm.cmd run build` OK.

### Cambio 2 - `status` ajustado a boolean
**Fecha:** 2026-04-16  
**Resumen:** Se reemplazo `status` tipo enum por `status` booleano para simplificar el modelo.
**Validacion:** `npm.cmd run build` OK.

### Cambio 3 - Adaptacion de products al nuevo esquema relacional
**Fecha:** 2026-04-16  
**Resumen:** Se adapto el contrato de producto al nuevo esquema SQL: `brandId`/`categoryId` en API y `brand_id`/`category_id` en DB.  
Se renombro `status` a `isActive` (mapeado con `is_active` en DB) y se actualizaron validaciones y mapeos.
**Validacion:** `npm.cmd run build` OK.

### Cambio 4 - Endpoints CRUD de brands
**Fecha:** 2026-04-16  
**Resumen:** Se creo el modulo completo `brands` (schema, types, model, controller y router) con CRUD:
`GET /brands`, `GET /brands/:id`, `POST /brands`, `PUT /brands/:id`, `DELETE /brands/:id`.  
Tambien se integro el router en `app.ts`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 5 - Endpoints CRUD de categories
**Fecha:** 2026-04-16  
**Resumen:** Se creo el modulo completo `categories` (schema, types, model, controller y router) con CRUD:
`GET /categories`, `GET /categories/:id`, `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`.  
Tambien se integro el router en `app.ts`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 6 - Ajuste de queries de products para esquema relacional
**Fecha:** 2026-04-16  
**Resumen:** Se actualizaron las queries de `products` para trabajar correctamente con `brand_id`, `category_id` e `is_active`, incluyendo `JOIN` con `brands` y `categories` en lecturas.  
Se agrego validacion previa de referencias (`brandId`, `categoryId`) en create/update para responder error controlado si la referencia no existe.  
Tambien se corrigio el orden de rutas para que `GET /products/codebar/:codebar` no choque con `GET /products/:id`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 7 - Products responde marca y categoria por nombre
**Fecha:** 2026-04-16  
**Resumen:** Se ajusto el contrato de salida de `products` para devolver `brand` y `category` (nombre) en lugar de `brandId` y `categoryId`.  
Se separo esquema de lectura y escritura: create/update siguen recibiendo IDs, pero las respuestas del API exponen solo nombres de marca/categoria junto a los demas campos de producto.
**Validacion:** `npm.cmd run build` OK.

### Cambio 8 - Validacion de referencias dentro de add/update en products
**Fecha:** 2026-04-16  
**Resumen:** Se elimino el enfoque de error/clase dedicada para referencias y la validacion quedo embebida directamente en `addProduct` y `updateProduct`.  
Tambien se ajusto `products.controller.ts` para devolver 400 cuando `brandId` o `categoryId` no existen, usando mensajes claros y manteniendo el flujo simple.
**Validacion:** `npm.cmd run build` OK.

### Cambio 9 - Eliminacion de `IdRow` en products.model
**Fecha:** 2026-04-16  
**Resumen:** Se retiro la interfaz `IdRow` y se dejo validacion de referencias con tipado inline en las queries (`RowDataPacket & { id: number }`), manteniendo el mismo comportamiento.
**Validacion:** `npm.cmd run build` OK.

### Cambio 10 - addProduct con find-or-create de brand y category
**Fecha:** 2026-04-16  
**Resumen:** Se ajusto `addProduct` para buscar `brand` por nombre y crearla si no existe; luego hacer lo mismo con `category`; y finalmente crear el producto con los IDs resultantes.  
Se agrego manejo de errores separado para las tres operaciones a base de datos: marca, categoria y producto.
**Validacion:** `npm.cmd run build` OK.

### Cambio 11 - updateProduct con find-or-create de brand y category
**Fecha:** 2026-04-16  
**Resumen:** Se ajusto `updateProduct` para que, si llegan `brand` y/o `category` por nombre, haga find-or-create y actualice internamente `brand_id` y `category_id`.  
Si esos campos no llegan en el body, no se tocan las relaciones. Se agrego manejo de errores separado para operacion de marca, categoria y actualizacion de producto.
**Validacion:** `npm.cmd run build` OK.

### Cambio 12 - Centralizacion de errores de products en el modelo
**Fecha:** 2026-04-16  
**Resumen:** Se agrego `AppError` reutilizable y el modelo de `products` ahora lanza errores con mensaje final para cada fallo de DB, evitando codigos de error internos.  
El controller se simplifico con un unico helper de manejo de errores y se elimino repeticion de condicionales por mensaje.
**Validacion:** `npm.cmd run build` OK.

### Cambio 13 - Reemplazo de AppError clase por funciones
**Fecha:** 2026-04-16  
**Resumen:** Se reemplazo la clase `AppError` por utilidades funcionales (`createAppError` e `isAppError`) para mantener el mismo comportamiento con un enfoque mas simple.  
El modelo y controller de `products` fueron actualizados para usar estas funciones.
**Validacion:** `npm.cmd run build` OK.

### Cambio 14 - Busqueda exacta por nombre y manejo de errores con `code`
**Fecha:** 2026-04-16  
**Resumen:** Se agregaron endpoints de busqueda exacta por nombre:
`GET /brands/name/:name` y `GET /categories/name/:name`.  
Los modelos de `brands` y `categories` ahora lanzan errores con formato `{ message, code }` cuando no encuentran registro o falla una operacion.
`products.model` reutiliza estas funciones para hacer find-or-create en add/update y los controladores manejan errores con un solo `if (error.code)`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 15 - Middleware de respuestas (`res.success` / `res.error`)
**Fecha:** 2026-04-17  
**Resumen:** Se implemento middleware de respuesta para evitar el uso de `sendResponse(res, ...)` y simplificar controladores.  
Se agrego tipado global de Express para `Response`, se integro el middleware en `app.ts` y se migraron los controladores de `products`, `brands` y `categories` a `res.success(...)` y `res.error(...)`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 16 - Helper compartido de status code y error en `data`
**Fecha:** 2026-04-17  
**Resumen:** Se centralizo `getStatusCode` en `src/utils/controller-error.utils.ts` y se agrego `getErrorData` para enviar detalles del error en `data` al responder con `res.error(...)`.  
Se actualizaron controladores de `products`, `brands` y `categories` para dejar de repetir esa logica y responder errores de forma consistente.
**Validacion:** `npm.cmd run build` OK.

### Cambio 17 - Centralizacion final de `getStatusCode` y trazabilidad de errores
**Fecha:** 2026-04-17  
**Resumen:** Se removieron implementaciones locales repetidas de `getStatusCode` en controladores y se unifico el consumo de `src/utils/controller-error.utils.ts`.  
En los `catch` se mantiene la respuesta estandar y ahora se adjunta `error` serializado en `data` para facilitar debug desde cliente.
**Validacion:** `npm.cmd run build` OK.

### Cambio 18 - Configuracion de CORS por entorno
**Fecha:** 2026-04-17  
**Resumen:** Se instalo `cors` y `@types/cors`, y se agrego middleware CORS en `app.ts` con lista de origenes permitidos desde `CORS_ORIGINS` (separados por coma).  
Si `CORS_ORIGINS` esta vacio, se permite cualquier origen; si tiene valores, solo esos origenes quedan habilitados.
Tambien se actualizo `.env.template` con `CORS_ORIGINS=`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 19 - Paginacion base en endpoints getAll
**Fecha:** 2026-04-17  
**Resumen:** Se implemento paginacion en `GET /products`, `GET /brands` y `GET /categories` usando query params `page` y `limit`.  
Los modelos ahora retornan estructura paginada con `items`, `page`, `limit`, `total` y `totalPages`, y se agrego util compartido `src/utils/pagination.utils.ts`.
**Validacion:** `npm.cmd run build` OK.

### Cambio 20 - Filtros en products y busqueda en brands/categories
**Fecha:** 2026-04-17  
**Resumen:** Se agregaron filtros en `GET /products` con query params:
`search`, `brand`, `category`, `isActive`, `minSalePrice`, `maxSalePrice`, `minStock`, `maxStock`.  
En `GET /brands` y `GET /categories` se agrego `search` por nombre (LIKE), manteniendo paginacion y metadatos.
Tambien se extendio `src/utils/pagination.utils.ts` con helpers de parseo de query params (`string`, `number`, `boolean`).
**Validacion:** `npm.cmd run build` OK.

### Cambio 21 - Ajustes opcionales de limpieza y estructura
**Fecha:** 2026-04-17  
**Resumen:** Se eliminaron piezas no usadas y se ordenaron detalles de estructura:
- Se removio `baseWriteProductSchema` en `products.schema.ts` (no se usaba).
- Se corrigio texto con encoding roto en `categories.model.ts` para mantener mensajes consistentes.
- Se movio `@types/cors` a `devDependencies` en `package.json` (tipos de desarrollo).
**Validacion:** `npm.cmd install` y `npm.cmd run build` OK.

### Cambio 22 - Separacion de bootstrap: CORS, env y rutas
**Fecha:** 2026-04-17  
**Resumen:** Se movio la configuracion de CORS a `src/config/cors.ts` y las variables de entorno derivadas a `src/config/env.ts`.  
Ademas, se centralizo el registro de rutas en `src/routes/index.ts` para dejar `src/app.ts` enfocado solo en el arranque de la aplicacion.
**Validacion:** `npm.cmd run build` OK.

## Proximos cambios
- Pendiente: definir nuevos cambios.
