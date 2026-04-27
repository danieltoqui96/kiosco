# Plan de Trabajo Frontend (Kiosco)

Fecha de inicio: 2026-04-27

## Objetivo
Convertir la maqueta actual del frontend en componentes funcionales conectados al backend real, manteniendo el diseno de la interfaz y alineando contratos de datos con los endpoints existentes.

Regla de trabajo activa: pedir aprobacion antes de cada cambio.

## Contexto validado
- El backend expone `products`, `brands` y `categories`.
- Las respuestas usan formato comun: `success`, `data`, `msg`.
- `GET /products`, `GET /brands`, `GET /categories` devuelven `data` paginada:
  `items`, `page`, `limit`, `total`, `totalPages`.
- La maqueta visual ya existe en layout, pero el feature de `products` aun no esta implementado en archivos dedicados.

## Plan por etapas

### Etapa 1: Base del feature de productos
- Mover la maqueta de productos a `src/features/products` en componentes reutilizables.
- Definir tipos frontend alineados al backend.
- Crear estado base para listado, seleccion y filtros.

#### Micro-plan Etapa 1 (desmenuzado)
1. `1.1` Crear tipos base del feature en `src/features/products/types.ts`.
Objetivo: definir contratos internos para producto, filtros de UI, paginacion y estado de seleccion.
Entregable: archivo de tipos con interfaces reutilizables por componentes.
Nota de alineacion: en este paso tambien se define la frontera entre datos reales de backend y datos solo de maqueta.

2. `1.2` Crear utilidades de presentacion del feature.
Objetivo: centralizar helpers de UI (estado de stock, formato de precio, texto de estado).
Entregable: funciones puras para evitar logica duplicada en JSX.

3. `1.3` Implementar `ProductTable` como componente aislado.
Objetivo: renderizar tabla desde props (sin fetch), incluyendo seleccion de fila y acciones.
Entregable: `ProductTable.tsx` con props tipadas y estructura de maqueta preservada.

4. `1.4` Implementar `BarcodeSearch` como componente aislado.
Objetivo: encapsular input + submit + tecla Enter para busqueda por codigo o texto.
Entregable: `BarcodeSearch.tsx` controlado por props/callbacks.

5. `1.5` Implementar `ProductDetails` como panel aislado.
Objetivo: mostrar detalle del producto seleccionado y estados vacio/cargando local.
Entregable: `ProductDetails.tsx` sin dependencias de API.

6. `1.6` Implementar `ProductFormModal` en modo estructura base.
Objetivo: dejar formulario base conectado a estado local (abrir/cerrar, submit), sin persistencia aun.
Entregable: `ProductFormModal.tsx` con validaciones minimas de frontend.

7. `1.7` Crear `ProductPage` para orquestar estado base.
Objetivo: concentrar estado local de listado mock, filtros UI, seleccion y modal.
Entregable: `ProductPage.tsx` integrando los componentes anteriores con datos mock internos.

8. `1.8` Integrar `ProductPage` en el layout actual.
Objetivo: reemplazar bloque hardcodeado de productos en `MainLayout` por la pagina funcional.
Entregable: `MainLayout` conectado al feature sin romper estructura visual general.

9. `1.9` Mover/ajustar estilos del feature.
Objetivo: asegurar que clases de productos sigan funcionando desde el feature modular.
Entregable: `styles/products.css` activo e importado donde corresponda.

10. `1.10` Validacion tecnica de Etapa 1.
Objetivo: compilar y corregir errores tipicos antes de pasar a integracion API.
Entregable: `npm run build` en frontend sin errores.

#### Matriz de datos: backend vs maqueta (base para limpieza gradual)

Campos soportados por backend (mantener como fuente real):
- `id`
- `codebar`
- `name`
- `brand`
- `category`
- `salePrice`
- `purchasePrice`
- `stock`
- `isActive`
- paginacion: `items`, `page`, `limit`, `total`, `totalPages`

Campos de UI derivados (permitidos en frontend, no vienen directos):
- `stockStatus` (derivado de `stock`, por ejemplo `ok`, `low`, `zero`)
- `statusLabel` (derivado de `isActive` y/o regla de stock)
- textos de resumen (ejemplo: "Mostrando X de Y")

Campos de maqueta sin respaldo actual en backend (temporales en Etapa 1):
- `sku`
- `provider` o `supplier`
- `model`
- `monthlySales`
- `minStock`
- `location`
- `lastEntryDate`
- `description`
- imagen de producto real

Regla de limpieza:
- Etapa 1: se pueden mantener como placeholders visuales.
- Etapa 2: remover del flujo principal los campos sin respaldo backend.
- Etapa 3+: reintroducir solo si backend los incorpora oficialmente.

### Etapa 2: Integracion de lectura con backend
- Crear cliente API para `products`, `brands`, `categories`.
- Cargar listado paginado real de productos.
- Cargar listas de marcas y categorias para filtros.
- Integrar busqueda por codigo de barras.

### Etapa 3: Interaccion CRUD en UI
- Conectar alta de producto desde modal.
- Conectar edicion y eliminacion desde tabla/panel.
- Refrescar datos luego de operaciones y mostrar estados de carga/error.

### Etapa 4: Cierre tecnico
- Ajustar detalles de UX y consistencia visual.
- Validar compilacion/lint.
- Registrar resumen de cambios por cada etapa en esta bitacora.

## Bitacora de cambios y resumenes

### Cambio 0 - Documento de seguimiento creado
**Fecha:** 2026-04-27  
**Resumen:** Se creo este archivo para centralizar el plan de trabajo frontend, mantener trazabilidad de avances y aplicar la regla de aprobacion previa por cada cambio.

### Cambio 1 - Etapa 1 completada (feature products funcional con mock)
**Fecha:** 2026-04-27  
**Resumen:** Se implemento la base completa del feature de productos:
- Tipos alineados a backend y estados de UI.
- Utilidades de presentacion (precio, estado de stock, badges).
- Componentes funcionales: `ProductTable`, `BarcodeSearch`, `ProductDetails`, `ProductFormModal`.
- Orquestacion local en `ProductPage` con filtros, seleccion, paginacion y CRUD mock.
- Integracion en layout (`MainLayout`) reemplazando la maqueta hardcodeada.
- Activacion de `products.css` como entrypoint de estilos del feature.
**Validacion:** `npm.cmd run lint` OK y `npm.cmd run build` OK.

### Cambio 2 - Etapa 2 completada (lectura real desde backend)
**Fecha:** 2026-04-27  
**Resumen:** Se conecto el frontend a datos reales del backend para lectura:
- Cliente HTTP tipado y servicios API para `products`, `brands` y `categories`.
- `ProductPage` conectado a `GET /products` con filtros y paginacion server-side.
- Carga de catalogos reales para filtros de marca y categoria.
- Busqueda exacta por codigo de barras con `GET /products/codebar/:codebar`.
- Fallback a busqueda general cuando el codigo no existe.
**Validacion:** `npm.cmd run lint` OK y `npm.cmd run build` OK.

### Cambio 3 - Etapa 3 completada (CRUD real de productos)
**Fecha:** 2026-04-27  
**Resumen:** Se conectaron operaciones CRUD reales de productos en frontend:
- Crear producto desde modal con `POST /products`.
- Editar producto desde modal con `PUT /products/:id`.
- Eliminar producto con confirmacion y `DELETE /products/:id`.
- Recarga de listado despues de operaciones y sincronizacion de seleccion.
- Refresco de catalogos (marcas/categorias) tras crear/editar.
**Validacion:** `npm.cmd run lint` OK y `npm.cmd run build` OK.

## Proximos cambios
- Pendiente: `Cambio 4` (cierre tecnico, limpieza y ajustes finales de UX).
