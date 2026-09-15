import { JournalPost } from "./supabase-types";

type JournalInput = Omit<JournalPost, "id" | "updated_at"> & { updated_at?: string };
type SupabaseError = { message?: string; hint?: string; details?: string };
export type CommissionEnquiry = { id: number; created_at: string; name: string; email: string; project_type: string; room: string | null; size: string | null; budget: string | null; timeline: string | null; message: string; status: string };
export type CommissionEnquiryInput = Omit<CommissionEnquiry, "id" | "created_at" | "status">;
export type NewsletterSubscriber = { id: number; email: string; subscribed_at: string; source: string };

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

export async function listPublishedJournalPosts() { return supabaseRequest<JournalPost[]>("journal_posts?is_published=eq.true&order=published_at.desc"); }
export async function getJournalPostBySlug(slug: string) { const rows = await supabaseRequest<JournalPost[]>(`journal_posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`); return rows[0] ?? null; }
export async function listAdminJournalPosts() { return supabaseRequest<JournalPost[]>("journal_posts?order=published_at.desc", {}, true); }
export async function createJournalPost(input: JournalInput) { const rows = await supabaseRequest<JournalPost[]>("journal_posts", { method: "POST", body: JSON.stringify(input) }, true); return rows[0]; }
export async function updateJournalPost(id: number, input: Partial<JournalInput>) { const rows = await supabaseRequest<JournalPost[]>(`journal_posts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ ...input, updated_at: new Date().toISOString() }) }, true); return rows[0]; }
export async function deleteJournalPost(id: number) { await supabaseRequest<JournalPost[]>(`journal_posts?id=eq.${id}`, { method: "DELETE" }, true); return id; }

export async function createCommissionEnquiry(input: CommissionEnquiryInput) {
  const rows = await supabaseRequest<CommissionEnquiry[]>("commission_enquiries", { method: "POST", body: JSON.stringify(input) }, true);
  return rows[0];
}
export async function listCommissionEnquiries() { return supabaseRequest<CommissionEnquiry[]>("commission_enquiries?order=created_at.desc", {}, true); }
export async function deleteCommissionEnquiry(id: number) { await supabaseRequest<CommissionEnquiry[]>(`commission_enquiries?id=eq.${id}`, { method: "DELETE" }, true); return id; }

export async function subscribeToNewsletter(email: string) {
  const rows = await supabaseRequest<NewsletterSubscriber[]>("newsletter_subscribers", { method: "POST", body: JSON.stringify({ email, source: "footer" }), headers: { Prefer: "return=representation,resolution=merge-duplicates" } });
  return rows[0] ?? { email };
}
export async function listNewsletterSubscribers() { return supabaseRequest<NewsletterSubscriber[]>("newsletter_subscribers?order=subscribed_at.desc", {}, true); }
export async function deleteNewsletterSubscriber(id: number) { await supabaseRequest<NewsletterSubscriber[]>(`newsletter_subscribers?id=eq.${id}`, { method: "DELETE" }, true); return id; }

export { getConfig as getSupabaseConfig };
