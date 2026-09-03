export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase persistence is not configured.");
    this.name = "SupabaseConfigurationError";
  }
}

export interface SupabaseResponse<T> {
  data: T;
  error: string | null;
}

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new SupabaseConfigurationError();
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<SupabaseResponse<T>> {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = (await response.text()) as string;
  if (!response.ok) return { data: null as T, error: body || response.statusText };
  return { data: body ? (JSON.parse(body) as T) : (null as T), error: null };
}
