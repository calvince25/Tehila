import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, defaultAdminProcedure, publicProcedure, router } from "./_core/trpc";
import { cmsRouter, contentRouter } from "./routers/cms";
import { createLocalUser, createOrder, deleteOrder, deleteUserAccount, getUserByEmail, listAdminUsers, listOrders, setUserApproval, updateOrderStatus } from "./db";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";

const safeUser = (user: { id: number; name: string | null; email: string | null; role: "user" | "admin"; isApproved: number; isDefaultAdmin: number }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isApproved: user.isApproved,
  isDefaultAdmin: user.isDefaultAdmin,
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(320),
      password: z.string().min(8).max(200),
    })).mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      if (await getUserByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const user = await createLocalUser({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password) });
      return { ...safeUser(user), message: user.isDefaultAdmin ? "Registration complete. You are the default admin; you can now log in." : "Registration complete. The default admin must approve your account before you can log in." };
    }),
    login: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(normalizeEmail(input.email));
      if (!user || user.loginMethod !== "password" || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      }
      if (user.isApproved !== 1) throw new TRPCError({ code: "FORBIDDEN", message: "Your account is awaiting approval from the default admin." });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.email || "User", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return safeUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  users: router({
    list: adminProcedure.query(() => listAdminUsers()),
    approve: defaultAdminProcedure.input(z.object({ id: z.number().int(), isApproved: z.number().int().min(0).max(1) })).mutation(({ input }) => setUserApproval(input.id, input.isApproved)),
    delete: defaultAdminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteUserAccount(input.id)),
  }),
  orders: router({
    create: publicProcedure.input(z.object({
      customerName: z.string().trim().min(2).max(160),
      phone: z.string().trim().min(7).max(40),
      email: z.string().trim().email().max(320).optional().or(z.literal("")),
      deliveryMethod: z.enum(["Pick-up Mtaani", "Delivery elsewhere in Kenya", "Studio pickup"]),
      area: z.string().trim().min(2).max(180),
      address: z.string().trim().min(5).max(5000),
      notes: z.string().max(2000).optional(),
      items: z.array(z.object({ id: z.number().int().optional(), title: z.string().min(1).max(180), size: z.string().max(80), price: z.string().max(40), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
      subtotal: z.string().min(1).max(40),
    })).mutation(async ({ input }) => {
      const reference = `TF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      await createOrder({ ...input, email: input.email || null, notes: input.notes || null, items: JSON.stringify(input.items), reference, status: "new_enquiry" });
      return { reference };
    }),
    list: adminProcedure.query(() => listOrders()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int(), status: z.enum(["new_enquiry", "awaiting_confirmation", "reserved", "payment_pending", "paid", "preparing", "ready_for_pickup", "dispatched", "delivered", "cancelled"]) })).mutation(({ input }) => updateOrderStatus(input.id, input.status)),
    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteOrder(input.id)),
  }),
  content: contentRouter,
  cms: cmsRouter,
});

export type AppRouter = typeof appRouter;
