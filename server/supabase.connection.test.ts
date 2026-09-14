import { describe, expect, it } from "vitest";
import { createCommissionEnquiry, deleteCommissionEnquiry, getSupabaseConfig, listAdminJournalPosts, listCommissionEnquiries, listPublishedJournalPosts } from "./supabase";

describe("Supabase journal and enquiry connection", () => {
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

  it("accepts a public enquiry and removes it through the protected path", async () => {
    const enquiry = await createCommissionEnquiry({
      name: "Automated test enquiry",
      email: "test@example.com",
      project_type: "Test commission",
      room: null,
      size: null,
      budget: null,
      timeline: null,
      message: "This record should be deleted by the integration test.",
    });
    expect(enquiry?.id).toBeTypeOf("number");
    const adminRows = await listCommissionEnquiries();
    expect(adminRows.some(row => row.id === enquiry?.id)).toBe(true);
    await deleteCommissionEnquiry(enquiry!.id);
  });
});
