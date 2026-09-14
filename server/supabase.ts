import { JournalPost } from "./supabase-types";

type JournalInput = Omit<JournalPost, "id" | "updated_at"> & { updated_at?: string };
type SupabaseError = { message?: string; hint?: string; details?: string };

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase is not configured for the journal CMS.");
  return { url: url.replace(/\/$/, ""), publishableKey, serviceRoleKey };
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}, protectedRequest = false): Promise<T> {
  const { url, publishableKey, serviceRoleKey } = getConfig();
  const key = protectedRequest ? serviceRoleKey : publishableKey;
  if (!key) throw new Error("Supabase service-role key is not configured for protected journal operations.");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as SupabaseError;
    throw new Error(error.message ?? `Supabase request failed with ${response.status}.`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}

export async function listPublishedJournalPosts() {
  return supabaseRequest<JournalPost[]>("journal_posts?is_published=eq.true&order=published_at.desc");
}

export async function getJournalPostBySlug(slug: string) {
  const rows = await supabaseRequest<JournalPost[]>(`journal_posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`);
  return rows[0] ?? null;
}

export async function listAdminJournalPosts() {
  return supabaseRequest<JournalPost[]>("journal_posts?order=published_at.desc", {}, true);
}

export async function createJournalPost(input: JournalInput) {
  const rows = await supabaseRequest<JournalPost[]>("journal_posts", { method: "POST", body: JSON.stringify(input) }, true);
  return rows[0];
}

export async function updateJournalPost(id: number, input: Partial<JournalInput>) {
  const rows = await supabaseRequest<JournalPost[]>(`journal_posts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ ...input, updated_at: new Date().toISOString() }) }, true);
  return rows[0];
}

export async function deleteJournalPost(id: number) {
  await supabaseRequest<JournalPost[]>(`journal_posts?id=eq.${id}`, { method: "DELETE" }, true);
  return id;
}

export { getConfig as getSupabaseConfig };
