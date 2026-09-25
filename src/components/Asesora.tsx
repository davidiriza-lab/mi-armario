"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Mensaje } from "@/lib/asesora";

/** Chat con la asesora: texto y hasta 4 fotos (una prenda en tienda, una etiqueta, un outfit puesto). */
export function Asesora({ inicial, nombre, encendida }: { inicial: Mensaje[]; nombre: string; encendida: boolean }) {
  const [mensajes, setMensajes] = useState(inicial);
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, busy]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (busy || (!texto.trim() && fotos.length === 0)) return;
    setBusy(true);
    setErr(null);
    const form = new FormData();
    form.append("texto", texto.trim());
    for (const f of fotos) form.append("fotos", f);
    const provisional: Mensaje = { id: -Date.now(), rol: "user", texto: texto.trim() || "(foto)", fotos: fotos.length, creado: new Date().toISOString() };
    setMensajes((m) => [...m, provisional]);
    setTexto("");
    setFotos([]);
    if (archivo.current) archivo.current.value = "";
    const r = await fetch("/api/asesora", { method: "POST", body: form });
    const j = (await r.json().catch(() => ({}))) as { mensaje?: Mensaje; error?: string };
    setBusy(false);
    if (!r.ok || !j.mensaje) {
      setErr(j.error ?? "No respondió. Inténtalo de nuevo.");
      return;
    }
    setMensajes((m) => [...m, j.mensaje as Mensaje]);
  }

  async function borrar() {
    if (!confirm("¿Empezar la conversación de cero? Se borra el historial.")) return;
    const r = await fetch("/api/asesora", { method: "DELETE" });
    if (r.ok) setMensajes([]);
  }

  if (!encendida) {
    return (
      <div className="tarjeta hundida">
        <p className="mini" style={{ margin: 0 }}>
          {nombre} está apagada. Para encenderla, agrega tu ANTHROPIC_API_KEY a las variables de entorno (en .env.local y en Vercel) y vuelve a desplegar. Las instrucciones están en INSTALAR.md.
        </p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div className="stack" style={{ gap: ".6rem" }}>
        {mensajes.length === 0 && (
          <div className="tarjeta hundida">
            <p className="mini" style={{ margin: 0 }}>
              Pregúntale qué ponerte hoy o el viernes, si una prenda que viste combina con lo que tienes (manda foto de la prenda y de la etiqueta), o qué conviene comprar. Conoce tu inventario, tus combinaciones, lo que está limpio cada día y tus reglas.
            </p>
          </div>
        )}
        {mensajes.map((m) => (
          <div key={m.id} className={`burbuja ${m.rol}`} style={{ whiteSpace: "pre-wrap" }}>
            {m.texto}
            {m.fotos > 0 && m.rol === "user" && <span className="chip" style={{ marginLeft: ".4rem", fontSize: ".66rem" }}>{m.fotos} foto{m.fotos === 1 ? "" : "s"}</span>}
          </div>
        ))}
        {busy && <div className="burbuja assistant mini suave">{nombre} está pensando…</div>}
        <div ref={fin} />
      </div>
      {err && <p className="aviso-rojo">{err}</p>}
      <form onSubmit={enviar} className="tarjeta stack" style={{ gap: ".55rem", position: "sticky", bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}>
        <textarea className="input" rows={2} placeholder={`Escríbele a ${nombre}`} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={4000} style={{ resize: "vertical" }} />
        <div className="fila" style={{ gap: ".5rem", justifyContent: "space-between", flexWrap: "wrap" }}>
          <label className="btn ghost chico" style={{ cursor: "pointer" }}>
            {fotos.length ? `${fotos.length} foto${fotos.length === 1 ? "" : "s"}` : "Adjuntar fotos"}
            <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 4))} />
          </label>
          <div className="fila" style={{ gap: ".5rem" }}>
            {mensajes.length > 0 && <button type="button" className="btn ghost chico" onClick={borrar} disabled={busy}>Borrar</button>}
            <button type="submit" className="btn chico" disabled={busy || (!texto.trim() && fotos.length === 0)}>Enviar</button>
          </div>
        </div>
      </form>
    </div>
  );
}
