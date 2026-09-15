import type { Express } from "express";
import { listPublishedJournalPosts } from "./supabase";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}

function getSiteUrl(req: { protocol: string; get: (name: string) => string | undefined }) {
  return (process.env.SITE_URL || `${req.protocol}://${req.get("host") || "threadedforms.studio"}`).replace(/\/$/, "");
}

export function registerSeoRoutes(app: Express) {
  app.get(["/commission", "/commissions"], (_req, res) => res.redirect(301, "/contact"));
  app.get("/robots.txt", (req, res) => {
    const siteUrl = getSiteUrl(req);
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    const siteUrl = getSiteUrl(req);
    const today = new Date().toISOString().slice(0, 10);
    const urls = [
      { loc: siteUrl + "/", lastmod: today },
      { loc: siteUrl + "/contact", lastmod: today },
    ];
    try {
      const posts = await listPublishedJournalPosts();
      posts.forEach(post => urls.push({ loc: `${siteUrl}/journal/${encodeURIComponent(post.slug)}`, lastmod: post.updated_at.slice(0, 10) }));
    } catch (error) {
      console.warn("[SEO] Could not load journal URLs for sitemap:", error);
    }
    const body = urls.map(url => `<url><loc>${escapeXml(url.loc)}</loc><lastmod>${escapeXml(url.lastmod)}</lastmod></url>`).join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });
}
