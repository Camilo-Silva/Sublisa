# Migración de Categorías: De Hardcoded a Base de Datos

## 📅 Fecha: 27 de noviembre de 2025

## 🎯 Objetivo
Migrar el sistema de categorías y subcategorías desde una configuración hardcodeada (`categorias.config.ts`) a un sistema dinámico basado en base de datos PostgreSQL/Supabase.

## ✅ Cambios Realizados

### 1. **Base de Datos**
- ✅ Creadas tablas `categorias` y `subcategorias` con relación FK
- ✅ Implementadas políticas RLS para seguridad
- ✅ Migrados datos iniciales desde configuración hardcodeada
- ✅ Agregados índices para optimización de consultas
- ✅ Implementados triggers para `updated_at` automático

**Archivos:**
- `docs/migraciones/004_crear_tablas_categorias.sql`
- `docs/migraciones/005_fix_rls_policies_con_user_profiles.sql`

### 2. **Models e Interfaces**
- ✅ Creadas interfaces TypeScript en `core/models/categoria.interface.ts`:
  - `Categoria`
  - `Subcategoria`
  - `CategoriaConSubcategorias`

**Reemplaza a:** `CategoriaJerarquica` en `producto.interface.ts`

### 3. **Servicios**
- ✅ Creado `CategoriasService` en `core/services/categorias.service.ts`
  - Métodos CRUD completos para categorías y subcategorías
  - Métodos públicos (activo=true) y admin (todos)
  - Soft delete y hard delete
  - Utility methods para obtener nombres y estructuras jerárquicas

**Reemplaza a:** Funciones helper en `categorias.config.ts`

### 4. **Componentes Admin**
- ✅ Creado `categorias-admin` component con ABM completo
  - CRUD de categorías
  - CRUD de subcategorías
  - Interfaz con modales
  - Validaciones
  - Confirmaciones para eliminación

**Archivos:**
- `features/admin/components/categorias-admin/categorias-admin.ts`
- `features/admin/components/categorias-admin/categorias-admin.html`
- `features/admin/components/categorias-admin/categorias-admin.scss`

### 5. **Componentes Actualizados**

#### **Header Component** (`shared/components/header/header.ts`)
**Antes:**
```typescript
import { CATEGORIAS_JERARQUICAS, getSubcategorias } from '../../../core/config/categorias.config';
import { CategoriaJerarquica } from '../../../core/models/producto.interface';

categorias = signal<CategoriaJerarquica[]>([]);

async cargarCategorias() {
  this.categorias.set(CATEGORIAS_JERARQUICAS);
}
```

**Después:**
```typescript
import { CategoriasService } from '../../../core/services/categorias.service';
import { CategoriaConSubcategorias } from '../../../core/models/categoria.interface';

categorias = signal<CategoriaConSubcategorias[]>([]);

async cargarCategorias() {
  const categorias = await this.categoriasService.getCategoriasConSubcategorias();
  this.categorias.set(categorias);
}
```

#### **Catálogo Component** (`features/tienda/components/catalogo/catalogo.ts`)
**Antes:**
```typescript
import { getSubcategorias } from '../../../../core/config/categorias.config';

subcategoriasDisponibles = computed(() => {
  const categoria = this.categoriaSeleccionada();
  if (categoria === 'TODAS') return [];
  return getSubcategorias(categoria);
});
```

**Después:**
```typescript
import { CategoriasService } from '../../../../core/services/categorias.service';

subcategoriasMap = signal<Map<string, string[]>>(new Map());

subcategoriasDisponibles = computed(() => {
  const categoria = this.categoriaSeleccionada();
  if (categoria === 'TODAS') return [];
  return this.subcategoriasMap().get(categoria) || [];
});

async cargarCategorias() {
  const categorias = await this.categoriasService.getCategoriasConSubcategorias();
  const map = new Map<string, string[]>();
  categorias.forEach(cat => {
    map.set(cat.nombre, cat.subcategorias.map(sub => sub.nombre));
  });
  this.subcategoriasMap.set(map);
}
```

#### **ProductoForm Component** (`features/admin/components/producto-form/producto-form.ts`)
**Antes:**
```typescript
import { getCategoriasNivel1, getSubcategorias } from '../../../../core/config/categorias.config';

categorias = getCategoriasNivel1();

onCategoriaChange(categoria: string) {
  const subcategorias = getSubcategorias(categoria);
  this.subcategoriasDisponibles.set(subcategorias);
}
```

**Después:**
```typescript
import { CategoriasService } from '../../../../core/services/categorias.service';

categorias = signal<string[]>([]);
subcategoriasMap = signal<Map<string, string[]>>(new Map());

async cargarCategorias() {
  const categorias = await this.categoriasService.getCategoriasConSubcategorias();
  this.categorias.set(categorias.map(c => c.nombre));
  
  const map = new Map<string, string[]>();
  categorias.forEach(cat => {
    map.set(cat.nombre, cat.subcategorias.map(sub => sub.nombre));
  });
  this.subcategoriasMap.set(map);
}

onCategoriaChange(categoria: string) {
  const subcategorias = this.subcategoriasMap().get(categoria) || [];
  this.subcategoriasDisponibles.set(subcategorias);
}
```

### 6. **Archivos Eliminados**
- ❌ `src/app/core/config/categorias.config.ts` (configuración hardcodeada)
- ❌ Exportación de `CategoriaJerarquica` (ahora se usa `CategoriaConSubcategorias`)

### 7. **Routing**
- ✅ Agregada ruta `/admin/categorias` en `app.routes.ts`
- ✅ Agregado link en dashboard admin

## 🔄 Flujo de Datos

### Antes (Hardcoded)
```
categorias.config.ts (const CATEGORIAS_JERARQUICAS)
    ↓
Components (import directo)
    ↓
UI (datos estáticos)
```

### Después (Base de Datos)
```
PostgreSQL/Supabase (tablas categorias + subcategorias)
    ↓
CategoriasService (CRUD operations)
    ↓
Components (async load con signals)
    ↓
UI (datos dinámicos)
```

## 🎨 Beneficios

1. **Gestión Dinámica:** Admins pueden agregar/editar/eliminar categorías sin código
2. **Escalabilidad:** Fácil agregar nuevas categorías según crecimiento del negocio
3. **Integridad:** Constraints FK aseguran relaciones correctas
4. **Seguridad:** RLS policies controlan acceso según rol
5. **Auditoría:** Timestamps automáticos (`created_at`, `updated_at`)
6. **Performance:** Índices optimizan consultas frecuentes
7. **Soft Delete:** Mantiene histórico sin perder datos

## 🚀 Cómo Usar

### Para Admins (UI)
1. Ir a `/admin/categorias`
2. Crear nueva categoría con botón "Nueva Categoría"
3. Agregar subcategorías con botón ➕
4. Editar/eliminar con botones ✏️/🗑️
5. Toggle activo/inactivo para visibilidad pública

### Para Desarrolladores (Código)
```typescript
// Obtener todas las categorías con subcategorías
const categorias = await categoriasService.getCategoriasConSubcategorias();

// Obtener solo nombres de categorías
const nombres = await categoriasService.getNombresCategorias();

// Obtener subcategorías de una categoría
const subs = await categoriasService.getNombresSubcategorias('Para Sublimar');

// Crear nueva categoría
await categoriasService.createCategoria({
  nombre: 'Vinilo Textil',
  descripcion: 'Productos de vinilo',
  orden: 5
});

// Agregar subcategoría
await categoriasService.createSubcategoria({
  categoria_id: 'uuid-de-categoria',
  nombre: 'Vinilo Blanco',
  orden: 1
});
```

## 📝 Notas Importantes

1. **RLS Policies:** Verificar que el usuario admin tenga `rol='admin'` en `user_profiles`
2. **Cache:** Los componentes cargan categorías en `ngOnInit()`, considerar cache si necesario
3. **Fallback:** Si la base de datos falla, mostrar mensaje de error apropiado
4. **Migración:** Los datos iniciales ya fueron migrados en `004_crear_tablas_categorias.sql`

## 🔍 Testing

### Verificar Migración
```sql
-- Ver categorías
SELECT * FROM categorias ORDER BY orden;

-- Ver subcategorías por categoría
SELECT c.nombre as categoria, s.nombre as subcategoria, s.orden
FROM categorias c
JOIN subcategorias s ON c.id = s.categoria_id
ORDER BY c.orden, s.orden;

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename IN ('categorias', 'subcategorias');
```

### Probar CRUD
1. Crear categoría "Test"
2. Agregar subcategoría "Test Sub"
3. Editar descripción
4. Toggle activo/inactivo
5. Eliminar subcategoría
6. Eliminar categoría

## 🐛 Troubleshooting

### Error 403 Forbidden
- **Causa:** Políticas RLS bloqueando acceso
- **Solución:** Ejecutar `005_fix_rls_policies_con_user_profiles.sql`

### Categorías no aparecen en dropdown
- **Causa:** No se ejecutó `cargarCategorias()` en `ngOnInit()`
- **Solución:** Verificar que cada componente llame al método

### Subcategorías no se filtran correctamente
- **Causa:** `subcategoriasMap` no se inicializó
- **Solución:** Verificar que se construye el Map en `cargarCategorias()`

## 📚 Referencias

- [Documentación RLS Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular Signals](https://angular.dev/guide/signals)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
