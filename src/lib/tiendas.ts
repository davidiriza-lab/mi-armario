/**
 * Ayudas para leer fichas de tienda (opcional). La asesora también puede abrir cualquier URL con web_fetch.
 * EJEMPLO para México: Zara y Pull&Bear construyen la URL desde la referencia de la etiqueta ("1063/320").
 * Agrega aquí las tiendas donde compras.
 */
export function urlFicha(tienda: string, referencia: string | null): string | null {
  if (!referencia) return null;
  const partes = referencia.replace(/\s/g, "").split("/");
  const ok = partes.length >= 2 && /^\d{4}$/.test(partes[0]) && /^\d{3}$/.test(partes[1]);
  if (!ok) return null;
  if (tienda === "zara") return `https://www.zara.com/mx/es/x-p0${partes[0]}${partes[1]}.html`;
  if (tienda === "pullandbear") return `https://www.pullandbear.com/mx/x-l0${partes[0]}${partes[1]}`;
  return null;
}
