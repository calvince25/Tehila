import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  isApproved: int("isApproved").default(0).notNull(),
  isDefaultAdmin: int("isDefaultAdmin").default(0).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const canvases = mysqlTable("canvases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  kind: varchar("kind", { length: 120 }).notNull(),
  price: varchar("price", { length: 40 }).notNull(),
  size: varchar("size", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["available", "one_of_one", "reserved", "coming_soon", "sold"]).default("available").notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studioEvents = mysqlTable("studioEvents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  type: mysqlEnum("type", ["studio_visit", "group_exhibition", "workshop"]).notNull(),
  description: text("description").notNull(),
  venue: varchar("venue", { length: 180 }).notNull(),
  city: varchar("city", { length: 180 }).notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  accent: mysqlEnum("accent", ["coral", "sage", "plum"]).default("coral").notNull(),
  isPublished: int("isPublished").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const portfolioImages = mysqlTable("portfolioImages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  altText: varchar("altText", { length: 240 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 40 }).notNull().unique(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  email: varchar("email", { length: 320 }),
  deliveryMethod: varchar("deliveryMethod", { length: 80 }).notNull(),
  area: varchar("area", { length: 180 }).notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  items: text("items").notNull(),
  subtotal: varchar("subtotal", { length: 40 }).notNull(),
  status: varchar("status", { length: 40 }).default("new_enquiry").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Canvas = typeof canvases.$inferSelect;
export type InsertCanvas = typeof canvases.$inferInsert;
export type StudioEvent = typeof studioEvents.$inferSelect;
export type InsertStudioEvent = typeof studioEvents.$inferInsert;
export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = typeof portfolioImages.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
