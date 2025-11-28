-- Migración TEMPORAL: Deshabilitar RLS para desarrollo
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN ⚠️

-- Deshabilitar RLS temporalmente
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias DISABLE ROW LEVEL SECURITY;

-- Para reactivar después (ejecutar esto cuando tengas las políticas correctas):
-- ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
