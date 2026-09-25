"use client";

import { useState } from "react";
import type { EstadoArmario, TipoPrenda } from "@/lib/armario";
import { REGLAS_USO, TIPOS } from "@/contenido/config";

const TIPOS_ORDEN: TipoPrenda[] = ["top", "capa", "pant", "zapato"];

/** Dar de alta prendas y armar combinaciones. Para cargar muchas de golpe, usa `npm run cargar` (ver INSTALAR.md). */
export function Armario({ inicial, hoy }: { inicial: EstadoArmario; hoy: string }) {
  const [est, setEst] = useState(inicial);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [p, setP] = useState({ nombre: "", tipo: "top" as TipoPrenda, color: "#444444", tienda: "", talla: "", composicion: "", tintoreria: false });
  const [o, setO] = useState<{ nombre: string; ocasion: string; foto: string; prendas: string[] }>({ nombre: "", ocasion: "", foto: "", prendas: [] });

  async function enviar(body: Record<string, unknown>, mensaje: string): Promise<boolean> {
    setBusy(true);
    setErr(null);
    setOk(null);
    const r = await fetch("/api/armario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, fecha: hoy }) });
    const j = (await r.json()) as EstadoArmario & { error?: string };
    setBusy(false);
    if (!r.ok) {
      setErr(j.error ?? "Error");
      return false;
    }
    setEst(j);
    setOk(mensaje);
    return true;
  }

  const prendasActivas = est.prendas.filter((e) => e.prenda.activa).map((e) => e.prenda);

  return (
    <div className="stack" style={{ gap: "1.2rem" }}>
      {ok && <p className="chip ok" style={{ alignSelf: "flex-start" }}>{ok}</p>}
      {err && <p className="aviso-rojo">{err}</p>}

      <section className="tarjeta stack" style={{ gap: ".55rem" }}>
        <p className="kicker" style={{ margin: 0 }}>Nueva prenda</p>
        <input className="input" placeholder="Nombre (ej. Playera negra de algodón)" value={p.nombre} maxLength={80} onChange={(e) => setP({ ...p, nombre: e.target.value })} />
        <div className="fila" style={{ gap: ".5rem" }}>
          <select className="input" value={p.tipo} onChange={(e) => setP({ ...p, tipo: e.target.value as TipoPrenda })} aria-label="Tipo">
            {TIPOS_ORDEN.map((t) => <option key={t} value={t}>{TIPOS[t]} · {REGLAS_USO[t].usos} uso{REGLAS_USO[t].usos === 1 ? "" : "s"}</option>)}
          </select>
          <input type="color" value={p.color} onChange={(e) => setP({ ...p, color: e.target.value })} aria-label="Color" style={{ width: 48, height: 44, border: 0, background: "none", flex: "none" }} />
        </div>
        <div className="fila" style={{ gap: ".5rem" }}>
          <input className="input" placeholder="Tienda" value={p.tienda} maxLength={40} onChange={(e) => setP({ ...p, tienda: e.target.value })} />
          <input className="input" placeholder="Talla" value={p.talla} maxLength={20} onChange={(e) => setP({ ...p, talla: e.target.value })} />
        </div>
        <input className="input" placeholder="Composición (ej. 100% algodón)" value={p.composicion} maxLength={200} onChange={(e) => setP({ ...p, composicion: e.target.value })} />
        <label className="fila mini" style={{ gap: ".5rem" }}>
          <input type="checkbox" checked={p.tintoreria} onChange={(e) => setP({ ...p, tintoreria: e.target.checked })} /> Solo tintorería (no va a lavadora)
        </label>
        <button
          type="button"
          className="btn"
          disabled={busy || !p.nombre.trim()}
          onClick={async () => {
            if (await enviar({ accion: "alta_prenda", prenda: p }, `Agregada: ${p.nombre}`)) setP({ ...p, nombre: "", composicion: "" });
          }}
        >
          Agregar prenda
        </button>
      </section>

      <section className="tarjeta stack" style={{ gap: ".55rem" }}>
        <p className="kicker" style={{ margin: 0 }}>Nueva combinación</p>
        <input className="input" placeholder="Nombre (ej. Columna oscura)" value={o.nombre} maxLength={60} onChange={(e) => setO({ ...o, nombre: e.target.value })} />
        {prendasActivas.length === 0 ? (
          <p className="mini suave" style={{ margin: 0 }}>Primero agrega prendas.</p>
        ) : (
          TIPOS_ORDEN.map((t) => {
            const lista = prendasActivas.filter((x) => x.tipo === t);
            if (lista.length === 0) return null;
            return (
              <div key={t}>
                <p className="etiqueta" style={{ margin: ".3rem 0" }}>{TIPOS[t]}</p>
                <div className="fila" style={{ gap: ".4rem", flexWrap: "wrap" }}>
                  {lista.map((x) => {
                    const sel = o.prendas.includes(x.id);
                    return (
                      <button
                        key={x.id}
                        type="button"
                        className={`chip ${sel ? "ok" : ""}`}
                        aria-pressed={sel}
                        style={{ cursor: "pointer", border: "1px solid " + (sel ? "var(--salvia-borde)" : "var(--linea)"), padding: ".4rem .7rem", gap: ".35rem" }}
                        onClick={() => setO({ ...o, prendas: sel ? o.prendas.filter((y) => y !== x.id) : [...o.prendas, x.id] })}
                      >
                        <i className="punto-color" style={{ background: x.color ?? "#ccc" }} aria-hidden />
                        {x.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        <input className="input" placeholder="Ocasión (opcional: casual, trabajo, formal)" value={o.ocasion} maxLength={40} onChange={(e) => setO({ ...o, ocasion: e.target.value })} />
        <input className="input" placeholder="Liga a una foto del outfit (opcional)" value={o.foto} maxLength={500} onChange={(e) => setO({ ...o, foto: e.target.value })} />
        <button
          type="button"
          className="btn"
          disabled={busy || !o.nombre.trim() || o.prendas.length < 2}
          onClick={async () => {
            if (await enviar({ accion: "alta_outfit", nombre: o.nombre, prendas: o.prendas, ocasion: o.ocasion, foto: o.foto }, `Combinación creada: ${o.nombre}`)) setO({ nombre: "", ocasion: "", foto: "", prendas: [] });
          }}
        >
          Crear combinación
        </button>
      </section>

      <section className="tarjeta">
        <p className="kicker">Combinaciones · {est.outfits.length}</p>
        {est.outfits.length === 0 ? (
          <p className="mini suave" style={{ margin: 0 }}>Todavía no hay.</p>
        ) : (
          <div className="stack" style={{ gap: ".35rem" }}>
            {est.outfits.map((x) => (
              <div key={x.outfit.id} className="fila" style={{ justifyContent: "space-between", gap: ".6rem", padding: ".35rem 0", borderTop: "1px solid var(--linea)" }}>
                <span style={{ fontSize: ".88rem" }}>
                  <b className="cifra">{x.outfit.id}</b> · {x.outfit.nombre}
                </span>
                <button
                  type="button"
                  className="btn ghost chico"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`¿Retirar "${x.outfit.nombre}"? Se conserva en el historial.`)) void enviar({ accion: "retirar_outfit", outfit: x.outfit.id }, `Retirada: ${x.outfit.nombre}`);
                  }}
                >
                  Retirar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
