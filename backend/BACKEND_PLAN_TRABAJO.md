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

## Proximos cambios
- Cambio 5: Crear endpoints de `categories`.
- Cambio 6: Agregar CORS.
