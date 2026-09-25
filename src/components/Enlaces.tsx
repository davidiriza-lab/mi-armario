"use client";

import { useState } from "react";
import type { Enlace } from "@/lib/enlaces";

export function Enlaces({ inicial, origen }: { inicial: Enlace[]; origen: string }) {
  const [lista, setLista] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const [nota, setNota] = useState("");
  const [copiado, setCopiado] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const url = (t: string) => `${origen}/i/${t}`;

  async function crear() {
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/enlaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nota: nota.trim() || undefined }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) {
      setErr(j.error ?? "Error");
      return;
    }
    setLista((l) => [j.enlace as Enlace, ...l]);
    setNota("");
  }

  async function revocar(id: number) {
    if (!confirm("¿Revocar esta liga? Quien la tenga dejará de poder entrar.")) return;
    setBusy(true);
    const r = await fetch("/api/enlaces", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setBusy(false);
    if (r.ok) setLista((l) => l.filter((e) => e.id !== id));
  }

  async function copiar(e: Enlace) {
    try {
      await navigator.clipboard.writeText(url(e.token));
      setCopiado(e.id);
      setTimeout(() => setCopiado(null), 1600);
    } catch {
      prompt("Copia la liga:", url(e.token));
    }
  }

  return (
    <section id="ligas" className="tarjeta stack" style={{ gap: ".7rem" }}>
      <div>
        <p className="kicker">Ligas para compartir</p>
        <p className="mini" style={{ margin: ".2rem 0 0" }}>Abren Vestir en solo lectura, sin contraseña. Quien tenga la liga ve tus combinaciones y qué está disponible cada día; no puede cambiar nada. Revócala cuando ya no la necesite.</p>
      </div>
      <div className="fila" style={{ gap: ".5rem" }}>
        <input className="input" placeholder="Para quién es (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={80} />
        <button className="btn chico" onClick={crear} disabled={busy} style={{ flex: "none" }}>Crear liga</button>
      </div>
      {err && <p className="aviso-rojo">{err}</p>}
      {lista.length === 0 ? (
        <p className="mini suave" style={{ margin: 0 }}>Todavía no hay ligas.</p>
      ) : (
        <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: ".5rem" }}>
          {lista.map((e) => (
            <li key={e.id} className="stack" style={{ gap: ".35rem", padding: ".6rem 0", borderTop: "1px solid var(--linea)" }}>
              <div className="fila" style={{ justifyContent: "space-between" }}>
                <b style={{ fontSize: ".9rem" }}>{e.nota || "Sin nombre"}</b>
                <span className="mini cifra" style={{ fontSize: ".72rem" }}>
                  {e.usos} {e.usos === 1 ? "visita" : "visitas"}
                </span>
              </div>
              <code className="mini" style={{ fontSize: ".72rem", wordBreak: "break-all", color: "var(--tinta-2)" }}>{url(e.token)}</code>
              <div className="fila" style={{ gap: ".4rem" }}>
                <button className="btn chico" onClick={() => copiar(e)} disabled={busy}>{copiado === e.id ? "Copiada" : "Copiar liga"}</button>
                <button className="btn peligro chico" onClick={() => revocar(e.id)} disabled={busy}>Revocar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
