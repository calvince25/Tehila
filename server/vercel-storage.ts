import "dotenv/config";
type VercelRequest = { query: Record<string, string | string[] | undefined> };
type VercelResponse = { status: (code: number) => VercelResponse; send: (body: string) => VercelResponse; redirect: (code: number, url: string) => VercelResponse };

export default async function storageHandler(req: VercelRequest, res: VercelResponse) {
  const key = typeof req.query.path === "string" ? req.query.path : "";
  const forgeBase = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!key) return res.status(400).send("Missing storage key");
  if (!forgeBase || !forgeKey) return res.status(500).send("Storage proxy not configured");

  try {
    const url = new URL("v1/storage/presign/get", `${forgeBase}/`);
    url.searchParams.set("path", key);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${forgeKey}` } });
    if (!response.ok) return res.status(502).send("Storage backend error");
    const payload = (await response.json()) as { url?: string };
    if (!payload.url) return res.status(502).send("Empty signed URL from backend");
    return res.redirect(307, payload.url);
  } catch (error) {
    console.error("[VercelStorage] failed", error);
    return res.status(502).send("Storage proxy error");
  }
}
