"use client";

import { useState } from "react";
import { ordenar, precioTexto as precio, type Compra, type EstadoCompra } from "@/lib/compras-orden";
import { NIVELES } from "@/contenido/config";

/** Lista de compras por tienda, en tu orden de compra. Marcar comprada o descartar. */
export function Compras({ inicial }: { inicial: Compra[] }) {
  const [items, setItems] = useState(inicial);
  const [busy, setBusy] = useState<number | null>(null);
  const [verHechas, setVerHechas] = useState(false);

  const marcar = async (id: number, estado: EstadoCompra) => {
    setBusy(id);
    const r = await fetch("/api/compras", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, estado }) });
    setBusy(null);
    if (!r.ok) {
      alert("No se pudo guardar.");
      return;
    }
    setItems((xs) => ordenar(xs.map((c) => (c.id === id ? { ...c, estado, comprada_en: estado === "comprada" ? new Date().toISOString() : null } : c))));
  };

  const pendientes = items.filter((c) => c.estado === "pendiente");
  const hechas = items.filter((c) => c.estado !== "pendiente");
  const tiendas: { tienda: string; items: Compra[] }[] = [];
  for (const c of pendientes) {
    const g = tiendas[tiendas.length - 1];
    if (g && g.tienda === c.tienda) g.items.push(c);
    else tiendas.push({ tienda: c.tienda, items: [c] });
  }
  const totalAhora = pendientes.filter((c) => c.nivel === 1).reduce((a, c) => a + (c.precio ?? 0), 0);

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <AgregarCompra onAgregada={(xs) => setItems(ordenar(xs))} />
      <p className="mini suave" style={{ margin: 0 }}>
        Agrupada por tienda y por prioridad. El punto de color es el color exacto a comprar.
        {totalAhora > 0 && <> Lo marcado <b>Ahora</b> suma {precio(totalAhora)}.</>}
      </p>

      {tiendas.length === 0 && <p className="tarjeta hundida vacio">Nada pendiente.</p>}

      {tiendas.map((g, gi) => (
        <section key={g.tienda} className="stack" style={{ gap: ".5rem" }}>
          <div className="fila" style={{ justifyContent: "space-between" }}>
            <p className="kicker" style={{ margin: 0 }}>
              {gi + 1}. {g.tienda}
            </p>
            <span className="mini cifra suave">{g.items.length}</span>
          </div>
          <ul className="tarjeta lista">
            {g.items.map((c) => (
              <li key={c.id} className={busy === c.id ? "pendiente" : ""} style={{ padding: ".7rem .9rem" }}>
                <div className="fila" style={{ alignItems: "flex-start", gap: ".7rem" }}>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="foto-compra" aria-label={`Ver ${c.nombre} en ${c.tienda}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.imagen ? <img src={c.imagen} alt="" loading="lazy" /> : <span className="mini suave">sin foto</span>}
                    </a>
                  ) : (
                    <span className="foto-compra">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.imagen ? <img src={c.imagen} alt="" loading="lazy" /> : <span className="mini suave">sin foto</span>}</span>
                  )}
                  <div className="stack" style={{ minWidth: 0, flex: 1, gap: ".15rem" }}>
                    <div className="fila" style={{ gap: ".4rem", flexWrap: "wrap" }}>
                      <span className={`chip cifra ${c.nivel === 1 ? "ok" : ""}`} style={{ fontSize: ".66rem", padding: ".14rem .5rem" }}>{NIVELES[c.nivel] ?? c.nivel}</span>
                    </div>
                    {c.color_hex && (
                      <span className="fila" style={{ gap: ".35rem", fontSize: ".78rem", fontWeight: 600, color: "var(--tinta-2)" }} title="Color a comprar">
                        <i className="punto-color" style={{ background: c.color_hex }} aria-hidden />
                        {c.color_nombre ?? c.color_hex}
                      </span>
                    )}
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: ".92rem", fontWeight: 600, lineHeight: 1.25, color: "inherit", textDecoration: "none" }}>
                        {c.nombre} <span className="suave" style={{ fontWeight: 500 }}>↗</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: ".92rem", fontWeight: 600, lineHeight: 1.25 }}>{c.nombre}</span>
                    )}
                    <span className="cifra suave" style={{ fontSize: ".74rem" }}>
                      {[c.ref ? `ref ${c.ref}` : "", precio(c.precio), c.talla ? `talla ${c.talla}` : ""].filter(Boolean).join(" · ")}
                    </span>
                    {c.nota && <span className="mini suave" style={{ fontSize: ".76rem", lineHeight: 1.4 }}>{c.nota}</span>}
                  </div>
                </div>
                <div className="fila" style={{ gap: ".4rem", marginTop: ".55rem" }}>
                  <button type="button" className="btn chico" disabled={busy === c.id} onClick={() => marcar(c.id, "comprada")}>La compré</button>
                  <button type="button" className="btn ghost chico" disabled={busy === c.id} onClick={() => marcar(c.id, "descartada")}>Descartar</button>
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="btn ghost chico" style={{ marginLeft: "auto" }}>Ver en tienda</a>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {hechas.length > 0 && (
        <section className="stack" style={{ gap: ".5rem" }}>
          <button type="button" className="enlace mini" style={{ background: "none", border: 0, textAlign: "left", padding: 0, cursor: "pointer" }} onClick={() => setVerHechas((v) => !v)}>
            {verHechas ? "Ocultar" : "Ver"} compradas y descartadas ({hechas.length})
          </button>
          {verHechas && (
            <ul className="tarjeta lista hundida">
              {hechas.map((c) => (
                <li key={c.id} className={busy === c.id ? "pendiente" : ""} style={{ padding: ".6rem .9rem" }}>
                  <div className="fila" style={{ justifyContent: "space-between", gap: ".6rem" }}>
                    <span className="truncar" style={{ fontSize: ".88rem", textDecoration: c.estado === "descartada" ? "line-through" : "none", opacity: 0.8 }}>
                      {c.tienda} · {c.nombre}
                    </span>
                    <span className="fila" style={{ gap: ".4rem", flex: "none" }}>
                      <span className="chip" style={{ fontSize: ".66rem", padding: ".14rem .5rem" }}>{c.estado}</span>
                      <button type="button" className="enlace mini" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} disabled={busy === c.id} onClick={() => marcar(c.id, "pendiente")}>volver</button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="mini suave" style={{ margin: 0 }}>Al comprar algo, márcalo aquí y dalo de alta en Armario. La asesora lee esta misma lista.</p>
    </div>
  );
}

function AgregarCompra({ onAgregada }: { onAgregada: (items: Compra[]) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ tienda: "", nombre: "", talla: "", precio: "", nivel: "2", url: "", color_hex: "#555555", color_nombre: "", nota: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function guardar() {
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/compras", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, precio: f.precio ? Number(f.precio) : null, nivel: Number(f.nivel), color_hex: f.color_nombre ? f.color_hex : null }) });
    const j = (await r.json()) as { items?: Compra[]; error?: string };
    setBusy(false);
    if (!r.ok || !j.items) {
      setErr(j.error ?? "No se pudo guardar");
      return;
    }
    onAgregada(j.items);
    setF({ tienda: f.tienda, nombre: "", talla: "", precio: "", nivel: "2", url: "", color_hex: "#555555", color_nombre: "", nota: "" });
    setAbierto(false);
  }

  if (!abierto) return <button type="button" className="btn ghost chico" style={{ alignSelf: "flex-start" }} onClick={() => setAbierto(true)}>Agregar a la lista</button>;
  return (
    <section className="tarjeta stack" style={{ gap: ".55rem" }}>
      <p className="kicker" style={{ margin: 0 }}>Agregar a la lista</p>
      <input className="input" placeholder="Tienda" value={f.tienda} onChange={set("tienda")} maxLength={40} />
      <input className="input" placeholder="Qué prenda" value={f.nombre} onChange={set("nombre")} maxLength={120} />
      <div className="fila" style={{ gap: ".5rem" }}>
        <input className="input" placeholder="Talla" value={f.talla} onChange={set("talla")} maxLength={20} />
        <input className="input" placeholder="Precio" inputMode="decimal" value={f.precio} onChange={set("precio")} />
      </div>
      <div className="fila" style={{ gap: ".5rem" }}>
        <input type="color" value={f.color_hex} onChange={set("color_hex")} aria-label="Color" style={{ width: 48, height: 44, border: 0, background: "none", flex: "none" }} />
        <input className="input" placeholder="Nombre del color (opcional)" value={f.color_nombre} onChange={set("color_nombre")} maxLength={40} />
      </div>
      <select className="input" value={f.nivel} onChange={set("nivel")} aria-label="Prioridad">
        {Object.entries(NIVELES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <input className="input" placeholder="Liga a la tienda (opcional)" value={f.url} onChange={set("url")} maxLength={500} />
      <input className="input" placeholder="Nota (opcional)" value={f.nota} onChange={set("nota")} maxLength={400} />
      {err && <p className="aviso-rojo">{err}</p>}
      <div className="fila" style={{ gap: ".5rem" }}>
        <button type="button" className="btn chico" disabled={busy || !f.tienda.trim() || !f.nombre.trim()} onClick={guardar}>Guardar</button>
        <button type="button" className="btn ghost chico" onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
    </section>
  );
}
