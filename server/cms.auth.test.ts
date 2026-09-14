import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: AuthenticatedUser["role"]): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-sample-user`,
      email: `${role}@example.com`,
      name: role === "admin" ? "Tehila" : "Visitor",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("cms access control", () => {
  it("rejects authenticated non-admin users from the CMS", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.cms.all()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows the studio admin to access the CMS workspace", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.cms.adminCheck()).resolves.toEqual({ allowed: true });
  });
});
