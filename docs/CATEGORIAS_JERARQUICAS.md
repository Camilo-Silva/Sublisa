# Sistema de Categorías Jerárquicas - Implementación

## 📋 Resumen

Se ha implementado un sistema de categorías de dos niveles para mejorar la organización de productos en la tienda online.

## 🎯 Características Implementadas

### 1. **Estructura de Categorías**
- **Nivel 1 (Categorías Principales)**:
  - Para Sublimar
  - Sublimado
  - DTF
  - Otros

- **Nivel 2 (Subcategorías por Categoría)**:
  - **Para Sublimar**: Remeras, Tazas, Llaveros, Termos, Gorras, Almohadones, Azulejos, Individuales, Mouse Pads, Vasos
  - **Sublimado**: Remeras, Tazas, Llaveros, Termos, Gorras, Almohadones, Cuadros, Pines
  - **DTF**: Diseños A4, Diseños A3, Diseños Personalizados, Parches
  - **Otros**: Insumos, Accesorios, Equipos

### 2. **Menú en Cascada (Header)**
- Dropdown principal muestra categorías principales
- Al hacer hover sobre una categoría, aparece submenu con subcategorías
- Click en categoría: filtra por categoría completa
- Click en subcategoría: filtra por categoría + subcategoría específica

### 3. **Formulario de Productos (Admin)**
- Select de categoría principal (obligatorio)
- Select de subcategoría (obligatorio, se habilita al seleccionar categoría)
- Las subcategorías se cargan dinámicamente según la categoría seleccionada
- Al cambiar la categoría, se resetea la subcategoría

### 4. **Filtrado en Catálogo**
- Filtrado por categoría: `/productos?categoria=Sublimado`
- Filtrado por categoría + subcategoría: `/productos?categoria=Sublimado&subcategoria=Remeras`
- Los filtros se aplican automáticamente desde la URL

## 📁 Archivos Modificados

### Modelos e Interfaces
- `core/models/producto.interface.ts`
  - Agregado campo `subcategoria?: string` a interfaz `Producto`
  - Agregadas interfaces `Subcategoria` y `CategoriaJerarquica`

### Configuración (NUEVO)
- `core/config/categorias.config.ts`
  - Definición centralizada de categorías jerárquicas
  - Funciones helper: `getCategoriasNivel1()`, `getSubcategorias()`, `existeCategoria()`, `existeSubcategoria()`

### Header
- `shared/components/header/header.ts`
  - Usa `CATEGORIAS_JERARQUICAS` en lugar de cargar desde productos
  - Agregado signal `categoriaHover` para controlar submenu
  - Método `getSubcategorias()`
  
- `shared/components/header/header.html`
  - Estructura de menu en cascada con `dropdown-item-with-submenu`
  - Submenu se muestra/oculta con `@if (categoriaHover() === categoria.nombre)`
  - Links incluyen tanto categoria como subcategoria en queryParams

- `shared/components/header/header.scss`
  - Estilos para `.dropdown-item-with-submenu`
  - Estilos para `.dropdown-submenu` (posicionado a la derecha)
  - Estilos para `.dropdown-subitem` con hover effects

### Catálogo
- `features/tienda/components/catalogo/catalogo.ts`
  - Agregado signal `subcategoriaSeleccionada`
  - Actualizado `ngOnInit` para leer `subcategoria` de queryParams
  - Actualizado método `aplicarFiltros()` para filtrar por subcategoria

### Formulario de Productos
- `features/admin/components/producto-form/producto-form.ts`
  - Agregado campo `subcategoria` a interfaz `FormData`
  - Agregado array `categorias` con categorías de nivel 1
  - Agregado signal `subcategoriasDisponibles`
  - Método `onCategoriaChange()` para cargar subcategorías
  - Actualizado `onSubmit()` para incluir subcategoria en create/update

- `features/admin/components/producto-form/producto-form.html`
  - Select de categoría con opciones dinámicas
  - Select de subcategoría (se habilita solo si hay categoría seleccionada)
  - Ambos campos marcados como requeridos

## 🗄️ Base de Datos

### Migración SQL
Archivo: `docs/migraciones/003_agregar_subcategoria.sql`

```sql
ALTER TABLE productos ADD COLUMN subcategoria TEXT;
CREATE INDEX idx_productos_subcategoria ON productos(subcategoria);
CREATE INDEX idx_productos_categoria_subcategoria ON productos(categoria, subcategoria);
```

### Pasos para aplicar:
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Copiar y ejecutar el contenido de `003_agregar_subcategoria.sql`

## 🎨 Experiencia de Usuario

### Navegación desde Header
1. Usuario hace hover sobre "Productos"
2. Aparece dropdown con categorías principales
3. Usuario hace hover sobre "Sublimado" (por ejemplo)
4. Aparece submenu a la derecha con subcategorías (Remeras, Tazas, etc.)
5. Usuario hace click en "Remeras"
6. Navega a `/productos?categoria=Sublimado&subcategoria=Remeras`
7. Catálogo muestra solo remeras sublimadas

### Creación/Edición de Producto (Admin)
1. Admin va a crear/editar producto
2. Selecciona categoría principal (ej: "Para Sublimar")
3. Se habilita select de subcategoría con opciones relevantes
4. Selecciona subcategoría (ej: "Tazas")
5. Guarda producto con ambos niveles de categorización

## 🔧 Mantenimiento

### Agregar Nueva Categoría
Editar `core/config/categorias.config.ts`:

```typescript
{
  nombre: 'Nueva Categoría',
  subcategorias: [
    { nombre: 'Subcategoría 1' },
    { nombre: 'Subcategoría 2' }
  ]
}
```

### Agregar Subcategoría a Categoría Existente
Editar el array `subcategorias` de la categoría correspondiente en `categorias.config.ts`

## ✅ Checklist de Implementación

- [x] Actualizar modelo `Producto` con campo `subcategoria`
- [x] Crear configuración centralizada de categorías jerárquicas
- [x] Implementar menú en cascada en Header
- [x] Actualizar estilos de Header para submenu
- [x] Agregar filtrado por subcategoría en Catálogo
- [x] Actualizar formulario de productos con selects
- [x] Actualizar servicio de productos (maneja subcategoria automáticamente)
- [x] Crear migración SQL
- [ ] **PENDIENTE: Ejecutar migración en Supabase**
- [ ] **PENDIENTE: Actualizar productos existentes con subcategorías**

## 🚀 Próximos Pasos

1. **Ejecutar migración SQL** en Supabase Dashboard
2. **Asignar subcategorías** a productos existentes desde panel admin
3. **Probar navegación** completa desde header
4. **Verificar filtrado** en catálogo con diferentes combinaciones
5. **(Opcional)** Agregar breadcrumbs para mostrar ruta de navegación
6. **(Opcional)** Agregar contador de productos por subcategoría en submenu

## 📝 Notas Técnicas

- Las categorías están hardcoded en `categorias.config.ts` (no se cargan dinámicamente de productos)
- El submenu usa posicionamiento absoluto (`left: 100%`) para aparecer a la derecha
- Los signals de Angular permiten reactividad automática al cambiar categoría
- El filtrado combina ambos niveles con lógica AND (categoría Y subcategoría)
- Los índices en BD mejoran el rendimiento de búsquedas por categoría/subcategoría
