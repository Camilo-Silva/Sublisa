-- Migración: Corregir políticas RLS usando tabla user_profiles
-- Fecha: 27 de noviembre de 2025
-- Descripción: Usar public.user_profiles en lugar de auth.users

-- Eliminar políticas antiguas que intentaban usar auth.users
DROP POLICY IF EXISTS "Admin puede todo en categorías" ON categorias;
DROP POLICY IF EXISTS "Admin puede todo en subcategorías" ON subcategorias;

-- Políticas para CATEGORÍAS
CREATE POLICY "Admin full access categorías" ON categorias
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.rol = 'admin'
    )
  );

-- Políticas para SUBCATEGORÍAS
CREATE POLICY "Admin full access subcategorías" ON subcategorias
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.rol = 'admin'
    )
  );

-- Verificar que existan las políticas públicas (ya deberían estar)
-- Si no existen, crearlas:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'categorias'
    AND policyname = 'Categorías públicas'
  ) THEN
    CREATE POLICY "Categorías públicas" ON categorias
      FOR SELECT USING (activo = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subcategorias'
    AND policyname = 'Subcategorías públicas'
  ) THEN
    CREATE POLICY "Subcategorías públicas" ON subcategorias
      FOR SELECT USING (activo = true);
  END IF;
END $$;
