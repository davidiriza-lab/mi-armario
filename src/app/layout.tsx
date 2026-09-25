import type { Metadata, Viewport } from "next";
import { Fraunces, Albert_Sans } from "next/font/google";
import "./globals.css";
import { APP } from "@/contenido/config";

const fraunces = Fraunces({ subsets: ["latin"], weight: "variable", axes: ["SOFT", "WONK", "opsz"], variable: "--font-fraunces", display: "swap" });
const albert = Albert_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-albert", display: "swap" });

export const metadata: Metadata = {
  title: { default: APP.nombre, template: `%s · ${APP.nombre}` },
  description: "Qué ponerte cada día según lo que está limpio.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP.nombre },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${albert.variable}`}>
      <body>
        <a href="#contenido" className="skip">Saltar al contenido</a>
        <main id="contenido">{children}</main>
      </body>
    </html>
  );
}
