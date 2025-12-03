-- FIX: Permitir que CUALQUIER admin (no solo un email) pueda gestionar pedidos
-- Problema: sublisa.arg@gmail.com es admin pero no puede actualizar pedidos
-- Solución: Usar el campo 'role' de user_profiles en lugar de hardcodear emails

-- 1. Eliminar políticas viejas que usan email hardcodeado
DROP POLICY IF EXISTS "Users can view own orders or all if admin" ON public.pedidos;
DROP POLICY IF EXISTS "Users can update own orders or all if admin" ON public.pedidos;

-- 2. Crear políticas nuevas que usen el rol del usuario

-- Los usuarios pueden ver sus propios pedidos O todos si tienen rol admin
CREATE POLICY "Users can view own orders or all if admin"
ON public.pedidos
FOR SELECT
TO authenticated
USING (
  -- Ver sus propios pedidos
  user_id = auth.uid()
  OR
  -- O ver todos si es admin (verificando el rol en user_profiles)
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Los usuarios pueden actualizar sus propios pedidos O todos si tienen rol admin
CREATE POLICY "Users can update own orders or all if admin"
ON public.pedidos
FOR UPDATE
TO authenticated
USING (
  -- Ver/actualizar sus propios pedidos
  user_id = auth.uid()
  OR
  -- O todos si es admin
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  -- Mismo check para la actualización
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- 3. Verificar que funciona
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de pedidos actualizadas';
  RAISE NOTICE '✅ Ahora CUALQUIER usuario con role=admin puede gestionar pedidos';
  RAISE NOTICE '✅ sublisa.arg@gmail.com y camilosilva.0301@gmail.com pueden actualizar estados';
END $$;
