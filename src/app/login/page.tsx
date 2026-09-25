"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP } from "@/contenido/config";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setErr(r.status === 503 ? j.error ?? "Falta configurar la app." : "No es esa.");
      return;
    }
    const next = params.get("next") || "/";
    router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="tarjeta stack" style={{ gap: "1rem" }}>
      <label className="etiqueta" htmlFor="pw">Contraseña</label>
      <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" className="input" placeholder="••••••••••••" />
      {err && <p className="aviso-rojo">{err}</p>}
      <button type="submit" className="btn" disabled={busy || !pw}>{busy ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}

export default function Login() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-5 py-10">
      <p className="kicker">{APP.nombre}</p>
      <h1 className="display" style={{ fontSize: "2.4rem", margin: ".4rem 0 1.4rem" }}>{APP.saludo}</h1>
      <Suspense>
        <Form />
      </Suspense>
    </div>
  );
}
