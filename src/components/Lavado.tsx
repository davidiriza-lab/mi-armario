"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Carga, EstadoArmario, EstadoPrenda } from "@/lib/armario";
import { cargaDe } from "@/lib/reglas";
import { CARGAS, GUIA_LAVADO } from "@/contenido/lavado";
import { fechaCorta } from "@/lib/fecha";

type Estado = "sucia" | "en uso" | "limpia" | "puesta hoy";
function estadoDe(e: EstadoPrenda, hoy?: string): Estado {
  if (hoy && e.fechas.includes(hoy)) return "puesta hoy";
  if (e.usos >= e.prenda.usos_max) return "sucia";
  if (e.usos > 0) return "en uso";
  return "limpia";
}

export function Lavado({ inicial, hoy }: { inicial: EstadoArmario; hoy: string }) {
  const router = useRouter();
  const [est, setEst] = useState(inicial);
  const [sel, setSel] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    for (const e of inicial.prendas) if (estadoDe(e, hoy) === "sucia" && e.prenda.activa) s[e.prenda.id] = true;
    return s;
  });
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  async function lavar(carga: Carga, prendas: string[]) {
    setErr(null);
    const r = await fetch("/api/armario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "lavar_carga", carga, prendas, fecha: hoy }) });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Error");
      return;
    }
    setEst(j as EstadoArmario);
    setSel((s) => {
      const n = { ...s };
      for (const p of prendas) delete n[p];
      return n;
    });
    start(() => router.refresh());
  }

  const lavables = est.prendas.filter((e) => e.prenda.activa && cargaDe(e.prenda) !== null);
  const sucias = lavables.filter((e) => estadoDe(e, hoy) === "sucia");
  const porCarga = (c: Carga) => lavables.filter((e) => cargaDe(e.prenda) === c);
  const gastadas = est.prendas
    .filter((e) => e.prenda.activa && e.vida !== null && e.lavadas >= e.vida * 0.75)
    .sort((a, b) => b.lavadas / (b.vida ?? 1) - a.lavadas / (a.vida ?? 1));
  const recomendada = CARGAS.filter((c) => c.id !== "C").map((c) => ({ c, n: porCarga(c.id).filter((e) => estadoDe(e, hoy) === "sucia").length })).sort((a, b) => b.n - a.n)[0];

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <section className="tarjeta">
        <p className="kicker">Hoy</p>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, margin: ".2rem 0 .3rem" }}>
          {sucias.length === 0 ? "Todo limpio. No toca lavar." : `${sucias.length} prenda${sucias.length === 1 ? "" : "s"} sucia${sucias.length === 1 ? "" : "s"}. ${recomendada && recomendada.n > 0 ? `Toca la ${recomendada.c.nombre} (${recomendada.n} pieza${recomendada.n === 1 ? "" : "s"}).` : ""}`}
        </p>
        <p className="suave" style={{ fontSize: ".85rem", margin: 0 }}>
          Lo que la app registró como usado desde el último lavado de cada prenda, según tus reglas de uso. Lo que traes puesto hoy no cuenta. Marca las de &ldquo;en uso&rdquo; si quieres adelantar su lavado. La vida útil es una estimación por tipo de tela.
        </p>
      </section>

      {gastadas.length > 0 && (
        <section className="tarjeta">
          <p className="kicker">Desgaste</p>
          <div className="stack" style={{ gap: ".35rem", marginTop: ".4rem" }}>
            {gastadas.map((e) => (
              <div key={e.prenda.id} className="fila" style={{ justifyContent: "space-between", gap: ".6rem" }}>
                <span style={{ fontSize: ".9rem" }}>{e.prenda.nombre}</span>
                <span className={`chip ${e.lavadas >= (e.vida ?? 0) ? "rojo" : "aviso"}`}>
                  {e.lavadas} de ~{e.vida} lavadas
                </span>
              </div>
            ))}
          </div>
          <p className="suave" style={{ fontSize: ".78rem", margin: ".7rem 0 0" }}>
            En ámbar: ve buscando reemplazo. En rojo: ya cumplió su vida estimada; revisa cuello, color y forma. <a href="/compras" style={{ textDecoration: "underline" }}>Ver lista de compras</a>.
          </p>
        </section>
      )}

      {CARGAS.map((c) => {
        const lista = porCarga(c.id);
        if (lista.length === 0) return null;
        const marcadas = lista.filter((e) => sel[e.prenda.id] && estadoDe(e, hoy) !== "puesta hoy").map((e) => e.prenda.id);
        return (
          <section key={c.id} className="tarjeta">
            <p className="kicker">{c.nombre}</p>
            <p className="suave" style={{ fontSize: ".82rem", margin: ".1rem 0 0" }}>{c.detalle}</p>
            <div className="stack" style={{ gap: ".35rem", marginTop: ".8rem" }}>
              {lista.map((e) => {
                const st = estadoDe(e, hoy);
                const puesta = st === "puesta hoy";
                return (
                  <label key={e.prenda.id} className="fila" style={{ justifyContent: "space-between", padding: ".45rem 0", borderTop: "1px solid var(--linea)", cursor: puesta ? "default" : "pointer", opacity: puesta ? 0.55 : 1 }}>
                    <span className="fila" style={{ gap: ".6rem" }}>
                      <input type="checkbox" disabled={puesta} checked={!puesta && !!sel[e.prenda.id]} onChange={(ev) => setSel((s) => ({ ...s, [e.prenda.id]: ev.target.checked }))} />
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: e.prenda.color ?? "#ccc", border: "1px solid var(--linea)", flex: "0 0 auto" }} />
                      <span style={{ fontSize: ".9rem" }}>
                        {e.prenda.nombre}
                        {e.prenda.cuidado && <span className="suave" style={{ display: "block", fontSize: ".76rem", marginTop: ".1rem" }}>{e.prenda.cuidado}</span>}
                        {e.vida !== null && e.lavadas > 0 && <span className="suave" style={{ display: "block", fontSize: ".76rem", marginTop: ".1rem" }}>{e.lavadas} de ~{e.vida} lavadas</span>}
                      </span>
                    </span>
                    <span className={`chip ${st === "sucia" ? "rojo" : st === "en uso" ? "aviso" : st === "puesta hoy" ? "" : "ok"}`}>
                      {st} {st === "sucia" || st === "en uso" ? `${e.usos}/${e.prenda.usos_max}` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="suave" style={{ fontSize: ".78rem", margin: ".7rem 0 .9rem" }}>{c.ajustes}</p>
            <button className="btn ancho" disabled={marcadas.length === 0} onClick={() => lavar(c.id, marcadas)}>
              {marcadas.length === 0 ? "Nada marcado" : `${c.boton ?? "Lavé esta carga"} · ${marcadas.length} pieza${marcadas.length === 1 ? "" : "s"}`}
            </button>
          </section>
        );
      })}

      {err && <p className="aviso-rojo">{err}</p>}

      <section className="tarjeta hundida">
        <p className="kicker">Cómo lavar en tu casa</p>
        <ol style={{ margin: ".5rem 0 0", paddingLeft: "1.2rem", fontSize: ".88rem", lineHeight: 1.5 }}>
          {GUIA_LAVADO.map((g) => (
            <li key={g.titulo} style={{ marginBottom: ".35rem" }}>
              <b>{g.titulo}.</b> {g.texto}
            </li>
          ))}
        </ol>
      </section>

      {est.lavados.length > 0 && (
        <section className="tarjeta">
          <p className="kicker">Últimas cargas</p>
          <div className="stack" style={{ gap: ".3rem", marginTop: ".4rem", fontSize: ".85rem" }}>
            {est.lavados.map((l) => (
              <div key={l.id} className="fila" style={{ justifyContent: "space-between" }}>
                <span>{fechaCorta(l.fecha)} · Carga {l.carga}</span>
                <span className="suave">{l.prendas.length} pieza{l.prendas.length === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
