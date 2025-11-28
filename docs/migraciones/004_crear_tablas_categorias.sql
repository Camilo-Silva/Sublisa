-- Migración: Crear tablas de categorías y subcategorías
-- Fecha: 27 de noviembre de 2025
-- Descripción: Sistema de gestión de categorías jerárquicas

-- Tabla de categorías principales
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  icono TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de subcategorías
CREATE TABLE subcategorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria_id, nombre)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_categorias_activo ON categorias(activo);
CREATE INDEX idx_categorias_orden ON categorias(orden);
CREATE INDEX idx_subcategorias_categoria_id ON subcategorias(categoria_id);
CREATE INDEX idx_subcategorias_activo ON subcategorias(activo);
CREATE INDEX idx_subcategorias_orden ON subcategorias(orden);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategorias_updated_at BEFORE UPDATE ON subcategorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos iniciales (migrar desde categorias.config.ts)
INSERT INTO categorias (nombre, descripcion, orden) VALUES
  ('Para Sublimar', 'Productos en blanco listos para personalizar', 1),
  ('Sublimado', 'Productos ya personalizados y listos para usar', 2),
  ('DTF', 'Diseños de transferencia directa a tela', 3),
  ('Otros', 'Insumos, accesorios y equipos', 4);

-- Insertar subcategorías para "Para Sublimar"
INSERT INTO subcategorias (categoria_id, nombre, orden)
SELECT id, 'Remeras', 1 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Tazas', 2 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Llaveros', 3 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Termos', 4 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Gorras', 5 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Almohadones', 6 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Azulejos', 7 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Individuales', 8 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Mouse Pads', 9 FROM categorias WHERE nombre = 'Para Sublimar'
UNION ALL
SELECT id, 'Vasos', 10 FROM categorias WHERE nombre = 'Para Sublimar';

-- Insertar subcategorías para "Sublimado"
INSERT INTO subcategorias (categoria_id, nombre, orden)
SELECT id, 'Remeras', 1 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Tazas', 2 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Llaveros', 3 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Termos', 4 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Gorras', 5 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Almohadones', 6 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Cuadros', 7 FROM categorias WHERE nombre = 'Sublimado'
UNION ALL
SELECT id, 'Pines', 8 FROM categorias WHERE nombre = 'Sublimado';

-- Insertar subcategorías para "DTF"
INSERT INTO subcategorias (categoria_id, nombre, orden)
SELECT id, 'Diseños A4', 1 FROM categorias WHERE nombre = 'DTF'
UNION ALL
SELECT id, 'Diseños A3', 2 FROM categorias WHERE nombre = 'DTF'
UNION ALL
SELECT id, 'Diseños Personalizados', 3 FROM categorias WHERE nombre = 'DTF'
UNION ALL
SELECT id, 'Parches', 4 FROM categorias WHERE nombre = 'DTF';

-- Insertar subcategorías para "Otros"
INSERT INTO subcategorias (categoria_id, nombre, orden)
SELECT id, 'Insumos', 1 FROM categorias WHERE nombre = 'Otros'
UNION ALL
SELECT id, 'Accesorios', 2 FROM categorias WHERE nombre = 'Otros'
UNION ALL
SELECT id, 'Equipos', 3 FROM categorias WHERE nombre = 'Otros';

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer categorías activas
CREATE POLICY "Categorías públicas" ON categorias
  FOR SELECT USING (activo = true);

CREATE POLICY "Subcategorías públicas" ON subcategorias
  FOR SELECT USING (activo = true);

-- Solo admins pueden modificar (esto se configura según tu auth)
-- Ajustar según tu sistema de autenticación
CREATE POLICY "Admin puede todo en categorías" ON categorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'rol' = 'admin'
    )
  );

CREATE POLICY "Admin puede todo en subcategorías" ON subcategorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'rol' = 'admin'
    )
  );
