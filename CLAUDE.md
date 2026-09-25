# Mi armario · reglas para Claude

App personal de armario: qué ponerse cada día según lo que está limpio, lavado por cargas, lista de compras y una asesora con la API de Claude. Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase.

## Antes de escribir código

- Este Next.js es la versión 16: `middleware` ahora se llama `proxy` (`src/proxy.ts`) y corre en Node. Si dudas de una API, lee la guía en `node_modules/next/dist/docs/`.
- Lo que personaliza la app vive en `src/contenido/`. Si la persona pide cambiar reglas, textos, nombres o la guía de lavado, toca solo esos archivos.

## Seguridad (no negociable)

- La base de datos solo se toca desde el servidor con `db()` (`src/lib/db.ts`), que usa `SUPABASE_SECRET_KEY`. Nunca importes `db.ts`, `armario.ts`, `compras.ts`, `enlaces.ts` ni `asesora.ts` desde un componente `"use client"`; para lógica compartida usa `src/lib/reglas.ts` o `src/lib/compras-orden.ts`, que no tocan la base.
- Las tablas `armario_*` tienen RLS activado y ninguna política. No crees políticas para `anon` ni `authenticated`.
- Toda API nueva empieza con `if (!(await autorizado(req))) return noAutorizado();`. Toda página nueva va dentro de `src/app/(privado)/`, cuyo layout exige sesión válida.
- Ningún secreto va en el código ni en archivos versionados. Van en `.env.local` y en las variables de Vercel. Nunca muestres sus valores; refiérete a ellos por nombre.
- `datos/` (salvo `ejemplo.json`), `STATE.md` y `SESIONES.md` no se versionan: ya están en `.gitignore`.

## Código

- TypeScript estricto, sin `any`. Tipos de la API de Claude desde el SDK (`Anthropic.Beta.*`).
- Escrituras siempre por API routes (`src/app/api/`), nunca con server actions.
- Cambios de esquema: agrega el SQL a `supabase/schema.sql` con `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` para que se pueda volver a correr.
- Antes de dar algo por terminado: `npm run typecheck`, `npm run lint`, `npm run probar` y `npm run build`.

## Datos

- Prendas: `id` es un slug legible (`playera-negra`). Tipos: `top`, `capa`, `pant`, `zapato`. Color en hex (`#1c1c1c`).
- Combinaciones: `id` numerado (`01`, `02`) y `prendas` es la lista de ids.
- Para cargar o actualizar en bloque: `datos/<archivo>.json` con el formato de `datos/ejemplo.json` y `npm run cargar -- datos/<archivo>.json`. Es idempotente para prendas y combinaciones.
- Borrar datos de la base es irreversible: pide permiso explícito antes.

## Modo demo

- `ARMARIO_DEMO=1` (`src/lib/demo.ts`) deja la app ABIERTA sin contraseña y BORRA todas las tablas una vez al día para recargar `datos/ejemplo.json` con historial de muestra. Nunca lo actives en una versión con datos reales.

## La asesora

- `src/lib/asesora.ts`: bucle manual de herramientas con `claude-opus-5` (cambiable con `ASESORA_MODELO`), esfuerzo `medium`, `web_fetch_20260209` y respaldo automático ante negativas (`fallbacks: "default"`). Maneja `pause_turn` reenviando el turno y `refusal` antes de leer el contenido.
- Es de solo lectura: sus herramientas no escriben en la base. Si se le agregan herramientas que escriben, deben pedir confirmación explícita.
