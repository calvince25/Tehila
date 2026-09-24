const legacyImageMap: Record<string, string> = {
  "pink-orbit_e98112f2.jpg": "/studio-assets/pink-orbit.jpg",
  "maker-at-work_575171a1.jpg": "/studio-assets/maker-at-work.jpg",
  "violet-orbit_ef8b1733.jpg": "/studio-assets/violet-orbit.jpg",
  "process-closeup_eccb9460.jpg": "/studio-assets/process-closeup.jpg",
  "woven-sun_b8375056.jpg": "/studio-assets/woven-sun.jpg",
  "textile-landscape_bcec7a53.jpg": "/studio-assets/textile-landscape.jpg",
  "studio-grid_499fcdaf.jpg": "/studio-assets/studio-grid.jpg",
};

/**
 * Resolve legacy bundled image names and make a database-backed image URL
 * immutable for the lifetime of its database version. Uploaded files already
 * receive unique storage keys; this version parameter also protects any
 * provider/CDN cache when an older URL is retained by existing data.
 */
export function resolveStudioImage(url: string | undefined, updatedAt?: string | Date) {
  if (!url) return url;
  const key = url.split("/").pop() ?? "";
  const resolved = legacyImageMap[key] ?? url;
  if (!resolved || resolved.startsWith("/studio-assets/") || !updatedAt) return resolved;
  const version = new Date(updatedAt).getTime();
  if (!Number.isFinite(version)) return resolved;
  return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
}
