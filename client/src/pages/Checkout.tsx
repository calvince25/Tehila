import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Seo } from "@/components/Seo";

type CartItem = { id?: number; title: string; size: string; price: string; image: string; quantity: number };
type DeliveryMethod = "Pick-up Mtaani" | "Delivery elsewhere in Kenya" | "Studio pickup";

const CART_KEY = "threaded-forms-cart";
const WHATSAPP_NUMBER = "254113448688";

function parsePrice(value: string) {
  const match = value.replace(/,/g, "").match(/([\d]+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function formatKsh(value: number) {
  return `KSh ${value.toLocaleString("en-KE")}`;
}

function readCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>(readCart);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("Pick-up Mtaani");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const createOrder = trpc.orders.create.useMutation();
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0), [cart]);

  function saveCart(next: CartItem[]) {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  function changeQuantity(index: number, delta: number) {
    const next = cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, Math.min(10, item.quantity + delta)) } : item);
    saveCart(next);
  }

  function removeItem(index: number) {
    saveCart(cart.filter((_, itemIndex) => itemIndex !== index));
  }

  function buildWhatsAppMessage(reference: string) {
    const lines = [
      "Hello Tehila,",
      "",
      "I would like to place an order through Threaded Forms.",
      "",
      "ORDER REFERENCE",
      reference,
      "",
      "SELECTED CANVASES",
      ...cart.flatMap((item, index) => [`${index + 1}. ${item.title}`, `   Size: ${item.size}`, `   Price: ${item.price}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`, ""]),
      "ARTWORK SUBTOTAL",
      formatKsh(subtotal),
      "",
      "DELIVERY",
      `Method: ${deliveryMethod}`,
      "Delivery cost: To be confirmed separately",
      "",
      "CUSTOMER DETAILS",
      `Name: ${customerName.trim()}`,
      `Phone: ${phone.trim()}`,
      `Email: ${email.trim() || "Not provided"}`,
      `Area/Town: ${area.trim()}`,
      `Exact address: ${address.trim()}`,
      ...(notes.trim() ? ["", `Additional notes: ${notes.trim()}`] : []),
      "",
      "Please confirm availability, delivery cost, and payment instructions.",
      "",
      "Thank you.",
    ];
    return lines.join("\n");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) return toast.error("Add at least one canvas before checking out.");
    if (!/^\+?[0-9\s().-]{7,40}$/.test(phone.trim())) return toast.error("Enter a valid local or international phone number.");
    try {
      const result = await createOrder.mutateAsync({
        customerName,
        phone,
        email,
        deliveryMethod,
        area,
        address,
        notes,
        subtotal: formatKsh(subtotal),
        items: cart.map(({ id, title, size, price, quantity }) => ({ id, title, size, price, quantity })),
      });
      const message = buildWhatsAppMessage(result.reference);
      localStorage.removeItem(CART_KEY);
      setCart([]);
      setConfirmation(result.reference);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not prepare your order. Please try again.");
    }
  }

  if (confirmation) return <main className="checkout-page"><Seo title="Order request prepared — Threaded Forms" description="Your Threaded Forms order request has been prepared." path="/checkout" /><section className="checkout-confirmation"><span className="checkout-confirmation-icon"><Check size={28} /></span><p className="checkout-kicker">ORDER REQUEST RECEIVED</p><h1>Thank you, your request is ready.</h1><p>Your order reference is <strong>{confirmation}</strong>. WhatsApp should have opened in a new tab with your complete order details.</p><p>Tehila will confirm availability, delivery cost, and payment instructions with you directly.</p><div className="checkout-actions"><button className="primary-button" onClick={() => setLocation("/")}><ArrowLeft size={16} /> Return to studio</button><button className="quiet-link" onClick={() => setLocation("/")} >Continue browsing <ArrowRight size={16} /></button></div></section></main>;

  return <main className="checkout-page"><Seo title="Checkout — Threaded Forms" description="Request one or more original string-art canvases from Tehila's Nairobi studio." path="/checkout" /><header className="checkout-header"><a href="/" onClick={(event) => { event.preventDefault(); setLocation("/"); }}><span className="logo-mark">◉</span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><button className="quiet-link" onClick={() => setLocation("/")}><ArrowLeft size={15} /> Back to shop</button></header><div className="checkout-layout"><section><p className="checkout-kicker">YOUR ORDER / WHATSAPP CHECKOUT</p><h1>Take a piece<br /><em>home.</em></h1><p className="checkout-intro">Delivery is arranged separately so Tehila can confirm the best option for your location.</p>{cart.length ? <div className="checkout-cart">{cart.map((item, index) => <article className="checkout-item" key={`${item.title}-${index}`}><img src={item.image} alt={item.title} /><div className="checkout-item-copy"><h2>{item.title}</h2><p>{item.size}</p><strong>{item.price}</strong><div className="checkout-quantity"><button type="button" onClick={() => changeQuantity(index, -1)} aria-label={`Decrease ${item.title} quantity`}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(index, 1)} aria-label={`Increase ${item.title} quantity`}><Plus size={14} /></button><button type="button" className="checkout-remove" onClick={() => removeItem(index)} aria-label={`Remove ${item.title}`}><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="checkout-empty"><h2>Your order is empty.</h2><p>Choose one or more canvases from the shop to begin.</p><button className="primary-button" onClick={() => setLocation("/")}><ArrowLeft size={16} /> Browse the shop</button></div>}</section><section className="checkout-form-panel"><div className="checkout-summary"><span>ARTWORK SUBTOTAL</span><strong>{formatKsh(subtotal)}</strong><small>Delivery cost is confirmed separately by Tehila.</small></div><form onSubmit={submit}><p className="checkout-form-kicker">CUSTOMER DETAILS</p><label className="checkout-field"><span>Full name</span><input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your full name" /></label><label className="checkout-field"><span>Phone number</span><input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 712 345 678" /></label><label className="checkout-field"><span>Email <small>optional</small></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label className="checkout-field"><span>Delivery method</span><select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as DeliveryMethod)}><option>Pick-up Mtaani</option><option>Delivery elsewhere in Kenya</option><option>Studio pickup</option></select></label><label className="checkout-field"><span>Area or town</span><input required value={area} onChange={(event) => setArea(event.target.value)} placeholder="For example, Kilimani or Nakuru" /></label><label className="checkout-field"><span>Exact address</span><textarea required value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Building, street, estate, or pickup details" rows={3} /></label><label className="checkout-field"><span>Additional notes <small>optional</small></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything Tehila should know?" rows={3} /></label><button className="primary-button checkout-submit" type="submit" disabled={!cart.length || createOrder.isPending}>{createOrder.isPending ? "Preparing your request…" : "Prepare WhatsApp order"}<ArrowRight size={17} /></button><p className="checkout-disclaimer">Your order request will be saved, then WhatsApp will open with a formal summary. Payment and delivery are confirmed manually by Tehila.</p></form></section></div></main>;
}
