// server/app.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", (_req, res) => {
    res.status(403).json({ error: "OAuth sign-in is disabled. Register for a Threaded Forms account first." });
  });
}

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/routers.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/db.ts
import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var canvases = mysqlTable("canvases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  kind: varchar("kind", { length: 120 }).notNull(),
  price: varchar("price", { length: 40 }).notNull(),
  size: varchar("size", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["available", "one_of_one", "coming_soon", "sold"]).default("available").notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var studioEvents = mysqlTable("studioEvents", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var portfolioImages = mysqlTable("portfolioImages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  altText: varchar("altText", { length: 240 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}
async function createLocalUser(input) {
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
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return { id: Number(result[0].insertId), openId, name: input.name, email: input.email, role: isFirst ? "admin" : "user", isApproved: isFirst ? 1 : 0, isDefaultAdmin: isFirst ? 1 : 0 };
}
async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, isApproved: users.isApproved, isDefaultAdmin: users.isDefaultAdmin, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt));
}
async function setUserApproval(id, isApproved) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await db.select({ isDefaultAdmin: users.isDefaultAdmin }).from(users).where(eq(users.id, id)).limit(1);
  if (target[0]?.isDefaultAdmin && isApproved === 0) throw new Error("The default admin must remain approved.");
  await db.update(users).set({ isApproved, role: isApproved === 1 ? "admin" : "user" }).where(eq(users.id, id));
  return id;
}
async function deleteUserAccount(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await db.select({ isDefaultAdmin: users.isDefaultAdmin }).from(users).where(eq(users.id, id)).limit(1);
  if (target[0]?.isDefaultAdmin) throw new Error("The default admin account cannot be deleted.");
  await db.delete(users).where(eq(users.id, id));
  return id;
}
async function listCanvases() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(canvases).orderBy(asc(canvases.sortOrder), desc(canvases.createdAt));
}
async function listPublishedEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studioEvents).where(eq(studioEvents.isPublished, 1)).orderBy(asc(studioEvents.startAt));
}
async function listPortfolioImages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioImages).orderBy(asc(portfolioImages.sortOrder), asc(portfolioImages.id));
}
async function listAdminContent() {
  const db = await getDb();
  if (!db) return { canvases: [], events: [], images: [] };
  const [canvasRows, eventRows, imageRows] = await Promise.all([
    db.select().from(canvases).orderBy(asc(canvases.sortOrder), desc(canvases.createdAt)),
    db.select().from(studioEvents).orderBy(asc(studioEvents.startAt)),
    db.select().from(portfolioImages).orderBy(asc(portfolioImages.sortOrder), asc(portfolioImages.id))
  ]);
  return { canvases: canvasRows, events: eventRows, images: imageRows };
}
async function createCanvas(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(canvases).values(input);
  return Number(result[0].insertId);
}
async function updateCanvas(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(canvases).set(input).where(eq(canvases.id, id));
  return id;
}
async function deleteCanvas(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(canvases).where(eq(canvases.id, id));
  return id;
}
async function createStudioEvent(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(studioEvents).values(input);
  return Number(result[0].insertId);
}
async function updateStudioEvent(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(studioEvents).set(input).where(eq(studioEvents.id, id));
  return id;
}
async function deleteStudioEvent(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(studioEvents).where(eq(studioEvents.id, id));
  return id;
}
async function createPortfolioImage(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(portfolioImages).values(input);
  return Number(result[0].insertId);
}
async function updatePortfolioImage(id, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(portfolioImages).set(input).where(eq(portfolioImages.id, id));
  return id;
}
async function deletePortfolioImage(id) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
  return id;
}

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId || "local-auth",
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    if (user.loginMethod !== "password") {
      throw ForbiddenError("Please register for a local Threaded Forms account first");
    }
    if (user.isApproved !== 1) {
      throw ForbiddenError("This account is awaiting admin approval");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var defaultAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" || ctx.user.isApproved !== 1) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/cms.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/supabase.ts
function getConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase is not configured for the journal CMS.");
  return { url: url.replace(/\/$/, ""), publishableKey, serviceRoleKey };
}
async function supabaseRequest(path, init = {}, protectedRequest = false) {
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
      ...init.headers ?? {}
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Supabase request failed with ${response.status}.`);
  }
  const text2 = await response.text();
  return text2 ? JSON.parse(text2) : [];
}
async function listPublishedJournalPosts() {
  return supabaseRequest("journal_posts?is_published=eq.true&order=published_at.desc");
}
async function getJournalPostBySlug(slug) {
  const rows = await supabaseRequest(`journal_posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`);
  return rows[0] ?? null;
}
async function listAdminJournalPosts() {
  return supabaseRequest("journal_posts?order=published_at.desc", {}, true);
}
async function createJournalPost(input) {
  const rows = await supabaseRequest("journal_posts", { method: "POST", body: JSON.stringify(input) }, true);
  return rows[0];
}
async function updateJournalPost(id, input) {
  const rows = await supabaseRequest(`journal_posts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ ...input, updated_at: (/* @__PURE__ */ new Date()).toISOString() }) }, true);
  return rows[0];
}
async function deleteJournalPost(id) {
  await supabaseRequest(`journal_posts?id=eq.${id}`, { method: "DELETE" }, true);
  return id;
}
async function createCommissionEnquiry(input) {
  const rows = await supabaseRequest("commission_enquiries", { method: "POST", body: JSON.stringify(input) }, true);
  return rows[0];
}
async function listCommissionEnquiries() {
  return supabaseRequest("commission_enquiries?order=created_at.desc", {}, true);
}
async function deleteCommissionEnquiry(id) {
  await supabaseRequest(`commission_enquiries?id=eq.${id}`, { method: "DELETE" }, true);
  return id;
}

// server/routers/cms.ts
var statusSchema = z2.enum(["available", "one_of_one", "coming_soon", "sold"]);
var eventTypeSchema = z2.enum(["studio_visit", "group_exhibition", "workshop"]);
var accentSchema = z2.enum(["coral", "sage", "plum"]);
var canvasFields = {
  title: z2.string().min(1).max(180),
  kind: z2.string().min(1).max(120),
  price: z2.string().min(1).max(40),
  size: z2.string().min(1).max(80),
  status: statusSchema,
  description: z2.string().min(1),
  imageUrl: z2.string().min(1),
  imageKey: z2.string().max(512).optional().nullable(),
  sortOrder: z2.number().int().default(0)
};
var eventFields = {
  title: z2.string().min(1).max(180),
  type: eventTypeSchema,
  description: z2.string().min(1),
  venue: z2.string().min(1).max(180),
  city: z2.string().min(1).max(180),
  startAt: z2.coerce.date(),
  endAt: z2.coerce.date(),
  accent: accentSchema,
  isPublished: z2.number().int().min(0).max(1).default(1)
};
var imageFields = {
  name: z2.string().min(1).max(120),
  label: z2.string().min(1).max(160),
  altText: z2.string().min(1).max(240),
  imageUrl: z2.string().min(1),
  imageKey: z2.string().max(512).optional().nullable(),
  sortOrder: z2.number().int().default(0)
};
var journalFields = {
  slug: z2.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z2.string().min(1).max(180),
  excerpt: z2.string().min(1).max(320),
  body: z2.string().min(1),
  category: z2.string().min(1).max(120),
  imageUrl: z2.string().min(1),
  imageKey: z2.string().max(512).optional().nullable(),
  altText: z2.string().min(1).max(240),
  publishedAt: z2.coerce.date(),
  isPublished: z2.boolean().default(true),
  seoTitle: z2.string().max(180).optional().nullable(),
  seoDescription: z2.string().max(320).optional().nullable(),
  authorName: z2.string().min(1).max(120).default("Tehila")
};
var uploadInput = z2.object({
  fileName: z2.string().min(1).max(180),
  contentType: z2.string().regex(/^image\//),
  data: z2.string().min(1)
});
var contentRouter = router({
  all: publicProcedure.query(async () => {
    const [canvases2, events, images, journal] = await Promise.all([
      listCanvases(),
      listPublishedEvents(),
      listPortfolioImages(),
      listPublishedJournalPosts()
    ]);
    return { canvases: canvases2, events, images, journal };
  }),
  journalBySlug: publicProcedure.input(z2.object({ slug: z2.string().min(1) })).query(({ input }) => getJournalPostBySlug(input.slug)),
  submitCommission: publicProcedure.input(z2.object({
    name: z2.string().min(1).max(160),
    email: z2.string().email().max(320),
    project_type: z2.string().min(1).max(180),
    room: z2.string().max(180).optional().nullable(),
    size: z2.string().max(120).optional().nullable(),
    budget: z2.string().max(120).optional().nullable(),
    timeline: z2.string().max(180).optional().nullable(),
    message: z2.string().min(1).max(5e3)
  })).mutation(({ input }) => createCommissionEnquiry({ ...input, room: input.room ?? null, size: input.size ?? null, budget: input.budget ?? null, timeline: input.timeline ?? null }))
});
var cmsRouter = router({
  adminCheck: adminProcedure.query(() => ({ allowed: true })),
  all: adminProcedure.query(async () => {
    const local = await listAdminContent();
    const [journal, enquiries] = await Promise.all([
      listAdminJournalPosts().catch((error) => {
        console.warn("[CMS] Journal read unavailable:", error);
        return [];
      }),
      listCommissionEnquiries().catch((error) => {
        console.warn("[CMS] Enquiry read unavailable:", error);
        return [];
      })
    ]);
    return { ...local, journal, enquiries };
  }),
  deleteEnquiry: adminProcedure.input(z2.object({ id: z2.number().int() })).mutation(({ input }) => deleteCommissionEnquiry(input.id)),
  uploadImage: adminProcedure.input(uploadInput).mutation(async ({ input, ctx }) => {
    if (input.data.length > 8e6) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Please upload an image smaller than 6 MB." });
    }
    const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const buffer = Buffer.from(input.data, "base64");
    return storagePut(`threaded-forms/${ctx.user.id}/${Date.now()}-${safeName}`, buffer, input.contentType);
  }),
  createCanvas: adminProcedure.input(z2.object(canvasFields)).mutation(({ input }) => createCanvas(input)),
  updateCanvas: adminProcedure.input(z2.object({ id: z2.number().int(), data: z2.object(canvasFields).partial() })).mutation(({ input }) => updateCanvas(input.id, input.data)),
  deleteCanvas: adminProcedure.input(z2.object({ id: z2.number().int() })).mutation(({ input }) => deleteCanvas(input.id)),
  createEvent: adminProcedure.input(z2.object(eventFields)).mutation(({ input }) => createStudioEvent(input)),
  updateEvent: adminProcedure.input(z2.object({ id: z2.number().int(), data: z2.object(eventFields).partial() })).mutation(({ input }) => updateStudioEvent(input.id, input.data)),
  deleteEvent: adminProcedure.input(z2.object({ id: z2.number().int() })).mutation(({ input }) => deleteStudioEvent(input.id)),
  createImage: adminProcedure.input(z2.object(imageFields)).mutation(({ input }) => createPortfolioImage(input)),
  updateImage: adminProcedure.input(z2.object({ id: z2.number().int(), data: z2.object(imageFields).partial() })).mutation(({ input }) => updatePortfolioImage(input.id, input.data)),
  deleteImage: adminProcedure.input(z2.object({ id: z2.number().int() })).mutation(({ input }) => deletePortfolioImage(input.id)),
  createJournal: adminProcedure.input(z2.object(journalFields)).mutation(({ input }) => createJournalPost({
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    category: input.category,
    image_url: input.imageUrl,
    image_key: input.imageKey ?? null,
    alt_text: input.altText,
    published_at: input.publishedAt.toISOString(),
    is_published: input.isPublished,
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
    author_name: input.authorName
  })),
  updateJournal: adminProcedure.input(z2.object({ id: z2.number().int(), data: z2.object(journalFields).partial() })).mutation(({ input }) => updateJournalPost(input.id, {
    ...input.data.slug !== void 0 ? { slug: input.data.slug } : {},
    ...input.data.title !== void 0 ? { title: input.data.title } : {},
    ...input.data.excerpt !== void 0 ? { excerpt: input.data.excerpt } : {},
    ...input.data.body !== void 0 ? { body: input.data.body } : {},
    ...input.data.category !== void 0 ? { category: input.data.category } : {},
    ...input.data.imageUrl !== void 0 ? { image_url: input.data.imageUrl } : {},
    ...input.data.imageKey !== void 0 ? { image_key: input.data.imageKey ?? null } : {},
    ...input.data.altText !== void 0 ? { alt_text: input.data.altText } : {},
    ...input.data.publishedAt !== void 0 ? { published_at: input.data.publishedAt.toISOString() } : {},
    ...input.data.isPublished !== void 0 ? { is_published: input.data.isPublished } : {},
    ...input.data.seoTitle !== void 0 ? { seo_title: input.data.seoTitle ?? null } : {},
    ...input.data.seoDescription !== void 0 ? { seo_description: input.data.seoDescription ?? null } : {},
    ...input.data.authorName !== void 0 ? { author_name: input.data.authorName } : {}
  })),
  deleteJournal: adminProcedure.input(z2.object({ id: z2.number().int() })).mutation(({ input }) => deleteJournalPost(input.id))
});

// server/password.ts
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
var scrypt = promisify(nodeScrypt);
var KEY_LENGTH = 64;
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}
async function verifyPassword(password, storedHash) {
  const [algorithm, salt, keyHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// server/routers.ts
var safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isApproved: user.isApproved,
  isDefaultAdmin: user.isDefaultAdmin
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(z3.object({
      name: z3.string().trim().min(2).max(120),
      email: z3.string().trim().email().max(320),
      password: z3.string().min(8).max(200)
    })).mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      if (await getUserByEmail(email)) throw new TRPCError4({ code: "CONFLICT", message: "An account with this email already exists." });
      const user = await createLocalUser({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password) });
      return { ...safeUser(user), message: user.isDefaultAdmin ? "Registration complete. You are the default admin; you can now log in." : "Registration complete. The default admin must approve your account before you can log in." };
    }),
    login: publicProcedure.input(z3.object({ email: z3.string().trim().email().max(320), password: z3.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(normalizeEmail(input.email));
      if (!user || user.loginMethod !== "password" || !user.passwordHash || !await verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError4({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      }
      if (user.isApproved !== 1) throw new TRPCError4({ code: "FORBIDDEN", message: "Your account is awaiting approval from the default admin." });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.email || "User", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return safeUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  users: router({
    list: adminProcedure.query(() => listAdminUsers()),
    approve: defaultAdminProcedure.input(z3.object({ id: z3.number().int(), isApproved: z3.number().int().min(0).max(1) })).mutation(({ input }) => setUserApproval(input.id, input.isApproved)),
    delete: defaultAdminProcedure.input(z3.object({ id: z3.number().int() })).mutation(({ input }) => deleteUserAccount(input.id))
  }),
  content: contentRouter,
  cms: cmsRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/seo.ts
function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}
function getSiteUrl(req) {
  return (process.env.SITE_URL || `${req.protocol}://${req.get("host") || "threadedforms.studio"}`).replace(/\/$/, "");
}
function registerSeoRoutes(app) {
  app.get("/robots.txt", (req, res) => {
    const siteUrl = getSiteUrl(req);
    res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: ${siteUrl}/sitemap.xml
`);
  });
  app.get("/sitemap.xml", async (req, res) => {
    const siteUrl = getSiteUrl(req);
    const urls = [{ loc: siteUrl + "/", lastmod: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) }];
    try {
      const posts = await listPublishedJournalPosts();
      posts.forEach((post) => urls.push({ loc: `${siteUrl}/journal/${encodeURIComponent(post.slug)}`, lastmod: post.updated_at.slice(0, 10) }));
    } catch (error) {
      console.warn("[SEO] Could not load journal URLs for sitemap:", error);
    }
    const body = urls.map((url) => `<url><loc>${escapeXml(url.loc)}</loc><lastmod>${escapeXml(url.lastmod)}</lastmod></url>`).join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });
}

// server/app.ts
function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSeoRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}
var app_default = createApp();

// server/vercel-entry.ts
var vercel_entry_default = app_default;
export {
  vercel_entry_default as default
};
