import { decrypt } from "@/lib/encrypt";

/** Resolve a dot-notation path from an object, e.g. "data.rows" or "results" */
function resolvePath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export interface FetchResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

export async function fetchDataSource(opts: {
  url: string;
  method: string;
  headersEnc?: string | null;
  bodyTemplate?: string | null;
  jsonPath?: string | null;
}): Promise<FetchResult> {
  const { url, method, headersEnc, bodyTemplate, jsonPath } = opts;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (headersEnc) {
    try {
      const decrypted = decrypt(headersEnc);
      const extra = JSON.parse(decrypted) as Record<string, string>;
      Object.assign(headers, extra);
    } catch {
      return { ok: false, error: "Fehler beim Entschlüsseln der Headers" };
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body: bodyTemplate && method.toUpperCase() !== "GET" ? bodyTemplate : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (!res.ok) {
    return { ok: false, statusCode: res.status, error: `HTTP ${res.status} ${res.statusText}` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "Antwort ist kein gültiges JSON" };
  }

  const extracted = jsonPath ? resolvePath(json, jsonPath) : json;
  return { ok: true, data: extracted, statusCode: res.status };
}
