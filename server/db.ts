import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  canvases,
  InsertCanvas,
  InsertPortfolioImage,
  InsertStudioEvent,
  InsertUser,
  portfolioImages,
  studioEvents,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getUserByEmail(input.email);
  if (existing) throw new Error("An account with this email already exists.");
  const localUsers = await db.select({ id: users.id }).from(users).where(eq(users.loginMethod, "password")).limit(1);
  const isFirst = localUsers.length === 0;
  const openId = `local_${crypto.randomUUID()}`;
  const result = await db.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    loginMethod: "password",
    role: isFirst ? "admin" : "user",
    isApproved: isFirst ? 1 : 0,
    isDefaultAdmin: isFirst ? 1 : 0,
    lastSignedIn: new Date(),
  });
  return { id: Number(result[0].insertId), openId, name: input.name, email: input.email, role: isFirst ? "admin" as const : "user" as const, isApproved: isFirst ? 1 : 0, isDefaultAdmin: isFirst ? 1 : 0 };
}

export async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, isApproved: users.isApproved, isDefaultAdmin: users.isDefaultAdmin, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt));
}

export async function setUserApproval(id: number, isApproved: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await db.select({ isDefaultAdmin: users.isDefaultAdmin }).from(users).where(eq(users.id, id)).limit(1);
  if (target[0]?.isDefaultAdmin && isApproved === 0) throw new Error("The default admin must remain approved.");
  await db.update(users).set({ isApproved, role: isApproved === 1 ? "admin" : "user" }).where(eq(users.id, id));
  return id;
}

export async function deleteUserAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await db.select({ isDefaultAdmin: users.isDefaultAdmin }).from(users).where(eq(users.id, id)).limit(1);
  if (target[0]?.isDefaultAdmin) throw new Error("The default admin account cannot be deleted.");
  await db.delete(users).where(eq(users.id, id));
  return id;
}

export async function listCanvases() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(canvases).orderBy(asc(canvases.sortOrder), desc(canvases.createdAt));
}

export async function listPublishedEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studioEvents).where(eq(studioEvents.isPublished, 1)).orderBy(asc(studioEvents.startAt));
}

export async function listPortfolioImages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioImages).orderBy(asc(portfolioImages.sortOrder), asc(portfolioImages.id));
}

export async function listAdminContent() {
  const db = await getDb();
  if (!db) return { canvases: [], events: [], images: [] };
  const [canvasRows, eventRows, imageRows] = await Promise.all([
    db.select().from(canvases).orderBy(asc(canvases.sortOrder), desc(canvases.createdAt)),
    db.select().from(studioEvents).orderBy(asc(studioEvents.startAt)),
    db.select().from(portfolioImages).orderBy(asc(portfolioImages.sortOrder), asc(portfolioImages.id)),
  ]);
  return { canvases: canvasRows, events: eventRows, images: imageRows };
}

export async function createCanvas(input: InsertCanvas) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(canvases).values(input); return Number(result[0].insertId); }
export async function updateCanvas(id: number, input: Partial<InsertCanvas>) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(canvases).set(input).where(eq(canvases.id, id)); return id; }
export async function deleteCanvas(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(canvases).where(eq(canvases.id, id)); return id; }
export async function createStudioEvent(input: InsertStudioEvent) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(studioEvents).values(input); return Number(result[0].insertId); }
export async function updateStudioEvent(id: number, input: Partial<InsertStudioEvent>) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(studioEvents).set(input).where(eq(studioEvents.id, id)); return id; }
export async function deleteStudioEvent(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(studioEvents).where(eq(studioEvents.id, id)); return id; }
export async function createPortfolioImage(input: InsertPortfolioImage) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(portfolioImages).values(input); return Number(result[0].insertId); }
export async function updatePortfolioImage(id: number, input: Partial<InsertPortfolioImage>) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(portfolioImages).set(input).where(eq(portfolioImages.id, id)); return id; }
export async function deletePortfolioImage(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(portfolioImages).where(eq(portfolioImages.id, id)); return id; }
