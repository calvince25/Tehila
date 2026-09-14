import { ArrowLeft, ArrowUpRight, CircleDot, Instagram } from "lucide-react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Seo, SITE_URL } from "@/components/Seo";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const fallbackPosts: Record<string, { title: string; category: string; published_at: string; image_url: string; alt_text: string; excerpt: string; body: string; author_name: string }> = {
  "the-line-is-never-really-straight": { title: "The line is never really straight", category: "Studio note", published_at: "2026-09-18T09:00:00+03:00", image_url: "/manus-storage/process-closeup_eccb9460.jpg", alt_text: "Close-up of thread and canvas in the studio", excerpt: "A few thoughts on letting the material lead instead of correcting every small turn.", body: "A few thoughts on letting the material lead instead of correcting every small turn.\n\nWhen I begin a canvas, I often think I am drawing a shape. After a while, the thread reminds me that it has its own movement. The most interesting turns are usually the ones I did not plan.\n\nThat is the quiet part of making: staying close enough to the work to notice when it wants to become something else.", author_name: "Tehila" },
  "a-new-pink-orbit": { title: "A new pink orbit", category: "New work", published_at: "2026-09-06T09:00:00+03:00", image_url: "/manus-storage/pink-orbit_e98112f2.jpg", alt_text: "Pink circular string-art canvas", excerpt: "The piece that started with one loose circle and ended up holding the whole wall.", body: "The piece that started with one loose circle and ended up holding the whole wall.\n\nPink can be loud, but this one became a little quieter as the circles grew. It now feels like a small weather system: warm, changing, and just a little impossible to measure.", author_name: "Tehila" },
  "what-happens-in-the-quiet": { title: "What happens in the quiet", category: "From the studio", published_at: "2026-08-27T09:00:00+03:00", image_url: "/manus-storage/maker-at-work_575171a1.jpg", alt_text: "Tehila working on a string-art canvas", excerpt: "A morning of cutting, winding, undoing, and starting again.", body: "A morning of cutting, winding, undoing, and starting again.\n\nThere is a particular kind of focus that arrives when the phone is away and the first thread is already tied. The work does not become easier, exactly. It becomes more honest.", author_name: "Tehila" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export default function JournalPost() {
  const [, params] = useRoute("/journal/:slug");
  const slug = params?.slug ?? "";
  const { data: post, isLoading } = trpc.content.journalBySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const entry = post ?? fallbackPosts[slug];

  if (isLoading && !entry) return <div className="journal-loading">Opening the studio journal…</div>;
  if (!entry) return <div className="journal-missing"><a className="underlined-link" href="/#journal"><ArrowLeft size={15} /> Back to journal</a><h1>This note has gone quiet.</h1><p>The journal post may have been unpublished or moved.</p></div>;

  const canonicalPath = `/journal/${slug}`;
  const description = post?.seo_description ?? entry.excerpt;
  const title = post?.seo_title ?? `${entry.title} — Threaded Forms`;
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: entry.title, description, image: [new URL(entry.image_url, SITE_URL).toString()], datePublished: entry.published_at, dateModified: post?.updated_at ?? entry.published_at, author: { "@type": "Person", name: entry.author_name, url: SITE_URL }, publisher: { "@type": "Person", name: "Tehila" }, mainEntityOfPage: new URL(canonicalPath, SITE_URL).toString(), inLanguage: "en-KE" };

  return <main className="journal-post-page">
    <Seo title={title} description={description} path={canonicalPath} image={entry.image_url} type="article" jsonLd={articleSchema} />
    <WhatsAppFloat />
    <header className="app-header"><a className="studio-logo" href="/"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><div className="header-right"><a className="header-instagram" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={17} /> <span>Follow along</span></a></div></header>
    <article className="journal-post"><a className="back-journal" href="/#journal"><ArrowLeft size={15} /> Back to journal</a><div className="journal-post-heading"><div className="journal-meta"><span>{entry.category}</span><span>{formatDate(entry.published_at)}</span></div><h1>{entry.title}</h1><p className="journal-post-excerpt">{entry.excerpt}</p><div className="journal-author">Written by {entry.author_name} · Threaded Forms Studio, Nairobi</div></div><img className="journal-post-image" src={entry.image_url} alt={entry.alt_text} /><div className="journal-post-body">{entry.body.split(/\n\s*\n/).map((paragraph: string) => <p key={paragraph}>{paragraph}</p>)}</div><div className="journal-post-footer"><a className="underlined-link" href="/#journal"><ArrowLeft size={15} /> More from the journal</a><a className="underlined-link" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer">Continue on Instagram <ArrowUpRight size={15} /></a></div></article>
    <footer className="app-footer"><a className="studio-logo" href="/"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><span>Made with thread, patience, and a little joy.</span></footer>
  </main>;
}
