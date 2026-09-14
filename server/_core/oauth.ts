import type { Express, Request, Response } from "express";

/**
 * Local email/password registration is the only account creation path for this
 * studio. Keep the legacy endpoint explicit so an old OAuth link cannot bypass
 * the registration and admin-approval workflow.
 */
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.status(403).json({ error: "OAuth sign-in is disabled. Register for a Threaded Forms account first." });
  });
}
