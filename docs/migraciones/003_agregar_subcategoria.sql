-- Migración: Agregar columna subcategoria a la tabla productos
-- Fecha: 27 de noviembre de 2025
-- Descripción: Permite clasificar productos en dos niveles (categoría y subcategoría)

-- Agregar columna subcategoria
ALTER TABLE productos
ADD COLUMN subcategoria TEXT;

-- Comentar la columna
COMMENT ON COLUMN productos.subcategoria IS 'Subcategoría del producto dentro de su categoría principal';

-- Crear índice para mejorar el rendimiento de búsquedas por subcategoría
CREATE INDEX idx_productos_subcategoria ON productos(subcategoria);

-- Crear índice compuesto para búsquedas por categoría + subcategoría
CREATE INDEX idx_productos_categoria_subcategoria ON productos(categoria, subcategoria);

-- Verificar estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;
