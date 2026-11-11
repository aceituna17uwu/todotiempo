-- Esquema de Base de Datos para Catálogo Todo Tiempo
CREATE TABLE productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    estacion TEXT CHECK (estacion IN ('Primavera', 'Verano', 'Otoño', 'Invierno')),
    imagen_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO productos (nombre, descripcion, precio, estacion) VALUES
('Cortavientos Ligero', 'Ideal para los vientos de primavera', 45.00, 'Primavera'),
('Playera de Algodón', 'Fresca para el calor de verano', 15.00, 'Verano'),
('Suéter de Lana', 'Cálido para las tardes de otoño', 35.00, 'Otoño'),
('Chamarra Térmica', 'Protección total para el invierno', 85.00, 'Invierno');

-- Políticas de seguridad (RLS) para hacer el catálogo público en Supabase
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogo público visible para todos" ON productos FOR SELECT USING (true);
