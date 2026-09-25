import { redirect } from "next/navigation";
import { sesionValida } from "@/lib/guard";
import { Nav } from "@/components/Nav";

/** Segunda capa de protección (la primera es src/proxy.ts): ninguna página privada renderiza sin sesión válida. */
export default async function Privado({ children }: { children: React.ReactNode }) {
  if (!(await sesionValida())) redirect("/login");
  return (
    <>
      {children}
      <Nav />
    </>
  );
}
