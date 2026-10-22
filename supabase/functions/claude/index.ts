// Edge Function «claude»: chiama l'API Anthropic con il segreto ANTHROPIC_API_KEY,
// così la chiave non sta più nel browser.
// Riceve { compito, testo }:
//   compito = 'stato'    → { pronto } (c'è il segreto? non chiama Claude)
//   compito = 'riunione' → testo = richiesta per l'import Plaud grezzo   → { testo }
//   compito = 'area'     → testo = richiesta per l'area automatica       → { testo }
// Accetta solo l'utente dell'app (verify_jwt attivo + controllo dell'email).
import Anthropic from "npm:@anthropic-ai/sdk@1.1.0";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const EMAIL_AMMESSA = "maci81x@gmail.com";
const MODELLO = "claude-haiku-5-5";
const ORIGINI = ["https://maci81x.github.io", "http://localhost:8765"];

// per ogni compito: quanto testo accetta e come chiamare il modello
const COMPITI: Record<string, { maxTesto: number; params: Record<string, unknown> }> = {
  riunione: { maxTesto: 200_000, params: { max_tokens: 16000, output_config: { effort: "low" } } },
  area: { maxTesto: 4_000, params: { max_tokens: 256, thinking: { type: "disabled" }, output_config: { effort: "low" } } },
};

function intestazioni(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINI.includes(o) ? o : ORIGINI[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}
const risposta = (req: Request, stato: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status: stato, headers: intestazioni(req) });

async function utenteAmmesso(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data, error } = await sb.auth.getUser(auth.slice(7));
  return !error && (data.user?.email || "").toLowerCase() === EMAIL_AMMESSA;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: intestazioni(req) });
  if (req.method !== "POST") return risposta(req, 405, { errore: "metodo" });

  try {
    if (!(await utenteAmmesso(req))) return risposta(req, 403, { errore: "utente" });

    let corpo: { compito?: unknown; testo?: unknown };
    try { corpo = await req.json(); } catch { return risposta(req, 400, { errore: "json" }); }
    const compito = typeof corpo.compito === "string" ? corpo.compito : "";
    const chiave = Deno.env.get("ANTHROPIC_API_KEY") || "";

    if (compito === "stato") return risposta(req, 200, { pronto: !!chiave, modello: MODELLO });

    const conf = COMPITI[compito];
    if (!conf) return risposta(req, 400, { errore: "compito" });
    const testo = typeof corpo.testo === "string" ? corpo.testo.trim() : "";
    if (!testo || testo.length > conf.maxTesto) return risposta(req, 400, { errore: "testo" });
    if (!chiave) return risposta(req, 503, { errore: "manca_segreto" });

    const client = new Anthropic({ apiKey: chiave });
    const msg = await client.messages.create({
      model: MODELLO,
      messages: [{ role: "user", content: testo }],
      ...conf.params,
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (msg.stop_reason === "refusal") return risposta(req, 422, { errore: "rifiuto" });
    const uscita = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return risposta(req, 200, { testo: uscita, troncato: msg.stop_reason === "max_tokens" });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error("anthropic", e.status, e.message);
      return risposta(req, 502, { errore: "anthropic", stato: e.status ?? null });
    }
    console.error("claude", e);
    return risposta(req, 500, { errore: "interno" });
  }
});
