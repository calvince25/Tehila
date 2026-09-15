import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDot,
  Clock3,
  ExternalLink,
  Instagram,
  MapPin,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Seo, studioJsonLd } from "@/components/Seo";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useLocation } from "wouter";

const fallbackMedia = {
  pink: "/studio-assets/pink-orbit.jpg",
  maker: "/studio-assets/maker-at-work.jpg",
  violet: "/studio-assets/violet-orbit.jpg",
  process: "/studio-assets/process-closeup.jpg",
  sun: "/studio-assets/woven-sun.jpg",
  terrain: "/studio-assets/textile-landscape.jpg",
  grid: "/studio-assets/studio-grid.jpg",
};

type Product = { id?: number; title: string; kind: string; price: string; size: string; image: string; status: string; description: string };
type EventItem = { id?: number; startAt: Date | string; endAt: Date | string; title: string; type: string; venue: string; city: string; time: string; description: string; accent: string };

type ImageRow = { id: number; name: string; imageUrl: string; altText: string; updatedAt?: string | Date };
type JournalItem = { id?: number; slug: string; date: string; title: string; category: string; image: string; copy: string; body?: string; altText?: string };

function resolveStudioImage(url: string | undefined, updatedAt?: string | Date) {
  if (!url) return url;
  const legacyMap: Record<string, string> = {
    "pink-orbit_e98112f2.jpg": "/studio-assets/pink-orbit.jpg",
    "maker-at-work_575171a1.jpg": "/studio-assets/maker-at-work.jpg",
    "violet-orbit_ef8b1733.jpg": "/studio-assets/violet-orbit.jpg",
    "process-closeup_eccb9460.jpg": "/studio-assets/process-closeup.jpg",
    "woven-sun_b8375056.jpg": "/studio-assets/woven-sun.jpg",
    "textile-landscape_bcec7a53.jpg": "/studio-assets/textile-landscape.jpg",
    "studio-grid_499fcdaf.jpg": "/studio-assets/studio-grid.jpg",
  };
  const key = url.split("/").pop() ?? "";
  const resolved = legacyMap[key] ?? url;
  if (!resolved || resolved.startsWith("/studio-assets/") || !updatedAt) return resolved;
  return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${encodeURIComponent(new Date(updatedAt).getTime())}`;
}

const fallbackProducts: Product[] = [
  { title: "Orbit in Pink", kind: "Original wall work", price: "KSh 60,900", size: "60 × 60 cm", image: fallbackMedia.pink, status: "Available", description: "A concentric study in rose thread, built slowly over a warm neutral ground." },
  { title: "Violet Current", kind: "Original wall work", price: "KSh 56,550", size: "50 × 70 cm", image: fallbackMedia.violet, status: "Available", description: "Deep violet moving through blush, made to shift with the light in a room." },
  { title: "Woven Sun", kind: "Fiber study", price: "KSh 21,025", size: "35 cm diameter", image: fallbackMedia.sun, status: "One of one", description: "A smaller circular piece with layered thread, soft geometry, and saturated color." },
  { title: "Coastal Terrain", kind: "Original wall work", price: "KSh 52,200", size: "45 × 60 cm", image: fallbackMedia.terrain, status: "Coming soon", description: "A tactile landscape drawn with moss, clay, and the irregular rhythm of hand-wound fiber." },
];

const fallbackEvents: EventItem[] = [
  { startAt: "2026-10-12T12:00:00+03:00", endAt: "2026-10-12T17:00:00+03:00", title: "Open studio afternoon", type: "Studio visit", venue: "Threaded Forms Studio", city: "Nairobi · Lavington", time: "12:00—17:00", description: "Come see the work in progress, touch the materials, and spend an unhurried afternoon in the studio.", accent: "coral" },
  { startAt: "2026-11-03T18:00:00+03:00", endAt: "2026-11-03T21:00:00+03:00", title: "Soft Geometry", type: "Group exhibition", venue: "The Gallery Room", city: "Nairobi · Westlands", time: "18:00—21:00", description: "A group show about texture, repetition, and the shapes that happen when a line is given time.", accent: "sage" },
  { startAt: "2026-11-23T10:00:00+03:00", endAt: "2026-11-23T13:00:00+03:00", title: "Thread / Tension / Time", type: "Workshop", venue: "The Makers' Table", city: "Nairobi · Kilimani", time: "10:00—13:00", description: "A small hands-on workshop for anyone curious about building a first string-art piece.", accent: "plum" },
];

const fallbackJournal: JournalItem[] = [
  { slug: "the-line-is-never-really-straight", date: "18 SEP 2026", title: "The line is never really straight", category: "Studio note", image: fallbackMedia.process, copy: "A few thoughts on letting the material lead instead of correcting every small turn.", body: "A few thoughts on letting the material lead instead of correcting every small turn." },
  { slug: "a-new-pink-orbit", date: "06 SEP 2026", title: "A new pink orbit", category: "New work", image: fallbackMedia.pink, copy: "The piece that started with one loose circle and ended up holding the whole wall.", body: "The piece that started with one loose circle and ended up holding the whole wall." },
  { slug: "what-happens-in-the-quiet", date: "27 AUG 2026", title: "What happens in the quiet", category: "From the studio", image: fallbackMedia.maker, copy: "A morning of cutting, winding, undoing, and starting again.", body: "A morning of cutting, winding, undoing, and starting again." },
];

const CART_KEY = "threaded-forms-cart";

const typeLabels: Record<string, string> = { studio_visit: "Studio visit", group_exhibition: "Group exhibition", workshop: "Workshop" };
const statusLabels: Record<string, string> = { available: "Available", one_of_one: "One of one", reserved: "Reserved", coming_soon: "Coming soon", sold: "Sold" };

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function formatPrice(value: string | undefined) {
  if (!value) return "Price on request";
  const legacyEuro = value.match(/€\s*([\d,.]+)/);
  if (legacyEuro) {
    const euros = Number(legacyEuro[1].replace(/,/g, ""));
    if (Number.isFinite(euros)) return `KSh ${Math.round(euros * 145).toLocaleString("en-KE")}`;
  }
  if (/KSh|KES|shilling/i.test(value)) return value.replace(/^KES\s*/i, "KSh ");
  return `KSh ${value.replace(/^\s+/, "")}`;
}

function formatMonth(value: Date | string) {
  return asDate(value).toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function formatDay(value: Date | string) {
  return asDate(value).toLocaleString("en-US", { day: "2-digit" });
}

function formatYear(value: Date | string) {
  return asDate(value).toLocaleString("en-US", { year: "numeric" });
}

function calendarStamp(value: Date | string) {
  return asDate(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function googleCalendarUrl(event: EventItem) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${calendarStamp(event.startAt)}/${calendarStamp(event.endAt)}`,
    details: `${event.description}\n\nThreaded Forms Studio event`,
    location: `${event.venue}, ${event.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadAppleCalendar(event: EventItem) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Threaded Forms//Studio Events//EN",
    "BEGIN:VEVENT",
    `UID:threaded-forms-${event.id ?? event.title.replace(/[^a-z0-9]+/gi, "-")}`,
    `DTSTAMP:${calendarStamp(new Date())}`,
    `DTSTART:${calendarStamp(event.startAt)}`,
    `DTEND:${calendarStamp(event.endAt)}`,
    `SUMMARY:${event.title.replace(/[,;\\]/g, "\\$&")}`,
    `DESCRIPTION:${event.description.replace(/[,;\\]/g, "\\$&")}`,
    `LOCATION:${`${event.venue}, ${event.city}`.replace(/[,;\\]/g, "\\$&")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toast.success("Calendar file downloaded.", { description: "Open it with Apple Calendar or another calendar app." });
}

export default function Home() {
  const { data: content } = trpc.content.all.useQuery();
  const subscribeNewsletter = trpc.content.subscribeNewsletter.useMutation();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [eventFilter, setEventFilter] = useState("All events");
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [email, setEmail] = useState("");

  function addToCart(product: Product) {
    if (product.status === "Sold" || product.status === "Coming soon") {
      toast.error("This piece is not currently available to order.");
      return;
    }
    try {
      const current = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Array<Product & { quantity: number }>;
      const existingIndex = current.findIndex((item) => item.id === product.id && item.title === product.title);
      const next = existingIndex >= 0 ? current.map((item, index) => index === existingIndex ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item) : [...current, { ...product, quantity: 1 }];
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      toast.success("Added to your order.", { description: "You can continue browsing or complete the WhatsApp checkout." });
      setSelectedProduct(null);
      setLocation("/checkout");
    } catch {
      toast.error("Could not add this piece to your order.");
    }
  }

  const imageMap = useMemo(() => new Map((content?.images ?? []).map((image: ImageRow) => [image.name, { ...image, imageUrl: resolveStudioImage(image.imageUrl, image.updatedAt) }])), [content?.images]);
  const media = (name: keyof typeof fallbackMedia) => imageMap.get(name)?.imageUrl ?? fallbackMedia[name];
  const mediaAlt = (name: keyof typeof fallbackMedia, fallback: string) => imageMap.get(name)?.altText ?? fallback;
  const products = useMemo<Product[]>(() => content?.canvases?.length ? content.canvases.map((item) => ({ id: item.id, title: item.title, kind: item.kind, price: formatPrice(item.price), size: item.size, image: resolveStudioImage(item.imageUrl, item.updatedAt) ?? fallbackMedia.pink, status: statusLabels[item.status] ?? item.status, description: item.description })) : fallbackProducts, [content?.canvases]);
  const events = useMemo<EventItem[]>(() => content?.events?.length ? content.events.map((item) => ({ id: item.id, startAt: item.startAt, endAt: item.endAt, title: item.title, type: typeLabels[item.type] ?? item.type, venue: item.venue, city: item.city, time: `${asDate(item.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}—${asDate(item.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, description: item.description, accent: item.accent })) : fallbackEvents, [content?.events]);
  const filteredEvents = useMemo(() => eventFilter === "All events" ? events : events.filter((event) => event.type === eventFilter), [eventFilter, events]);
  const journal = useMemo<JournalItem[]>(() => content?.journal?.length ? content.journal.map((entry) => ({ id: entry.id, slug: entry.slug, date: new Date(entry.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(), title: entry.title, category: entry.category, image: resolveStudioImage(entry.image_url) ?? fallbackMedia.process, copy: entry.excerpt, body: entry.body, altText: entry.alt_text })) : fallbackJournal.map((entry) => ({ ...entry, image: resolveStudioImage(entry.image) ?? media(entry.slug === "a-new-pink-orbit" ? "pink" : entry.slug === "what-happens-in-the-quiet" ? "maker" : "process") })), [content?.journal, media]);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };
  const toggleEvent = (title: string) => { const isSaved = savedEvents.includes(title); setSavedEvents((current) => isSaved ? current.filter((item) => item !== title) : [...current, title]); toast.success(isSaved ? "Event removed from your list." : "Event saved.", { description: "Use the calendar actions to save the date to your calendar." }); };
  const subscribe = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!email) return; try { await subscribeNewsletter.mutateAsync({ email }); toast.success("You’re on the studio list.", { description: "New work and event notes will arrive here." }); setEmail(""); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save your email. Please try again."); } };

  return (
    <main className="studio-app">
      <Seo title="Threaded Forms — Tehila's studio in Nairobi" description="Discover Tehila's contemporary string-art, textile wall pieces, studio journal, workshops, and upcoming events in Nairobi, Kenya." path="/" jsonLd={studioJsonLd()} />
      <WhatsAppFloat />
      <header className="app-header">
        <a className="studio-logo" href="#home" onClick={() => scrollTo("home")}><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a>
        <nav className={`app-nav ${menuOpen ? "open" : ""}`}>{[["home", "Home"], ["story", "Story"], ["shop", "Shop"], ["events", "Events"], ["journal", "Journal"]].map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => scrollTo(id)}>{label}</a>)}<a href="/commission">Commissions</a></nav>
        <div className="header-right"><a className="header-instagram" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={17} /> <span>Follow along</span></a><button className="bag-button" onClick={() => setLocation("/checkout")} aria-label="Open order checkout"><ShoppingBag size={18} /><span>Order</span></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
      </header>

      <section className="app-hero" id="home">
        <div className="hero-left"><div className="live-pill"><span /> In the studio · September 2026</div><h1>Hi, I'm <em>Tehila.</em><br />I make things<br /><span>with thread.</span></h1><p className="hero-statement">Welcome to my little corner of the internet — a place for string-art canvases, studio notes, upcoming gatherings, and the pieces that are looking for a home.</p><div className="hero-links"><button className="primary-button" onClick={() => scrollTo("shop")}>See what's available <ArrowRight size={17} /></button><button className="quiet-link" onClick={() => scrollTo("story")}>My story <ArrowDownRight size={16} /></button></div><div className="hero-footnote"><Sparkles size={15} /> Made slowly in Nairobi · sent wherever you are</div></div>
        <div className="hero-collage"><div className="collage-ring ring-a" /><div className="collage-ring ring-b" /><figure className="portrait-card"><img src={media("maker")} alt={mediaAlt("maker", "Tehila making a string-art canvas")} /><figcaption><span>01</span><span>At the studio table</span></figcaption></figure><figure className="art-card"><img src={media("pink")} alt={mediaAlt("pink", "Pink circular string-art canvas")} /><span>Orbit in Pink</span></figure><div className="collage-note">The work is<br /><em>the conversation.</em></div></div>
      </section>

      <div className="app-strip"><span>STRING / COLOR / PATIENCE</span><span>✳</span><span>NEW WORK + STUDIO NOTES</span><span>✳</span><span>STRING / COLOR / PATIENCE</span></div>

      <section className="story-section app-section" id="story"><div className="section-kicker"><span className="kicker-line" /> 01 / The person behind the pieces</div><div className="story-layout"><div className="story-title"><h2>It starts with<br /><em>a feeling.</em></h2><div className="story-aside"><span>Currently thinking about</span><b>how a line can<br />remember a place.</b></div></div><div className="story-body"><p className="lead-copy">I have always been drawn to things that take time. A line repeated until it becomes a shape. A color that changes when the sun moves. The small surprise of a surface you can almost feel through a photograph.</p><p>Threaded Forms is my practice of making those moments visible. I work with thread, canvas, wood, and a lot of patience to create contemporary fiber pieces that sit somewhere between drawing and sculpture.</p><p>This is where I share the finished pieces, but also the in-between: the sketches, the loose ends, the events, and the quiet hours at the table.</p><button className="underlined-link" onClick={() => scrollTo("journal")}>Read the studio journal <ArrowUpRight size={15} /></button></div></div><div className="story-images"><img src={media("grid")} alt={mediaAlt("grid", "A collage of Threaded Forms artwork and studio process")} /><div className="story-caption"><span>From my archive</span><b>Work, hands, and<br />a little bit of joy.</b></div></div></section>

      <section className="shop-section app-section" id="shop"><div className="section-topline"><div><div className="section-kicker"><span className="kicker-line" /> 02 / The shop</div><h2>Pieces looking<br /><em>for a home.</em></h2></div><div className="section-description"><p>Original string-art and fiber pieces, made one at a time. Each one comes signed, ready to hang, and packed with care.</p><button className="underlined-link" onClick={() => setShopOpen(!shopOpen)}>{shopOpen ? "Show fewer pieces" : "View all pieces"} {shopOpen ? <Minus size={15} /> : <Plus size={15} />}</button></div></div><div className="product-grid">{products.map((product, index) => <button className={`product-card ${index === 1 ? "offset-card" : ""}`} key={product.id ?? product.title} onClick={() => setSelectedProduct(product)}><div className="product-image"><img src={product.image} alt={product.title} /><span className={`product-status ${product.status === "Coming soon" ? "soon" : ""}`}>{product.status}</span><span className="product-view">View piece <ArrowUpRight size={15} /></span></div><div className="product-info"><div><h3>{product.title}</h3><p>{product.kind} · {product.size}</p></div><strong>{product.price}</strong></div></button>)}</div><div className="shop-note"><ShoppingBag size={17} /><span>Not ready to buy? <button onClick={() => scrollTo("contact")}>Ask me a question</button> — I’m happy to send more photos or talk through a piece.</span></div></section>

      <section className="events-section app-section" id="events"><div className="section-topline"><div><div className="section-kicker light-kicker"><span className="kicker-line" /> 03 / Come say hi</div><h2>Where to find<br /><em>me next.</em></h2></div><div className="section-description light-description"><p>Open studios, exhibitions, and small workshops. Save a date, bring a friend, and come see the work in person.</p><a className="underlined-link light-link" href="mailto:hello@threadedforms.studio?subject=Event%20question">Ask about an event <ArrowUpRight size={15} /></a></div></div><div className="event-tabs">{["All events", "Studio visit", "Group exhibition", "Workshop"].map((filter) => <button className={eventFilter === filter ? "active" : ""} key={filter} onClick={() => setEventFilter(filter)}>{filter}</button>)}</div><div className="event-list">{filteredEvents.map((event) => <article className={`event-card event-${event.accent}`} key={event.id ?? event.title}><div className="event-date"><b>{formatMonth(event.startAt)}</b><strong>{formatDay(event.startAt)}</strong><span>{formatYear(event.startAt)}</span></div><div className="event-main"><div className="event-label">{event.type}</div><h3>{event.title}</h3><p>{event.description}</p><div className="event-details"><span><Clock3 size={14} /> {event.time}</span><span><MapPin size={14} /> {event.venue} · {event.city}</span></div></div><div className="event-actions"><button className={`save-event ${savedEvents.includes(event.title) ? "saved" : ""}`} onClick={() => toggleEvent(event.title)}>{savedEvents.includes(event.title) ? <><Check size={15} /> Saved</> : <>Save date <Plus size={15} /></>}</button><div className="calendar-actions"><a className="calendar-button" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer"><CalendarDays size={13} /> Google</a><button className="calendar-button" onClick={() => downloadAppleCalendar(event)}><CalendarDays size={13} /> Apple / .ics</button></div></div></article>)}</div></section>

      <section className="journal-section app-section" id="journal"><div className="section-topline"><div><div className="section-kicker"><span className="kicker-line" /> 04 / From the journal</div><h2>Small notes<br /><em>from the making.</em></h2></div><a className="underlined-link" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer">More on Instagram <ExternalLink size={15} /></a></div><div className="journal-grid">{journal.map((entry) => <article className="journal-card" key={entry.slug}><a href={`/journal/${entry.slug}`}><img src={entry.image} alt={entry.altText ?? entry.title} /><div className="journal-meta"><span>{entry.category}</span><span>{entry.date}</span></div><h3>{entry.title}</h3><p>{entry.copy}</p><span className="journal-read">Read note <ArrowRight size={15} /></span></a></article>)}</div></section>

      <section className="contact-section" id="contact"><div className="contact-copy"><div className="section-kicker light-kicker"><span className="kicker-line" /> Keep in touch</div><h2>Come back<br /><em>soon?</em></h2><p>Join the studio list for new work, events, and the occasional note from the table. No noise, just the good stuff.</p><a href="mailto:hello@threadedforms.studio" className="email-link">hello@threadedforms.studio <ArrowUpRight size={16} /></a></div><form className="signup-form" onSubmit={subscribe}><label htmlFor="studio-email">Your email address</label><div className="signup-line"><input id="studio-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required /><button type="submit" aria-label="Join the studio list" disabled={subscribeNewsletter.isPending}><ArrowRight size={19} /></button></div><span>By joining, you’re saying yes to a small, thoughtful inbox.</span></form></section>

      <footer className="app-footer"><div className="footer-brand"><a className="studio-logo" href="#home"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><p>Made with thread, patience, and a little joy.</p></div><div className="footer-actions"><a href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a><a href="mailto:hello@threadedforms.studio">Email <ArrowUpRight size={14} /></a><a href="/commission">Commissions <ArrowUpRight size={14} /></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Threaded Forms. All rights reserved.</span><a className="growthlab-credit" href="https://www.growthlab.co.ke" target="_blank" rel="noreferrer">Designed by Growthlab <ArrowUpRight size={14} /></a></div></footer>

      {selectedProduct && <div className="detail-backdrop" onClick={() => setSelectedProduct(null)}><div className="product-detail" onClick={(event) => event.stopPropagation()}><button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Close details"><X size={19} /></button><img src={selectedProduct.image} alt={selectedProduct.title} /><div className="detail-copy"><span className="detail-status">{selectedProduct.status}</span><h2>{selectedProduct.title}</h2><p>{selectedProduct.description}</p><div className="detail-facts"><span><small>Size</small>{selectedProduct.size}</span><span><small>Price</small>{selectedProduct.price}</span><span><small>Delivery</small>Confirmed separately</span></div><button className="primary-button" onClick={() => addToCart(selectedProduct)} disabled={selectedProduct.status === "Sold" || selectedProduct.status === "Coming soon"}>{selectedProduct.status === "Available" || selectedProduct.status === "One of one" ? "Add to order" : "Not available"} <ArrowRight size={17} /></button></div></div></div>}
    </main>
  );
}
