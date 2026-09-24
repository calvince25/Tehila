import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Check, CircleDot, Instagram, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Seo, SITE_URL } from "@/components/Seo";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { trpc } from "@/lib/trpc";
import { resolveStudioImage } from "@/lib/studio-images";

const whatsappNumber = "254113448688";

function openWhatsApp(details: Record<string, string>) {
  const message = [
    "Hi Tehila, I would love to enquire about a custom Threaded Forms piece.",
    "",
    ...Object.entries(details).filter(([, value]) => value.trim()).map(([key, value]) => `${key}: ${value}`),
  ].join("\n");
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", projectType: "A custom wall piece", room: "", size: "", budget: "", timeline: "", message: "" });
  const submitEnquiry = trpc.content.submitCommission.useMutation();
  const { data, isLoading, isFetching, isStale } = trpc.content.all.useQuery();
  const contactImage = useMemo(() => {
    const image = data?.images?.find((item) => item.name === "pink");
    if (!image?.imageUrl) return "/studio-assets/pink-orbit.jpg";
    return resolveStudioImage(image.imageUrl, image.updatedAt) ?? "/studio-assets/pink-orbit.jpg";
  }, [data?.images]);
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await submitEnquiry.mutateAsync({ name: form.name, email: form.email, project_type: form.projectType, room: form.room || null, size: form.size || null, budget: form.budget || null, timeline: form.timeline || null, message: form.message });
      openWhatsApp({ Name: form.name, Email: form.email, Project: form.projectType, Room: form.room, Size: form.size, Budget: form.budget, Timeline: form.timeline, Notes: form.message });
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your enquiry. Please try WhatsApp directly.");
    }
  };

  if (isLoading || (isStale && isFetching)) return <main className="journal-loading">Loading the studio…</main>;

  const serviceSchema = { "@context": "https://schema.org", "@type": "Service", name: "Custom string-art and fiber-art artwork", provider: { "@type": "Person", name: "Tehila", url: SITE_URL }, areaServed: [{ "@type": "City", name: "Nairobi" }, { "@type": "Country", name: "Kenya" }], description: "Personalized string-art and contemporary fiber-art wall pieces made by Tehila in Nairobi." };

  return <main className="contact-page">
    <Seo title="Contact custom string art in Nairobi — Threaded Forms" description="Enquire about a custom string-art or contemporary fiber-art wall piece made by Tehila in Nairobi, Kenya." path="/contact" jsonLd={serviceSchema} />
    <WhatsAppFloat />
    <header className="app-header"><a className="studio-logo" href="/"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><div className="header-right"><a className="header-instagram" href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={17} /> <span>Follow along</span></a><a className="contact-header-link" href="/">Back to studio</a></div></header>
    <section className="contact-hero"><div className="contact-hero-copy"><a className="back-journal" href="/"><ArrowLeft size={15} /> Back to the studio</a><p className="contact-kicker">CUSTOM WORK / NAIROBI + BEYOND</p><h1>A piece that<br /><em>starts with you.</em></h1><p className="contact-lead">Some spaces need something made for them. Tell me about the wall, the feeling, or the story you want to bring into the room — and we can begin there.</p><a className="primary-button" href="#enquiry">Start an enquiry <ArrowUpRight size={17} /></a></div><div className="contact-hero-art"><img src={contactImage} alt="Featured string-art wall piece by Tehila" fetchPriority="high" decoding="async" /><span>Original thread work<br />made slowly in Nairobi</span></div></section>
    <section className="contact-process"><div className="section-kicker"><span className="kicker-line" /> The way it works</div><div className="contact-process-grid"><article><b>01</b><h2>We talk it through.</h2><p>Share the room, approximate size, colors, references, and the feeling you want the piece to hold. A WhatsApp conversation is the easiest place to start.</p></article><article><b>02</b><h2>I make a proposal.</h2><p>I’ll come back with a thoughtful direction, practical details, and an honest quote based on the materials, scale, and time involved.</p></article><article><b>03</b><h2>It takes shape.</h2><p>Once the direction is right, I make the work by hand and keep you close to the process with progress notes and images along the way.</p></article></div></section>
    <section className="contact-enquiry" id="enquiry"><div className="contact-enquiry-intro"><div className="section-kicker light-kicker"><span className="kicker-line" /> Tell me a little</div><h2>Let’s make<br /><em>room for it.</em></h2><p>There is no perfect brief. The more you can share, the more useful my first reply can be. If you would rather talk, use the WhatsApp button and send a voice note.</p><a className="contact-whatsapp-link" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Open WhatsApp directly <ArrowUpRight size={15} /></a></div><form className="contact-form" onSubmit={submit}><div className="contact-form-grid"><label><span>Your name</span><input required value={form.name} onChange={event => update("name", event.target.value)} placeholder="Name" /></label><label><span>Email address</span><input required type="email" value={form.email} onChange={event => update("email", event.target.value)} placeholder="you@example.com" /></label><label><span>What are you imagining?</span><select value={form.projectType} onChange={event => update("projectType", event.target.value)}><option>A custom wall piece</option><option>A gift</option><option>A series for a hospitality or work space</option><option>Something I am not sure how to describe yet</option></select></label><label><span>Where will it live?</span><input value={form.room} onChange={event => update("room", event.target.value)} placeholder="Living room, office, hotel..." /></label><label><span>Approximate size</span><input value={form.size} onChange={event => update("size", event.target.value)} placeholder="For example, 80 × 80 cm" /></label><label><span>Working budget</span><select value={form.budget} onChange={event => update("budget", event.target.value)}><option value="">Prefer to discuss</option><option>Under KSh 43,500</option><option>KSh 43,500–87,000</option><option>KSh 87,000–145,000</option><option>Over KSh 145,000</option></select></label><label><span>When are you hoping for it?</span><input value={form.timeline} onChange={event => update("timeline", event.target.value)} placeholder="A month, a season, flexible..." /></label></div><label className="contact-field-full"><span>Tell me about the idea</span><textarea required rows={6} value={form.message} onChange={event => update("message", event.target.value)} placeholder="Colors, references, a story, the room, or simply what you want it to feel like..." /></label><button className="contact-submit" type="submit"><Send size={16} /> Send enquiry via WhatsApp</button>{sent && <p className="contact-sent"><Check size={16} /> Your enquiry is ready in WhatsApp. Send it there to start the conversation.</p>}</form></section>
    <footer className="app-footer"><a className="studio-logo" href="/"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><span>Made with thread, patience, and a little joy.</span><div className="footer-actions"><a href="https://www.instagram.com/t.ww2.k" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} /></a></div></footer>
  </main>;
}
