import { describe, expect, it } from "vitest";
import { getSupabaseConfig, listAdminJournalPosts, listPublishedJournalPosts } from "./supabase";

describe("Supabase journal connection", () => {
  it("accepts the configured project URL and public key", () => {
    const config = getSupabaseConfig();
    expect(config.url).toBe("https://vcgifbohrhkqifzjopws.supabase.co");
    expect(config.publishableKey).toMatch(/^(sb_publishable_|eyJ)/);
  });

  it("can read the public journal collection", async () => {
    const posts = await listPublishedJournalPosts();
    expect(posts.length).toBeGreaterThanOrEqual(3);
  });

  it("can read the protected admin journal collection with the service role", async () => {
    const config = getSupabaseConfig();
    expect(config.serviceRoleKey).toMatch(/^eyJ/);
    const posts = await listAdminJournalPosts();
    expect(posts.length).toBeGreaterThanOrEqual(3);
  });
});
