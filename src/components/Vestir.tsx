"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EstadoArmario, EstadoOutfit } from "@/lib/armario";
import { RESUMEN_REGLAS, TIPOS } from "@/contenido/config";
import { luminosidad } from "@/lib/reglas";
import { fechaCorta, fechaLarga, sumarDias } from "@/lib/fecha";

type Tono = "todos" | "oscuros" | "claros";
const TONOS: { id: Tono; t: string }[] = [
  { id: "todos", t: "Todos" },
  { id: "oscuros", t: "Oscuros" },
  { id: "claros", t: "Claros" },
];
/** Tono del outfit según su pantalón: oscuro o claro por luminancia. */
function tonoDe(hex: string | null | undefined): Exclude<Tono, "todos"> {
  const l = luminosidad(hex ?? null);
  return l === null || l < 0.45 ? "oscuros" : "claros";
}
const DIAS_ATRAS = 7;
const DIAS_ADELANTE = 6;

export function Vestir({ inicial, hoy, token, soloLectura = false }: { inicial: EstadoArmario; hoy: string; token?: string; soloLectura?: boolean }) {
  const router = useRouter();
  const [dia, setDia] = useState(hoy);
  const [est, setEst] = useState(inicial);
  const [err, setErr] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [pending, start] = useTransition();
  const [verTodo, setVerTodo] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null); // id del outfit abierto en grande
  const [verPrendas, setVerPrendas] = useState(false);
  const [filtro, setFiltro] = useState<string | null>(null); // prenda seleccionada en la lista
  const [tab, setTab] = useState<Tono>("todos");
  useEffect(() => {
    try {
      const t = localStorage.getItem("armario-tono") as Tono | null;
      if (t && TONOS.some((x) => x.id === t)) requestAnimationFrame(() => setTab(t));
    } catch {}
  }, []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom]);

  async function cargar(f: string) {
    setDia(f);
    setErr(null);
    setCargando(true);
    const r = await fetch(`/api/armario?fecha=${f}`, { headers: token ? { "x-armario-liga": token } : undefined });
    const j = await r.json();
    setCargando(false);
    if (!r.ok) {
      setErr(j.error ?? "Error");
      return;
    }
    setEst(j as EstadoArmario);
  }

  async function accion(body: Record<string, string>) {
    setErr(null);
    const payload: Record<string, string | boolean> = { ...body, fecha: dia };
    if ("activa" in body) payload.activa = body.activa === "1";
    const r = await fetch("/api/armario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Error");
      return;
    }
    setEst(j as EstadoArmario);
    start(() => router.refresh());
  }

  const esHoy = dia === hoy;
  const esPasado = dia < hoy;
  const etiquetaDia = esHoy ? "hoy" : dia === sumarDias(hoy, 1) ? "mañana" : dia === sumarDias(hoy, -1) ? "ayer" : `el ${fechaCorta(dia)}`;
  const disponibles = est.outfits.filter((o) => o.disponible);
  const colorPrenda = new Map(est.prendas.map((p) => [p.prenda.id, p.prenda]));
  const tonoOutfit = (o: EstadoOutfit) => {
    const pant = o.outfit.prendas.map((id) => colorPrenda.get(id)).find((p) => p?.tipo === "pant");
    return tonoDe(pant?.color);
  };
  const conteoTono: Record<Tono, number> = { todos: est.outfits.length, oscuros: 0, claros: 0 };
  for (const o of est.outfits) conteoTono[tonoOutfit(o)]++;
  const base0 = filtro ? est.outfits.filter((o) => o.outfit.prendas.includes(filtro)) : est.outfits;
  const base = tab === "todos" || filtro ? base0 : base0.filter((o) => tonoOutfit(o) === tab);
  const visibles = filtro || verTodo ? base : base.filter((o) => o.disponible || o.esHoy);
  // Orden por uso real: lo puesto ese día, luego lo disponible, y dentro de cada grupo lo que más te has puesto.
  const lista = [...visibles].sort((a, b) => Number(b.esHoy) - Number(a.esHoy) || Number(b.disponible) - Number(a.disponible) || b.veces - a.veces || a.outfit.orden - b.outfit.orden);
  const prendaFiltro = filtro ? est.prendas.find((p) => p.prenda.id === filtro)?.prenda : null;
  const elegido = est.outfits.find((o) => o.esHoy);
  const sucias = est.prendas.filter((p) => !p.disponible);
  const planPorDia = new Map(est.historial.map((u) => [u.fecha, u.outfit_id ?? "·"]));
  const pasados = est.historial.filter((u) => u.fecha < hoy);
  const zoomed = zoom ? est.outfits.find((o) => o.outfit.id === zoom) ?? null : null;
  const combosPor = new Map<string, number>();
  for (const o of est.outfits) for (const g of o.outfit.prendas) combosPor.set(g, (combosPor.get(g) ?? 0) + 1);
  const programados = est.historial.filter((u) => u.fecha > hoy);

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      {/* Tira de días: 7 atrás (para corregir) + hoy + 6 adelante (para programar) */}
      <div className="tira-dias" role="tablist" aria-label="Día" ref={(el) => { if (el && !el.dataset.centrado) { el.dataset.centrado = "1"; const h = el.querySelector<HTMLElement>("[data-hoy]"); if (h) el.scrollLeft = Math.max(0, h.offsetLeft - el.clientWidth / 2 + h.offsetWidth / 2); } }}>
        {Array.from({ length: DIAS_ATRAS + 1 + DIAS_ADELANTE }, (_, k) => {
          const i = k - DIAS_ATRAS;
          const f = sumarDias(hoy, i);
          const plan = planPorDia.get(f);
          const activo = f === dia;
          return (
            <button key={f} type="button" role="tab" aria-selected={activo} data-hoy={i === 0 ? "1" : undefined} className={`dia-btn ${activo ? "activo" : ""} ${i < 0 ? "pasado" : ""}`} onClick={() => cargar(f)}>
              <span className="mini" style={{ fontSize: ".62rem", textTransform: "uppercase", letterSpacing: ".08em" }}>{i === 0 ? "Hoy" : i === 1 ? "Mañ" : i === -1 ? "Ayer" : fechaCorta(f).split(" ")[0]}</span>
              <b className="cifra" style={{ fontSize: "1.05rem", lineHeight: 1.1 }}>{Number(f.slice(-2))}</b>
              <span className={`dia-plan ${plan ? "on" : ""}`}>{plan ?? ""}</span>
            </button>
          );
        })}
      </div>

      <section className={`tarjeta rise ${elegido ? "" : "hundida"}`} style={{ opacity: cargando ? 0.6 : 1, transition: "opacity .2s" }}>
        <p className="kicker">{fechaLarga(dia)}</p>
        {elegido ? (
          <div className="fila" style={{ alignItems: "stretch", gap: "1rem", marginTop: ".4rem" }}>
            {(elegido.outfit.foto || elegido.outfit.collage) && (
              <button
                type="button"
                className="foto-btn"
                aria-label={`Ver ${elegido.outfit.nombre} en grande`}
                onClick={() => { setVerPrendas(false); setZoom(elegido.outfit.id); }}
                style={{ flex: "0 0 112px", width: 112, height: 168, borderRadius: 14, overflow: "hidden", border: "1px solid var(--linea)", background: "#fff" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(elegido.outfit.foto ?? elegido.outfit.collage) as string} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            )}
            <div className="stack" style={{ gap: ".2rem", minWidth: 0, justifyContent: "center" }}>
              <h2 className="display" style={{ fontSize: "1.5rem", margin: 0 }}>
                {esHoy ? "Hoy" : esPasado ? "Ese día usaste" : "Ese día"}: {elegido.outfit.nombre}
              </h2>
              <p className="mini" style={{ margin: 0 }}>{nombres(est, elegido.outfit.prendas)}</p>
              {!soloLectura && (
                <div className="fila" style={{ marginTop: ".7rem", flexWrap: "wrap", gap: ".5rem" }}>
                  <button className="btn ghost chico" onClick={() => accion({ accion: "quitar" })} disabled={pending}>Quitar</button>
                  <span className="mini">o elige otro abajo.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h2 className="display" style={{ fontSize: "1.7rem", margin: ".35rem 0 .2rem" }}>{esPasado ? `¿Qué usaste ${etiquetaDia}?` : `¿Qué te pones ${etiquetaDia}?`}</h2>
            <p className="mini" style={{ margin: 0 }}>
              {disponibles.length === 0 ? "Nada limpio que combine ese día. Toca lavar." : `${disponibles.length} de ${est.outfits.length} combinaciones con prendas limpias ${etiquetaDia}.`}
            </p>
          </>
        )}
        {err && <p className="aviso-rojo" style={{ marginTop: ".6rem" }}>{err}</p>}
      </section>

      <section className="seccion" id="lista-outfits" style={{ marginTop: 0, scrollMarginTop: "1rem" }}>
        <div className="fila" style={{ justifyContent: "space-between", marginBottom: ".6rem" }}>
          <p className="kicker" style={{ margin: 0 }}>
            {prendaFiltro ? `Con ${prendaFiltro.nombre} · ${lista.length}` : verTodo ? "Todas las combinaciones" : `Disponibles ${etiquetaDia}`}
          </p>
          {prendaFiltro ? (
            <button className="btn chico" onClick={() => setFiltro(null)}>Quitar filtro</button>
          ) : (
            <button className="btn ghost chico" onClick={() => setVerTodo((v) => !v)}>{verTodo ? "Solo limpias" : "Ver todas"}</button>
          )}
        </div>
        {!prendaFiltro && (
          <div className="fila" style={{ gap: ".35rem", flexWrap: "wrap", marginBottom: ".7rem" }} role="tablist" aria-label="Tono">
            {TONOS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`chip cifra ${tab === t.id ? "ok" : ""}`}
                style={{ cursor: "pointer", border: "1px solid " + (tab === t.id ? "var(--salvia-borde)" : "var(--linea)"), padding: ".4rem .75rem" }}
                onClick={() => {
                  setTab(t.id);
                  try {
                    localStorage.setItem("armario-tono", t.id);
                  } catch {}
                }}
              >
                {t.t} · {conteoTono[t.id]}
              </button>
            ))}
          </div>
        )}
        {prendaFiltro && lista.length === 0 && <p className="mini suave">Ninguna combinación usa esta prenda todavía.</p>}
        {!prendaFiltro && lista.length === 0 && <p className="mini suave">Nada limpio en este tono {etiquetaDia}. Prueba otra pestaña o &ldquo;Ver todas&rdquo;.</p>}
        <div className="grid grid-cols-2 gap-3">
          {lista.map((o, i) => (
            <article
              key={o.outfit.id}
              className="tarjeta rise stack"
              style={{
                padding: 0,
                overflow: "hidden",
                animationDelay: `${i * 40}ms`,
                opacity: o.disponible || o.esHoy ? 1 : 0.45,
                outline: o.esHoy ? "2px solid var(--salvia)" : undefined,
              }}
            >
              <div style={{ aspectRatio: "2/3", background: "var(--lino-2)", position: "relative" }}>
                {o.outfit.foto || o.outfit.collage ? (
                  <button
                    type="button"
                    className="foto-btn"
                    aria-label={`Ver ${o.outfit.nombre} en grande`}
                    onClick={() => setZoom(o.outfit.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(o.outfit.foto ?? o.outfit.collage) as string} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#fff" }} />
                  </button>
                ) : (
                  <Muestras est={est} prendas={o.outfit.prendas} />
                )}
                <span className="chip" style={{ position: "absolute", top: 8, left: 8, background: "var(--papel)", pointerEvents: "none" }}>{o.outfit.id}</span>
              </div>
              <div className="stack" style={{ padding: ".75rem .8rem .85rem", gap: ".3rem" }}>
                <b style={{ fontSize: ".9rem", lineHeight: 1.2 }}>{o.outfit.nombre}</b>
                <span className="mini" style={{ fontSize: ".74rem" }}>{nombres(est, o.outfit.prendas)}</span>
                {o.veces > 0 && (
                  <span className="mini suave" style={{ fontSize: ".72rem" }}>
                    Usado {o.veces} {o.veces === 1 ? "vez" : "veces"}{o.ultimo ? ` · último ${fechaCorta(o.ultimo)}` : ""}
                  </span>
                )}
                {o.esHoy ? (
                  <span className="chip ok" style={{ alignSelf: "flex-start", marginTop: ".3rem" }}>{esHoy ? "Puesto hoy" : esPasado ? "Usado" : "Programado"}</span>
                ) : o.disponible ? (
                  soloLectura ? (
                    <span className="chip" style={{ alignSelf: "flex-start", marginTop: ".3rem" }}>Disponible</span>
                  ) : (
                    <button className="btn chico" style={{ marginTop: ".4rem" }} disabled={pending || cargando} onClick={() => accion({ accion: "usar", outfit: o.outfit.id })}>
                      {esHoy ? "Usar hoy" : esPasado ? `Lo usé ${etiquetaDia}` : `Ponerlo ${etiquetaDia}`}
                    </button>
                  )
                ) : (
                  <span style={{ fontSize: ".72rem", color: "var(--rojo)", marginTop: ".3rem" }}>{o.motivo}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="seccion tarjeta">
        <div className="fila" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="kicker" style={{ margin: 0 }}>Ropa {esHoy ? "hoy" : etiquetaDia}</p>
            <p className="mini" style={{ margin: ".2rem 0 0" }}>
              {sucias.length === 0 ? "Todo disponible." : `${sucias.length} prenda${sucias.length === 1 ? "" : "s"} fuera ${etiquetaDia}.`}
              {est.ultimoLavado ? ` Último lavado: ${fechaCorta(est.ultimoLavado)}.` : ""}
            </p>
          </div>
        </div>
        <hr className="separador" />
        <div className="stack" style={{ gap: ".45rem" }}>
          {(["top", "capa", "pant"] as const).map((tipo) => (
            <div key={tipo}>
              <p className="etiqueta" style={{ margin: "0 0 .25rem" }}>{TIPOS[tipo]}</p>
              {est.prendas
                .filter((p) => p.prenda.tipo === tipo)
                .map((p) => (
                  <div key={p.prenda.id} className="fila" style={{ justifyContent: "space-between", padding: ".3rem 0", borderBottom: "1px solid var(--linea)" }}>
                    <button
                      type="button"
                      className="fila prenda-btn"
                      style={{ gap: ".55rem", background: filtro === p.prenda.id ? "var(--salvia-suave)" : "transparent", border: 0, padding: ".2rem .4rem", margin: "0 0 0 -.4rem", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
                      aria-pressed={filtro === p.prenda.id}
                      title="Ver combinaciones con esta prenda"
                      onClick={() => {
                        const nuevo = filtro === p.prenda.id ? null : p.prenda.id;
                        setFiltro(nuevo);
                        if (nuevo) document.getElementById("lista-outfits")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      <i style={{ width: 12, height: 12, borderRadius: 4, background: p.prenda.color ?? "#ccc", border: "1px solid var(--linea-2)", display: "inline-block", flex: "none" }} />
                      <span className="stack" style={{ lineHeight: 1.2 }}>
                        <span style={{ fontSize: ".88rem" }}>{p.prenda.nombre}</span>
                        <span className="mini cifra" style={{ fontSize: ".7rem" }}>
                          {(combosPor.get(p.prenda.id) ?? 0) === 1 ? "1 combinación" : `${combosPor.get(p.prenda.id) ?? 0} combinaciones`}
                        </span>
                      </span>
                    </button>
                    <span className="fila" style={{ gap: ".4rem" }}>
                      {!p.prenda.activa ? (
                        <span className="chip rojo">Fuera</span>
                      ) : (
                        <span className={`chip cifra ${p.disponible ? (p.usos > 0 ? "aviso" : "") : "rojo"}`} title={p.fechas.map(fechaCorta).join(", ")}>
                          {p.usos}/{p.prenda.usos_max}
                          {!p.disponible ? ` · ${p.usos >= p.prenda.usos_max ? "lavar" : "descansa"}` : ""}
                        </span>
                      )}
                      {!soloLectura && (
                        <button
                          type="button"
                          className="btn ghost chico"
                          style={{ padding: ".3rem .55rem", fontSize: ".7rem" }}
                          disabled={pending}
                          title={p.prenda.activa ? "Marcar fuera (en arreglo o guardada)" : "Volver a activar"}
                          onClick={() => accion({ accion: "activar", prenda: p.prenda.id, activa: p.prenda.activa ? "0" : "1" })}
                        >
                          {p.prenda.activa ? "Fuera" : "Activar"}
                        </button>
                      )}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </section>

      {(programados.length > 0 || pasados.length > 0) && (
        <section className="seccion">
          <p className="kicker">Este ciclo</p>
          <ol className="stack tarjeta hundida" style={{ gap: ".4rem", margin: 0, padding: "1rem 1.1rem", listStyle: "none" }}>
            {est.historial.map((u) => (
              <li key={u.id} className="fila" style={{ gap: ".6rem", fontSize: ".86rem", opacity: u.fecha < hoy ? 0.7 : 1 }}>
                <b className="cifra" style={{ minWidth: "3.6rem", textTransform: "capitalize" }}>{fechaCorta(u.fecha)}</b>
                <span className="suave">
                  {u.fecha > hoy ? "programado · " : u.fecha === hoy ? "hoy · " : ""}
                  {u.outfit_id} · {nombres(est, u.prendas)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {zoomed && (zoomed.outfit.foto || zoomed.outfit.collage) && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${zoomed.outfit.id} · ${zoomed.outfit.nombre}`} onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={(verPrendas && zoomed.outfit.collage ? zoomed.outfit.collage : (zoomed.outfit.foto ?? zoomed.outfit.collage)) as string} alt={zoomed.outfit.nombre} style={{ background: "#fff" }} />
          <div className="lightbox-pie" onClick={(e) => e.stopPropagation()}>
            <b>
              {zoomed.outfit.id} · {zoomed.outfit.nombre}
            </b>
            <span>{nombres(est, zoomed.outfit.prendas)}</span>
            {!soloLectura && (
              <div className="fila" style={{ gap: ".5rem", marginTop: ".5rem", justifyContent: "center" }}>
                {zoomed.esHoy ? (
                  <button
                    className="btn ghost chico"
                    style={{ color: "#fff", borderColor: "rgba(255,255,255,.35)" }}
                    disabled={pending}
                    onClick={async () => {
                      await accion({ accion: "quitar" });
                      setZoom(null);
                    }}
                  >
                    Quitar de {etiquetaDia}
                  </button>
                ) : zoomed.disponible ? (
                  <button
                    className="btn chico"
                    style={{ background: "#fff", color: "#1a1a1a" }}
                    disabled={pending || cargando}
                    onClick={async () => {
                      await accion({ accion: "usar", outfit: zoomed.outfit.id });
                      setZoom(null);
                    }}
                  >
                    {esHoy ? "Usar hoy" : esPasado ? `Lo usé ${etiquetaDia}` : `Ponerlo ${etiquetaDia}`}
                  </button>
                ) : (
                  <span style={{ color: "#f0a59c", fontSize: ".8rem" }}>{zoomed.motivo}</span>
                )}
                {zoomed.outfit.foto && zoomed.outfit.collage && (
                  <button className="btn ghost chico" style={{ color: "#fff", borderColor: "rgba(255,255,255,.35)" }} onClick={() => setVerPrendas((v) => !v)}>
                    {verPrendas ? "Ver foto" : "Ver prendas"}
                  </button>
                )}
                <button className="btn ghost chico" style={{ color: "#fff", borderColor: "rgba(255,255,255,.35)" }} onClick={() => setZoom(null)}>
                  Cerrar
                </button>
              </div>
            )}
            {soloLectura && (
              <div className="fila" style={{ gap: ".5rem", marginTop: ".4rem", justifyContent: "center" }}>
                {zoomed.outfit.foto && zoomed.outfit.collage && (
                  <button className="btn ghost chico" style={{ color: "#fff", borderColor: "rgba(255,255,255,.35)" }} onClick={() => setVerPrendas((v) => !v)}>
                    {verPrendas ? "Ver foto" : "Ver prendas"}
                  </button>
                )}
                <span className="mini">Toca la foto para cerrar</span>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mini suave" style={{ fontSize: ".76rem" }}>
        {RESUMEN_REGLAS}
      </p>
    </div>
  );
}

function nombres(est: EstadoArmario, ids: string[]): string {
  const m = new Map(est.prendas.map((p) => [p.prenda.id, p.prenda.nombre]));
  return ids.map((i) => m.get(i) ?? i).join(" + ");
}

function Muestras({ est, prendas }: { est: EstadoArmario; prendas: string[] }) {
  const m = new Map(est.prendas.map((p) => [p.prenda.id, p.prenda]));
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: `repeat(${prendas.length}, 1fr)` }}>
      {prendas.map((id) => (
        <div key={id} style={{ background: m.get(id)?.color ?? "#ccc" }} />
      ))}
    </div>
  );
}
