-- Mi armario · esquema completo. Pégalo una vez en Supabase → SQL Editor → Run.
-- Seguridad: todas las tablas tienen RLS activado y NINGUNA política. Así, la llave pública
-- del proyecto no puede leer ni escribir nada; solo el servidor de la app, con la llave secreta.
-- Se puede correr dos veces sin romper nada (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.armario_prendas (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('top', 'capa', 'pant', 'zapato')),
  usos_max integer NOT NULL DEFAULT 1 CHECK (usos_max BETWEEN 1 AND 60),
  color text CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$'),
  tienda text,
  ref text,
  talla text,
  composicion text,
  cuidado text,
  tintoreria boolean NOT NULL DEFAULT false,
  foto text,
  activa boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.armario_outfits (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  prendas text[] NOT NULL CHECK (cardinality(prendas) >= 2),
  foto text,
  collage text,
  ocasion text,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado timestamptz NOT NULL DEFAULT now()
);

-- Un registro por día: qué outfit te pusiste (o programaste) y qué prendas llevaba.
CREATE TABLE IF NOT EXISTS public.armario_usos (
  id bigserial PRIMARY KEY,
  fecha date NOT NULL,
  outfit_id text REFERENCES public.armario_outfits(id),
  prendas text[] NOT NULL,
  creado timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS armario_usos_fecha_idx ON public.armario_usos (fecha);

-- Cada carga lavada: esas prendas quedan limpias hasta el uso hasta_uso_id.
CREATE TABLE IF NOT EXISTS public.armario_lavados (
  id bigserial PRIMARY KEY,
  fecha date NOT NULL,
  carga text NOT NULL CHECK (carga IN ('A', 'B', 'C')),
  prendas text[] NOT NULL,
  hasta_uso_id bigint NOT NULL DEFAULT 0,
  creado timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.armario_compras (
  id bigserial PRIMARY KEY,
  tienda text NOT NULL,
  nombre text NOT NULL,
  ref text,
  precio numeric,
  talla text,
  nota text,
  nivel smallint NOT NULL DEFAULT 2 CHECK (nivel BETWEEN 1 AND 3),
  orden integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'comprada', 'descartada')),
  comprada_en timestamptz,
  url text,
  imagen text,
  color_hex text,
  color_nombre text,
  creado timestamptz NOT NULL DEFAULT now()
);

-- Ligas de solo lectura para compartir Vestir sin contraseña.
CREATE TABLE IF NOT EXISTS public.armario_enlaces (
  id bigserial PRIMARY KEY,
  token text NOT NULL UNIQUE,
  nota text,
  activo boolean NOT NULL DEFAULT true,
  usos integer NOT NULL DEFAULT 0,
  ultimo_uso timestamptz,
  creado timestamptz NOT NULL DEFAULT now()
);

-- Conversación con la asesora (un solo hilo).
CREATE TABLE IF NOT EXISTS public.armario_mensajes (
  id bigserial PRIMARY KEY,
  rol text NOT NULL CHECK (rol IN ('user', 'assistant')),
  texto text NOT NULL,
  fotos integer NOT NULL DEFAULT 0,
  creado timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.armario_prendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armario_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armario_usos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armario_lavados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armario_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armario_enlaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armario_mensajes ENABLE ROW LEVEL SECURITY;
