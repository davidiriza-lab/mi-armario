# Instalar tu armario

Cada paso dice quién lo hace:

- **TÚ**: algo que solo puedes hacer tú, como crear una cuenta o copiar una llave.
- **CLAUDE**: lo pides en Claude Code con el prompt que viene abajo, tal cual.

Abre Claude Code dentro de la carpeta del proyecto cuando un paso lo pida.

---

## 1. Tu copia del proyecto

**TÚ.** En GitHub, entra a este repositorio y presiona **Use this template → Create a new repository**. Ponle nombre y déjala **privada**: ahí va a vivir tu armario.

**CLAUDE.** Abre Claude Code en la carpeta donde guardas tus proyectos y pega:

```
Clona mi repositorio <tu-usuario>/<nombre-del-repo> en una carpeta nueva, entra a ella,
corre npm install y dime cuando termine. Luego lee README.md, INSTALAR.md y CLAUDE.md
para tener el contexto del proyecto.
```

## 2. La base de datos

**TÚ.** Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo. Elige la región más cercana a ti. Guarda la contraseña de la base en tu gestor de contraseñas; la app no la necesita.

**TÚ.** En tu proyecto de Supabase entra a **SQL Editor**, abre el archivo `supabase/schema.sql` de este repo, copia todo su contenido, pégalo y presiona **Run**. Crea las tablas con el acceso público bloqueado.

**TÚ.** Entra a **Project Settings → API Keys** y deja la página abierta. Vas a necesitar la URL del proyecto y la llave **secreta** (empieza con `sb_secret_`).

## 3. Tus llaves

**CLAUDE.**

```
Crea .env.local a partir de .env.example. Genera tú ARMARIO_SESSION_SECRET con
openssl rand -hex 32. Luego pregúntame, una por una, SUPABASE_URL, SUPABASE_SECRET_KEY,
SUPABASE_PUBLISHABLE_KEY y la contraseña que quiero para entrar a la app (mínimo 12
caracteres). No me muestres ningún valor de vuelta. Al final corre npm run diagnostico
y explícame en palabras simples lo que falte.
```

**TÚ.** Pega cada valor cuando Claude lo pida.

## 4. Verla funcionar con el ejemplo

**CLAUDE.**

```
Carga el armario de ejemplo con npm run cargar -- datos/ejemplo.json, arranca la app con
npm run dev y dime la dirección para abrirla.
```

**TÚ.** Abre la dirección, entra con tu contraseña y recorre Vestir, Lavado y Compras. Prueba programar un outfit para mañana y fíjate cómo cambia lo disponible.

## 5. Tu armario real

**CLAUDE.** Esta es la parte divertida. Ten la ropa a la mano o fotos de las etiquetas.

```
Quiero cargar mi armario real. Entrevístame prenda por prenda: nombre, tipo (arriba, capa,
pantalón o zapatos), color (dame opciones de color hex y me muestras cuál se parece), tienda,
talla y composición si la sé. Si te mando la foto de una etiqueta, sácale los datos tú.
Después propónme combinaciones que funcionen entre sí y ajústalas conmigo. Guarda todo en
datos/mi-armario.json con el mismo formato que datos/ejemplo.json. Antes de cargarlo, borra
los datos del ejemplo de la base (pídeme permiso) y luego corre
npm run cargar -- datos/mi-armario.json.
```

Para agregar una prenda suelta después, usa la pantalla **Armario** desde el celular.

## 6. Hazla tuya

**CLAUDE.**

```
Ayúdame a personalizar src/contenido/. Pregúntame cómo quiero que se llame la app, mi zona
horaria, si cambio alguna regla de uso (cuántos usos aguanta cada tipo de prenda y cuántos
días seguidos) y cómo lavo mi ropa (lavadora, detergente, si uso secadora) para reescribir
la guía de lavado. Cambia solo archivos de src/contenido/ y corre npm run build al final.
```

## 7. En tu celular

**TÚ.** Crea una cuenta en [vercel.com](https://vercel.com) con tu GitHub. Presiona **Add New → Project**, elige tu repositorio y, antes de desplegar, abre **Environment Variables** y agrega las mismas variables de tu `.env.local` (Claude te las puede listar sin valores). Presiona **Deploy**.

**TÚ.** Abre la dirección que te da Vercel en el celular. En iPhone: Compartir → **Agregar a inicio**. En Android: menú → **Instalar app**. Queda como una app más.

Cada vez que cambies algo y lo subas a GitHub, Vercel la actualiza sola.

## 8. La asesora (opcional)

La asesora usa la API de Claude. Se paga por uso: una conversación normal cuesta centavos de dólar, y una con fotos o que abre fichas de tiendas cuesta más. Pon un límite de gasto mensual en tu cuenta de Anthropic.

**TÚ.** Crea una llave en [console.anthropic.com](https://console.anthropic.com) → **API Keys**, agrega saldo y pon un límite mensual en **Limits**.

**CLAUDE.**

```
Agrega ANTHROPIC_API_KEY a .env.local (pídemela, no me la muestres). Luego entrevístame
para reescribir las reglas de estilo de mi asesora en src/contenido/asesora.ts: mi cuerpo,
mi clima, qué colores me quedan, qué nunca uso, tallas por tienda y cómo me gusta vestir.
Ponle el nombre que yo elija. Numera las reglas. Corre npm run build al final.
```

**TÚ.** Agrega `ANTHROPIC_API_KEY` también en Vercel → tu proyecto → **Settings → Environment Variables**, y vuelve a desplegar.

## 9. Hablarle desde Telegram (opcional)

La asesora acepta mensajes de otras apps. Si tienes un bot de Telegram, puede reenviarle tus preguntas y fotos.

**CLAUDE.**

```
Genera ARMARIO_API_SECRET con openssl rand -hex 32 y agrégalo a .env.local. Luego
explícame cómo hace un bot para hablar con la asesora: POST a /api/asesora con
multipart/form-data (campos texto y fotos) y el header x-armario-secret, y la respuesta
viene en mensaje.texto. Si quiero, ayúdame a construir el bot.
```

---

## Si algo no funciona

Corre `npm run diagnostico`. Revisa las variables, que existan las tablas y que la llave pública no pueda leer tus datos, y te dice qué falta sin mostrar ningún secreto.

**CLAUDE.**

```
Corre npm run diagnostico y npm run build. Si algo falla, explícame qué es en palabras
simples y arréglalo. No me muestres ningún valor de .env.local.
```
