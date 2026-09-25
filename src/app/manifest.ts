import type { MetadataRoute } from "next";
import { APP } from "@/contenido/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP.nombre,
    short_name: APP.nombre,
    description: "Qué ponerte cada día según lo que está limpio.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
