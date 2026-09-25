/**
 * Cargas de lavado y guía de cuidado. EJEMPLO: ajústalo a tu lavadora, tu detergente y tus etiquetas.
 *
 * La app reparte cada prenda en una carga según su color:
 * - A: oscuros y colores (luminosidad baja o media).
 * - B: claros (blancos, crudos, beiges, grises claros).
 * - C: tintorería (prendas marcadas con tintoreria = true en la base).
 * Los zapatos no entran en ninguna carga.
 */

export type Carga = "A" | "B" | "C";

export type InfoCarga = { id: Carga; nombre: string; detalle: string; ajustes: string; boton?: string };

export const CARGAS: InfoCarga[] = [
  {
    id: "A",
    nombre: "Carga A · Oscuros y colores",
    detalle: "Negro, gris oscuro, marino, verdes, cafés y cualquier color. Las prendas nuevas de color vivo van solas sus primeras dos lavadas.",
    ajustes: "Agua fría · ciclo delicado · centrifugado bajo · detergente para ropa oscura · todo al revés · sin suavizante.",
  },
  {
    id: "B",
    nombre: "Carga B · Claros",
    detalle: "Blanco, crudo, hueso, beige, gris claro.",
    ajustes: "Agua fría · ciclo delicado · centrifugado bajo · detergente para ropa clara · sin cloro · todo al revés.",
  },
  {
    id: "C",
    nombre: "Tintorería · No va a lavadora",
    detalle: "Prendas con etiqueta de solo limpieza en seco.",
    ajustes: "Entre usos: gancho ancho, cepillo de ropa y una noche ventilando antes de guardar. A tintorería al llegar a su tope de usos o si se manchó.",
    boton: "Lo llevé a tintorería",
  },
];

/** Umbral de luminosidad (0 a 1) a partir del cual una prenda va a la carga de claros. */
export const UMBRAL_CLAROS = 0.6;

/** Guía que aparece al final de la pantalla de Lavado. Un punto por paso. */
export const GUIA_LAVADO: { titulo: string; texto: string }[] = [
  { titulo: "Una carga a la vez", texto: "De 3 a 7 piezas, separadas por color y no por tipo. Cierres y botones cerrados, bolsillos vacíos. Toallas y sábanas nunca con la ropa." },
  { titulo: "Lavadora", texto: "Ciclo delicado, agua fría, nivel de agua bajo y centrifugado bajo. Casi todas las etiquetas de ropa de algodón piden centrifugado corto." },
  { titulo: "Detergente", texto: "Poco: un cuarto de tapa alcanza para una carga chica. El exceso deja la ropa rígida y opaca." },
  { titulo: "Secado", texto: "Con aire siempre que puedas: playeras extendidas, pantalones colgados de la pretina. Si usas secadora, temperatura baja y saca la ropa apenas húmeda." },
  { titulo: "Si huele a humedad", texto: "Otro lavado en frío con media taza de vinagre blanco en el enjuague." },
  { titulo: "Guardado", texto: "Playeras dobladas, capas en gancho ancho, pantalones colgados de la pretina o doblados en tres." },
];
