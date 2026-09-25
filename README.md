# Mi armario

Una app para el celular que responde una pregunta todas las mañanas: **¿qué me pongo hoy?**

Registras tu ropa y las combinaciones que te gustan. La app sabe qué te pusiste cada día y, con reglas simples de lavado, te muestra solo lo que está limpio. También te dice qué toca lavar, lleva tu lista de compras y trae una asesora de imagen con IA que conoce tu armario.

La construyó [David Iriza](https://www.davidiriza.com) para su propio uso. Este repositorio es la versión limpia, sin sus datos, para que armes la tuya.

**Pruébala:** [mi-armario-demo.vercel.app](https://mi-armario-demo.vercel.app). No pide contraseña. Es pública: cualquiera puede mover cosas y todo se reinicia cada día. La asesora está apagada en la demo.

## Qué hace

- **Vestir.** Tus combinaciones con prendas limpias para hoy, y una tira de días para programar la semana o corregir lo que usaste ayer. Lo que programas también cuenta: si el viernes te toca el pantalón negro, el jueves no te lo ofrece.
- **Lavado.** Qué está sucio, separado en cargas por color, con un botón para registrar cada carga lavada. Avisa cuando una prenda ya tiene muchas lavadas encima.
- **Compras.** Tu lista por tienda y prioridad, con el color exacto a comprar.
- **Asesora.** Un chat con Claude que conoce tu inventario, tus combinaciones, lo que está limpio cada día y tus reglas de estilo. Le mandas foto de una prenda en la tienda y te dice si combina con lo que tienes.
- **Armario.** Dar de alta prendas y armar combinaciones desde el celular.
- **Compartir.** Ligas de solo lectura para que alguien vea tus combinaciones sin tu contraseña.

## Reglas de uso (las puedes cambiar)

| Prenda | Usos entre lavadas | Días seguidos máximo |
|---|---|---|
| Playera o camisa | 1 | sin límite |
| Pantalón | 2 | 1 |
| Capa (chaqueta, sobrecamisa, blazer) | 3 | 2 |
| Zapatos | 30 | sin límite |

Se cambian en `src/contenido/config.ts`.

## Cómo armar la tuya

Sigue [INSTALAR.md](INSTALAR.md). Está pensado para hacerlo con [Claude Code](https://claude.com/claude-code): cada paso dice qué haces tú y qué le pides a Claude, con el prompt listo para copiar. Toma unos 30 minutos.

Necesitas:

- Una cuenta de **GitHub** (gratis).
- Una cuenta de **Supabase** (gratis) para guardar tu armario.
- Una cuenta de **Vercel** (gratis) para tenerla en el celular.
- Opcional: una llave de la **API de Claude** para la asesora. Se paga por uso.

## Lo que es tuyo y lo que es de la app

Todo lo que hace la app "tuya" vive en `src/contenido/`:

- `config.ts`: nombre, zona horaria, reglas de uso, orden de tiendas.
- `lavado.ts`: cargas de lavado y guía de cuidado.
- `asesora.ts`: nombre de tu asesora y tus reglas de estilo.

Tu armario real va en `datos/mi-armario.json`, que no se sube a GitHub.

## Seguridad

- La app pide contraseña. La sesión va firmada y se valida en cada página.
- Tus datos viven en tu Supabase con acceso público bloqueado: solo el servidor de la app los lee, con una llave secreta que nunca llega al navegador.
- Ningún secreto va en el código. Todos van en `.env.local` en tu computadora y en las variables de entorno de Vercel.

## Licencia

MIT. Úsala, cámbiala y compártela.
