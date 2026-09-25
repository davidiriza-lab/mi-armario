import { redirect } from "next/navigation";
import { sesionValida } from "@/lib/guard";
import { Nav } from "@/components/Nav";
import { esDemo } from "@/lib/demo";

/** Segunda capa de protección (la primera es src/proxy.ts): ninguna página privada renderiza sin sesión válida. */
export default async function Privado({ children }: { children: React.ReactNode }) {
  if (!(await sesionValida())) redirect("/login");
  return (
    <>
      {esDemo && (
        <p className="mini" style={{ margin: 0, padding: ".55rem 1rem", textAlign: "center", background: "var(--salvia-suave)", borderBottom: "1px solid var(--linea)" }}>
          Demo pública y abierta: cualquiera puede mover cosas y todo se reinicia cada día.{" "}
          <a href="https://github.com/davidiriza-lab/mi-armario" style={{ textDecoration: "underline", fontWeight: 600 }}>Arma la tuya</a>
        </p>
      )}
      {children}
      <Nav />
    </>
  );
}
