import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenValido } from "@/lib/auth";

/**
 * Toda página privada exige una cookie de sesión VÁLIDA (firmada), no solo presente.
 * Las API validan por su cuenta (sesión o x-armario-secret) y las ligas /i/<token> validan el token.
 */
export function proxy(req: NextRequest) {
  // Demo pública: sin contraseña (src/lib/demo.ts).
  if (process.env.ARMARIO_DEMO === "1") return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/i/") || pathname.startsWith("/api/") || pathname === "/manifest.webmanifest" || /\.(png|jpg|jpeg|webp|svg|ico|txt)$/.test(pathname)) {
    return NextResponse.next();
  }
  if (!tokenValido(req.cookies.get(COOKIE)?.value)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
