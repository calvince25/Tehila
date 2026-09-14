import { useEffect } from "react";

export const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://threadedforms.studio");

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function Seo({ title, description, path = "/", image, type = "website", jsonLd }: { title: string; description: string; path?: string; image?: string; type?: "website" | "article"; jsonLd?: Record<string, unknown> | Record<string, unknown>[] }) {
  useEffect(() => {
    const canonicalUrl = new URL(path, SITE_URL).toString();
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:site_name", "Threaded Forms — Tehila's studio");
    upsertMeta("property", "og:locale", "en_KE");
    if (image) upsertMeta("property", "og:image", new URL(image, SITE_URL).toString());
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonical = existing ?? document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = canonicalUrl;
    if (!existing) document.head.appendChild(canonical);
    const scriptId = "page-jsonld";
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => { document.getElementById(scriptId)?.remove(); };
  }, [description, image, jsonLd, path, title, type]);
  return null;
}

export function studioJsonLd() {
  return [
    { "@context": "https://schema.org", "@type": "Person", name: "Tehila", jobTitle: "Contemporary fiber and string-art artist", url: SITE_URL, sameAs: ["https://www.instagram.com/t.ww2.k"] },
    { "@context": "https://schema.org", "@type": "ArtGallery", name: "Threaded Forms Studio", description: "Tehila's Nairobi studio for contemporary string art, textile pieces, studio notes, and workshops.", url: SITE_URL, image: new URL("/manus-storage/maker-at-work_575171a1.jpg", SITE_URL).toString(), address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" }, areaServed: ["Nairobi", "Kenya"], founder: { "@type": "Person", name: "Tehila" }, sameAs: ["https://www.instagram.com/t.ww2.k"] },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Threaded Forms — Tehila's studio", url: SITE_URL, inLanguage: "en-KE", potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/journal/{search_term_string}`, "query-input": "required name=search_term_string" } },
  ];
}
