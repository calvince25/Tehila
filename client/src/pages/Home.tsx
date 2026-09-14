import { useMemo, useState } from "react";
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

const media = {
  pink: "/manus-storage/pink-orbit_e98112f2.jpg",
  maker: "/manus-storage/maker-at-work_575171a1.jpg",
  violet: "/manus-storage/violet-orbit_ef8b1733.jpg",
  process: "/manus-storage/process-closeup_eccb9460.jpg",
  sun: "/manus-storage/woven-sun_b8375056.jpg",
  terrain: "/manus-storage/textile-landscape_bcec7a53.jpg",
  grid: "/manus-storage/studio-grid_499fcdaf.jpg",
};

type Product = { title: string; kind: string; price: string; size: string; image: string; status: string; description: string };
type EventItem = { month: string; day: string; title: string; type: string; venue: string; city: string; time: string; description: string; accent: string };

const products: Product[] = [
  { title: "Orbit in Pink", kind: "Original wall work", price: "€420", size: "60 × 60 cm", image: media.pink, status: "Available", description: "A concentric study in rose thread, built slowly over a warm neutral ground." },
  { title: "Violet Current", kind: "Original wall work", price: "€390", size: "50 × 70 cm", image: media.violet, status: "Available", description: "Deep violet moving through blush, made to shift with the light in a room." },
  { title: "Woven Sun", kind: "Fiber study", price: "€145", size: "35 cm diameter", image: media.sun, status: "One of one", description: "A smaller circular piece with layered thread, soft geometry, and saturated color." },
  { title: "Coastal Terrain", kind: "Original wall work", price: "€360", size: "45 × 60 cm", image: media.terrain, status: "Coming soon", description: "A tactile landscape drawn with moss, clay, and the irregular rhythm of hand-wound fiber." },
];

const events: EventItem[] = [
  { month: "OCT", day: "12", title: "Open studio afternoon", type: "Studio visit", venue: "Threaded Forms Studio", city: "Nairobi · Lavington", time: "12:00—17:00", description: "Come see the work in progress, touch the materials, and spend an unhurried afternoon in the studio.", accent: "coral" },
  { month: "NOV", day: "03", title: "Soft Geometry", type: "Group exhibition", venue: "The Gallery Room", city: "Nairobi · Westlands", time: "18:00—21:00", description: "A group show about texture, repetition, and the shapes that happen when a line is given time.", accent: "sage" },
  { month: "NOV", day: "23", title: "Thread / Tension / Time", type: "Workshop", venue: "The Makers' Table", city: "Nairobi · Kilimani", time: "10:00—13:00", description: "A small hands-on workshop for anyone curious about building a first string-art piece.", accent: "plum" },
];

const journal = [
  { date: "18 SEP 2026", title: "The line is never really straight", category: "Studio note", image: media.process, copy: "A few thoughts on letting the material lead instead of correcting every small turn." },
  { date: "06 SEP 2026", title: "A new pink orbit", category: "New work", image: media.pink, copy: "The piece that started with one loose circle and ended up holding the whole wall." },
  { date: "27 AUG 2026", title: "What happens in the quiet", category: "From the studio", image: media.maker, copy: "A morning of cutting, winding, undoing, and starting again." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [eventFilter, setEventFilter] = useState("All events");
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [email, setEmail] = useState("");

  const filteredEvents = useMemo(() => eventFilter === "All events" ? events : events.filter((event) => event.type === eventFilter), [eventFilter]);
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };
  const toggleEvent = (title: string) => { setSavedEvents((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]); toast.success(savedEvents.includes(title) ? "Event removed from your list." : "Event saved.", { description: "We’ll keep this event easy to find." }); };
  const subscribe = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!email) return; toast.success("You’re on the studio list.", { description: "New work and event notes will arrive here." }); setEmail(""); };

  return (
    <main className="studio-app">
      <header className="app-header">
        <a className="studio-logo" href="#home" onClick={() => scrollTo("home")}><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a>
        <nav className={`app-nav ${menuOpen ? "open" : ""}`}>
          {[['home', 'Home'], ['story', 'Story'], ['shop', 'Shop'], ['events', 'Events'], ['journal', 'Journal']].map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => scrollTo(id)}>{label}</a>)}
        </nav>
        <div className="header-right"><a className="header-instagram" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={17} /> <span>Follow along</span></a><button className="bag-button" onClick={() => { setShopOpen(true); scrollTo("shop"); }} aria-label="Open shop"><ShoppingBag size={18} /><span>Shop</span></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
      </header>

      <section className="app-hero" id="home">
        <div className="hero-left"><div className="live-pill"><span /> In the studio · September 2026</div><h1>Hi, I'm <em>Tehila.</em><br />I make things<br /><span>with thread.</span></h1><p className="hero-statement">Welcome to my little corner of the internet — a place for string-art canvases, studio notes, upcoming gatherings, and the pieces that are looking for a home.</p><div className="hero-links"><button className="primary-button" onClick={() => scrollTo("shop")}>See what's available <ArrowRight size={17} /></button><button className="quiet-link" onClick={() => scrollTo("story")}>My story <ArrowDownRight size={16} /></button></div><div className="hero-footnote"><Sparkles size={15} /> Made slowly in Nairobi · sent wherever you are</div></div>
        <div className="hero-collage"><div className="collage-ring ring-a" /><div className="collage-ring ring-b" /><figure className="portrait-card"><img src={media.maker} alt="Tehila making a string-art canvas" /><figcaption><span>01</span><span>At the studio table</span></figcaption></figure><figure className="art-card"><img src={media.pink} alt="Pink circular string-art canvas" /><span>Orbit in Pink</span></figure><div className="collage-note">The work is<br /><em>the conversation.</em></div></div>
      </section>

      <div className="app-strip"><span>STRING / COLOR / PATIENCE</span><span>✳</span><span>NEW WORK + STUDIO NOTES</span><span>✳</span><span>STRING / COLOR / PATIENCE</span></div>

      <section className="story-section app-section" id="story"><div className="section-kicker"><span className="kicker-line" /> 01 / The person behind the pieces</div><div className="story-layout"><div className="story-title"><h2>It starts with<br /><em>a feeling.</em></h2><div className="story-aside"><span>Currently thinking about</span><b>how a line can<br />remember a place.</b></div></div><div className="story-body"><p className="lead-copy">I have always been drawn to things that take time. A line repeated until it becomes a shape. A color that changes when the sun moves. The small surprise of a surface you can almost feel through a photograph.</p><p>Threaded Forms is my practice of making those moments visible. I work with thread, canvas, wood, and a lot of patience to create contemporary fiber pieces that sit somewhere between drawing and sculpture.</p><p>This is where I share the finished pieces, but also the in-between: the sketches, the loose ends, the events, and the quiet hours at the table.</p><button className="underlined-link" onClick={() => scrollTo("journal")}>Read the studio journal <ArrowUpRight size={15} /></button></div></div><div className="story-images"><img src={media.grid} alt="A collage of Threaded Forms artwork and studio process" /><div className="story-caption"><span>From my archive</span><b>Work, hands, and<br />a little bit of joy.</b></div></div></section>

      <section className="shop-section app-section" id="shop"><div className="section-topline"><div><div className="section-kicker"><span className="kicker-line" /> 02 / The shop</div><h2>Pieces looking<br /><em>for a home.</em></h2></div><div className="section-description"><p>Original string-art and fiber pieces, made one at a time. Each one comes signed, ready to hang, and packed with care.</p><button className="underlined-link" onClick={() => setShopOpen(!shopOpen)}>{shopOpen ? "Show fewer pieces" : "View all pieces"} {shopOpen ? <Minus size={15} /> : <Plus size={15} />}</button></div></div><div className="product-grid">{products.map((product, index) => <button className={`product-card ${index === 1 ? "offset-card" : ""}`} key={product.title} onClick={() => setSelectedProduct(product)}><div className="product-image"><img src={product.image} alt={product.title} /><span className={`product-status ${product.status === "Coming soon" ? "soon" : ""}`}>{product.status}</span><span className="product-view">View piece <ArrowUpRight size={15} /></span></div><div className="product-info"><div><h3>{product.title}</h3><p>{product.kind} · {product.size}</p></div><strong>{product.price}</strong></div></button>)}</div><div className="shop-note"><ShoppingBag size={17} /><span>Not ready to buy? <button onClick={() => scrollTo("contact")}>Ask me a question</button> — I’m happy to send more photos or talk through a piece.</span></div></section>

      <section className="events-section app-section" id="events"><div className="section-topline"><div><div className="section-kicker light-kicker"><span className="kicker-line" /> 03 / Come say hi</div><h2>Where to find<br /><em>me next.</em></h2></div><div className="section-description light-description"><p>Open studios, exhibitions, and small workshops. Save a date, bring a friend, and come see the work in person.</p><a className="underlined-link light-link" href="mailto:hello@threadedforms.studio?subject=Event%20question">Ask about an event <ArrowUpRight size={15} /></a></div></div><div className="event-tabs">{["All events", "Studio visit", "Group exhibition", "Workshop"].map((filter) => <button className={eventFilter === filter ? "active" : ""} key={filter} onClick={() => setEventFilter(filter)}>{filter}</button>)}</div><div className="event-list">{filteredEvents.map((event) => <article className={`event-card event-${event.accent}`} key={event.title}><div className="event-date"><b>{event.month}</b><strong>{event.day}</strong><span>2026</span></div><div className="event-main"><div className="event-label">{event.type}</div><h3>{event.title}</h3><p>{event.description}</p><div className="event-details"><span><Clock3 size={14} /> {event.time}</span><span><MapPin size={14} /> {event.venue} · {event.city}</span></div></div><button className={`save-event ${savedEvents.includes(event.title) ? "saved" : ""}`} onClick={() => toggleEvent(event.title)}>{savedEvents.includes(event.title) ? <><Check size={15} /> Saved</> : <>Save date <Plus size={15} /></>}</button></article>)}</div></section>

      <section className="journal-section app-section" id="journal"><div className="section-topline"><div><div className="section-kicker"><span className="kicker-line" /> 04 / From the journal</div><h2>Small notes<br /><em>from the making.</em></h2></div><a className="underlined-link" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer">More on Instagram <ExternalLink size={15} /></a></div><div className="journal-grid">{journal.map((entry) => <article className="journal-card" key={entry.title}><img src={entry.image} alt={entry.title} /><div className="journal-meta"><span>{entry.category}</span><span>{entry.date}</span></div><h3>{entry.title}</h3><p>{entry.copy}</p><button className="journal-read">Read note <ArrowRight size={15} /></button></article>)}</div></section>

      <section className="contact-section" id="contact"><div className="contact-copy"><div className="section-kicker light-kicker"><span className="kicker-line" /> Keep in touch</div><h2>Come back<br /><em>soon?</em></h2><p>Join the studio list for new work, events, and the occasional note from the table. No noise, just the good stuff.</p><a href="mailto:hello@threadedforms.studio" className="email-link">hello@threadedforms.studio <ArrowUpRight size={16} /></a></div><form className="signup-form" onSubmit={subscribe}><label htmlFor="studio-email">Your email address</label><div className="signup-line"><input id="studio-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required /><button type="submit" aria-label="Join the studio list"><ArrowRight size={19} /></button></div><span>By joining, you’re saying yes to a small, thoughtful inbox.</span></form></section>

      <footer className="app-footer"><a className="studio-logo" href="#home"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><span>Made with thread, patience, and a little joy.</span><div className="footer-actions"><a href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a><a href="mailto:hello@threadedforms.studio">Email <ArrowUpRight size={14} /></a></div></footer>

      {selectedProduct && <div className="detail-backdrop" onClick={() => setSelectedProduct(null)}><div className="product-detail" onClick={(event) => event.stopPropagation()}><button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Close details"><X size={19} /></button><img src={selectedProduct.image} alt={selectedProduct.title} /><div className="detail-copy"><span className="detail-status">{selectedProduct.status}</span><h2>{selectedProduct.title}</h2><p>{selectedProduct.description}</p><div className="detail-facts"><span><small>Size</small>{selectedProduct.size}</span><span><small>Price</small>{selectedProduct.price}</span><span><small>Made by</small>Tehila</span></div><a className="primary-button" href={`mailto:hello@threadedforms.studio?subject=Question%20about%20${encodeURIComponent(selectedProduct.title)}`}>Ask about this piece <ArrowRight size={17} /></a></div></div></div>}
    </main>
  );
}
