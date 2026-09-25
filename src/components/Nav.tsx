"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASESORA } from "@/contenido/asesora";

const TABS = [
  { href: "/", label: "Vestir", icon: IconVestir },
  { href: "/lavado", label: "Lavado", icon: IconLavado },
  { href: "/compras", label: "Compras", icon: IconCompras },
  { href: "/asesora", label: ASESORA.nombre, icon: IconAsesora },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav-bar" aria-label="Secciones">
      {TABS.map((t) => {
        const activo = t.href === "/" ? path === "/" : path.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={activo ? "activo" : undefined} aria-current={activo ? "page" : undefined}>
            <Icon />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
function IconVestir() {
  return (<svg {...svg}><path d="m8 4 4 2 4-2 4 4-3 2v10H7V10L4 8z" /></svg>);
}
function IconLavado() {
  return (<svg {...svg}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4.5" /><path d="M8 6.5h.01M11 6.5h.01" /></svg>);
}
function IconCompras() {
  return (<svg {...svg}><path d="M6 8h12l-1 12H7z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>);
}
function IconAsesora() {
  return (<svg {...svg}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></svg>);
}
