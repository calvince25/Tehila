import { describe, expect, it } from "vitest";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";

describe("local account password security", () => {
  it("hashes passwords with a unique salted digest and verifies the original", async () => {
    const first = await hashPassword("threaded-secret-123");
    const second = await hashPassword("threaded-secret-123");

    expect(first).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    expect(second).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    expect(first).not.toBe(second);
    await expect(verifyPassword("threaded-secret-123", first)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", first)).resolves.toBe(false);
  });

  it("normalizes email addresses before account lookup", () => {
    expect(normalizeEmail("  Tehila@Example.COM ")).toBe("tehila@example.com");
  });
});
