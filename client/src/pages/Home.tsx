import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDot,
  Instagram,
  Mail,
  Menu,
  MoveUpRight,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

const images = {
  pinkOrbit: "/manus-storage/pink-orbit_e98112f2.jpg",
  maker: "/manus-storage/maker-at-work_575171a1.jpg",
  violetOrbit: "/manus-storage/violet-orbit_ef8b1733.jpg",
  process: "/manus-storage/process-closeup_eccb9460.jpg",
  wovenSun: "/manus-storage/woven-sun_b8375056.jpg",
  landscape: "/manus-storage/textile-landscape_bcec7a53.jpg",
  studio: "/manus-storage/studio-grid_499fcdaf.jpg",
};

type Work = {
  title: string;
  category: string;
  year: string;
  image: string;
  size: string;
  description: string;
  tone: string;
};

const works: Work[] = [
  {
    title: "Orbit in Pink",
    category: "Wall work",
    year: "2026",
    image: images.pinkOrbit,
    size: "60 × 60 cm",
    description: "A concentric study in rose thread, tension, and the quiet pull of the center.",
    tone: "rose",
  },
  {
    title: "Hands at Work",
    category: "In the studio",
    year: "2026",
    image: images.maker,
    size: "Process study",
    description: "Every piece begins by hand: one line, one knot, one patient decision at a time.",
    tone: "sand",
  },
  {
    title: "Violet Current",
    category: "Wall work",
    year: "2026",
    image: images.violetOrbit,
    size: "50 × 70 cm",
    description: "Deep violet moving through warm blush, built to change as light crosses the strings.",
    tone: "plum",
  },
  {
    title: "Woven Sun",
    category: "Fiber study",
    year: "2026",
    image: images.wovenSun,
    size: "35 cm diameter",
    description: "A small circular piece made from layered thread, soft geometry, and saturated color.",
    tone: "ochre",
  },
  {
    title: "Coastal Terrain",
    category: "Fiber study",
    year: "2026",
    image: images.landscape,
    size: "45 × 60 cm",
    description: "A tactile landscape drawn with moss, clay, and the irregular rhythm of hand-wound fiber.",
    tone: "sage",
  },
  {
    title: "Learning the Line",
    category: "In the studio",
    year: "2026",
    image: images.process,
    size: "Studio journal",
    description: "The work is as much about the making as the finished surface: close, deliberate, physical.",
    tone: "ink",
  },
];

const filters = ["All work", "Wall work", "Fiber study", "In the studio"];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All work");
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredWorks = useMemo(
    () =>
      activeFilter === "All work"
        ? works
        : works.filter((work) => work.category === activeFilter),
    [activeFilter],
  );

  const closeMenu = () => setMenuOpen(false);

  const handleInquiry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Thank you — the studio will be in touch soon.", {
      description: "For now, this form is a preview. Connect an email address to make it live.",
    });
    event.currentTarget.reset();
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Threaded Forms home">
          <span className="wordmark-mark"><CircleDot size={17} strokeWidth={1.5} /></span>
          <span>Threaded Forms</span>
        </a>
        <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          <a href="#collection" onClick={closeMenu}>Collection</a>
          <a href="#story" onClick={closeMenu}>The studio</a>
          <a href="#commissions" onClick={closeMenu}>Commissions</a>
        </nav>
        <div className="header-actions">
          <a className="icon-link" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer" aria-label="Open Instagram">
            <Instagram size={18} strokeWidth={1.7} />
          </a>
          <a className="header-cta" href="#commissions">Work together <ArrowUpRight size={15} /></a>
          <button className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Contemporary string & textile art</div>
          <h1>Threads that <em>hold</em> a room.</h1>
          <p className="hero-intro">Hand-built canvases where color, tension, and time come together. Made slowly in the studio by Tehila.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#collection">Explore the work <ArrowRight size={17} /></a>
            <a className="text-link" href="#story">Meet the maker <MoveUpRight size={15} /></a>
          </div>
          <div className="hero-note"><Sparkles size={16} /><span>Made by hand · One piece at a time</span></div>
        </div>
        <div className="hero-visual" aria-label="Featured string art pieces">
          <div className="hero-orbit halo-one" />
          <div className="hero-orbit halo-two" />
          <div className="hero-frame hero-frame-main">
            <img src={images.pinkOrbit} alt="Pink circular string-art canvas" />
            <span className="image-label">01 / Orbit in Pink</span>
          </div>
          <div className="hero-frame hero-frame-small">
            <img src={images.wovenSun} alt="Colorful woven fiber artwork" />
          </div>
          <span className="hero-side-note">The beauty is in<br /><em>the tension.</em></span>
          <span className="hero-number">01—06</span>
        </div>
      </section>

      <section className="ticker" aria-label="Studio statement">
        <div className="ticker-track"><span>STRING / COLOR / PATIENCE</span><span className="ticker-symbol">✳</span><span>STRING / COLOR / PATIENCE</span><span className="ticker-symbol">✳</span><span>STRING / COLOR / PATIENCE</span></div>
      </section>

      <section className="section collection-section" id="collection">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> Selected works</div>
            <h2>A collection in<br /><em>constant motion.</em></h2>
          </div>
          <p>Geometry that stays soft. Each canvas is built by hand, with a line that knows where it wants to go.</p>
        </div>
        <div className="filter-row" role="tablist" aria-label="Filter works">
          {filters.map((filter) => (
            <button key={filter} className={`filter-button ${activeFilter === filter ? "active" : ""}`} onClick={() => setActiveFilter(filter)} role="tab" aria-selected={activeFilter === filter}>{filter}</button>
          ))}
        </div>
        <div className="work-grid">
          {filteredWorks.map((work, index) => (
            <button className={`work-card work-${index % 3} tone-${work.tone}`} key={work.title} onClick={() => setSelectedWork(work)}>
              <span className="work-image-wrap"><img src={work.image} alt={work.title} /><span className="work-hover"><span>View piece <ArrowUpRight size={16} /></span></span></span>
              <span className="work-meta"><span><strong>{work.title}</strong><small>{work.category}</small></span><span className="work-year">{work.year}</span></span>
            </button>
          ))}
        </div>
        <div className="collection-footer"><span>Showing {filteredWorks.length} of 6 works</span><span className="fine-rule" /><a href="#commissions">Want something made for you? <ArrowRight size={15} /></a></div>
      </section>

      <section className="story-section" id="story">
        <div className="story-image"><img src={images.maker} alt="Tehila making a string-art canvas in the studio" /><span className="story-stamp">Studio<br />notes<br /><b>02</b></span></div>
        <div className="story-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> The studio</div>
          <h2>Slow work.<br /><em>Strong lines.</em></h2>
          <p className="story-lead">“I like the moment a simple line starts to become a world.”</p>
          <p>Threaded Forms is a small, independent studio making contemporary fiber works for spaces that want a little more feeling. Tehila works from instinct: drawing with thread, building color in layers, and letting the material keep some of its mystery.</p>
          <p>Every piece is made from scratch, so no two surfaces ever carry the exact same rhythm. The result is artwork with a pulse — graphic from a distance, quietly tactile up close.</p>
          <a className="text-link dark-link" href="#commissions">Learn about commissions <MoveUpRight size={15} /></a>
        </div>
      </section>

      <section className="process-section">
        <div className="process-heading"><div className="eyebrow"><span className="eyebrow-dot" /> How it comes together</div><h2>From loose idea<br />to <em>lasting form.</em></h2></div>
        <div className="process-list">
          <div className="process-item"><span className="process-number">01</span><h3>Find the feeling</h3><p>We start with the mood, the room, or the story you want the piece to hold.</p></div>
          <div className="process-item"><span className="process-number">02</span><h3>Choose the language</h3><p>Color, scale, shape, and texture come together in a small, considered direction.</p></div>
          <div className="process-item"><span className="process-number">03</span><h3>Make it slowly</h3><p>Thread by thread, the final canvas takes shape in the studio over several weeks.</p></div>
        </div>
      </section>

      <section className="commission-section" id="commissions">
        <div className="commission-intro"><div className="eyebrow light-eyebrow"><span className="eyebrow-dot" /> Commissions open</div><h2>A piece with<br /><em>your name on it.</em></h2><p>For homes, hospitality spaces, and thoughtful gifts. Tell us a little about what you are imagining.</p><div className="commission-contact"><Mail size={17} /><a href="mailto:hello@threadedforms.studio">hello@threadedforms.studio</a></div></div>
        <form className="commission-form" onSubmit={handleInquiry}>
          <label>Your name<input name="name" placeholder="Name" required /></label>
          <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
          <label>What are you imagining?<textarea name="message" rows={3} placeholder="A wall piece for…" required /></label>
          <button className="button button-light" type="submit">Start a conversation <ArrowRight size={17} /></button>
          <span className="form-note">This preview form is ready to connect to the studio inbox.</span>
        </form>
      </section>

      <footer className="site-footer"><a className="wordmark" href="#top"><span className="wordmark-mark"><CircleDot size={17} strokeWidth={1.5} /></span><span>Threaded Forms</span></a><span>Contemporary string & textile art</span><div className="footer-links"><a href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a><a href="mailto:hello@threadedforms.studio">Email <ArrowUpRight size={14} /></a></div></footer>

      {selectedWork && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedWork(null)}><div className="work-modal" role="dialog" aria-modal="true" aria-label={selectedWork.title} onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close piece details" onClick={() => setSelectedWork(null)}><X size={19} /></button><img src={selectedWork.image} alt={selectedWork.title} /><div className="modal-copy"><div className="eyebrow"><span className="eyebrow-dot" /> {selectedWork.category} · {selectedWork.year}</div><h2>{selectedWork.title}</h2><p>{selectedWork.description}</p><div className="modal-meta"><span>{selectedWork.size}</span><a href="#commissions" onClick={() => setSelectedWork(null)}>Ask about this piece <ArrowRight size={15} /></a></div></div></div></div>}
    </main>
  );
}
