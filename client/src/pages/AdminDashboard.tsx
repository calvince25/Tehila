import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Check, FileText, ImagePlus, Inbox, LayoutDashboard, LogOut, Pencil, Plus, Save, ShoppingBag, Trash2, Upload, UserCheck, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

const emptyCanvas = { title: "", kind: "Original wall work", price: "", size: "", status: "available" as "available" | "one_of_one" | "reserved" | "coming_soon" | "sold", description: "", imageUrl: "", imageKey: "", sortOrder: 0 };
const emptyEvent = { title: "", type: "studio_visit" as const, description: "", venue: "", city: "Nairobi", startAt: "", endAt: "", accent: "coral" as const, isPublished: 1 };
const emptyImage = { name: "", label: "", altText: "", imageUrl: "", imageKey: "", sortOrder: 0 };
const emptyJournal = { slug: "", title: "", excerpt: "", body: "", category: "Studio note", imageUrl: "", imageKey: "", altText: "", publishedAt: "", isPublished: true, seoTitle: "", seoDescription: "", authorName: "Tehila" };

type CanvasForm = typeof emptyCanvas;
type EventForm = typeof emptyEvent;
type ImageForm = typeof emptyImage;
type JournalForm = typeof emptyJournal;
type CanvasRow = CanvasForm & { id: number; createdAt: Date; updatedAt: Date };
type EventRow = EventForm & { id: number; startAt: Date; endAt: Date; createdAt: Date; updatedAt: Date };
type ImageRow = ImageForm & { id: number; createdAt: Date; updatedAt: Date };
type JournalRow = { id: number; slug: string; title: string; excerpt: string; body: string; category: string; image_url: string; image_key: string | null; alt_text: string; published_at: string; updated_at: string; is_published: boolean; seo_title: string | null; seo_description: string | null; author_name: string };
type EnquiryRow = { id: number; created_at: string; name: string; email: string; project_type: string; room: string | null; size: string | null; budget: string | null; timeline: string | null; message: string; status: string };
type UserRow = { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; role: "user" | "admin"; isApproved: number; isDefaultAdmin: number; createdAt: Date; lastSignedIn: Date };
type OrderRow = { id: number; reference: string; customerName: string; phone: string; email: string | null; deliveryMethod: string; area: string; address: string; notes: string | null; items: string; subtotal: string; status: string; createdAt: Date; updatedAt: Date };

const orderStatusLabels: Record<string, string> = { new_enquiry: "New enquiry", awaiting_confirmation: "Awaiting confirmation", reserved: "Reserved", payment_pending: "Payment pending", paid: "Paid", preparing: "Preparing", ready_for_pickup: "Ready for pickup", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled" };

function resolveAdminImage(url: string | undefined) {
  if (!url) return "";
  const key = url.split("/").pop() ?? "";
  const legacy: Record<string, string> = {
    "pink-orbit_e98112f2.jpg": "/studio-assets/pink-orbit.jpg",
    "maker-at-work_575171a1.jpg": "/studio-assets/maker-at-work.jpg",
    "violet-orbit_ef8b1733.jpg": "/studio-assets/violet-orbit.jpg",
    "process-closeup_eccb9460.jpg": "/studio-assets/process-closeup.jpg",
    "woven-sun_b8375056.jpg": "/studio-assets/woven-sun.jpg",
    "textile-landscape_bcec7a53.jpg": "/studio-assets/textile-landscape.jpg",
    "studio-grid_499fcdaf.jpg": "/studio-assets/studio-grid.jpg",
  };
  return legacy[key] ?? url;
}

function getNairobiGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", hour: "numeric", hour12: false }).format(new Date()));
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour === 12) return "Good noon";
  if (hour > 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function orderWhatsAppUrl(order: OrderRow) {
  let items: Array<{ title: string; price: string; quantity: number }> = [];
  try { items = JSON.parse(order.items); } catch { /* keep the reply usable if legacy data is malformed */ }
  const message = ["Hello Tehila,", "", `I am following up on order ${order.reference}.`, "", "ORDER DETAILS", ...items.map((item, index) => `${index + 1}. ${item.title} — ${item.price}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`), `Artwork subtotal: ${order.subtotal}`, `Delivery: ${order.deliveryMethod} — to be confirmed separately`, "", `Customer: ${order.customerName}`, `Phone: ${order.phone}`, `Area: ${order.area}`, `Address: ${order.address}`, "", "Please confirm the next step."];
  return `https://wa.me/${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message.join("\n"))}`;
}

async function encodeFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    let chunk = "";
    for (let offset = index; offset < Math.min(index + chunkSize, bytes.length); offset += 1) chunk += String.fromCharCode(bytes[offset]);
    binary += chunk;
  }
  return btoa(binary);
}

function toLocalInput(value?: Date | string) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function DashboardHeader({ title, description, onAdd }: { title: string; description: string; onAdd?: () => void }) {
  return <div className="cms-page-header"><div><p className="cms-eyebrow">TEHILA'S STUDIO / CONTENT</p><h1>{title}</h1><p>{description}</p></div>{onAdd && <button className="cms-primary" onClick={onAdd}><Plus size={16} /> Add new</button>}</div>;
}

function AdminDashboardInner({ user }: { user: { role: "admin" | "user"; isDefaultAdmin: number } }) {
  const [location, setLocation] = useLocation();
  const [canvasForm, setCanvasForm] = useState<CanvasForm>(emptyCanvas);
  const [eventForm, setEventForm] = useState<EventForm>(emptyEvent);
  const [imageForm, setImageForm] = useState<ImageForm>(emptyImage);
  const [journalForm, setJournalForm] = useState<JournalForm>(emptyJournal);
  const [editingCanvas, setEditingCanvas] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [editingJournal, setEditingJournal] = useState<number | null>(null);
  const [canvasFile, setCanvasFile] = useState<File | null>(null);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const content = trpc.cms.all.useQuery(undefined, { enabled: isAdmin, retry: false });
  const usersQuery = trpc.users.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const ordersQuery = trpc.orders.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const upload = trpc.cms.uploadImage.useMutation();
  const createCanvas = trpc.cms.createCanvas.useMutation({ onSuccess: () => { toast.success("Canvas added to the shop."); content.refetch(); resetCanvas(); } });
  const updateCanvas = trpc.cms.updateCanvas.useMutation({ onSuccess: () => { toast.success("Canvas updated."); content.refetch(); resetCanvas(); } });
  const deleteCanvas = trpc.cms.deleteCanvas.useMutation({ onSuccess: () => { toast.success("Canvas removed from the shop."); content.refetch(); } });
  const createEvent = trpc.cms.createEvent.useMutation({ onSuccess: () => { toast.success("Event published to the studio calendar."); content.refetch(); resetEvent(); } });
  const updateEvent = trpc.cms.updateEvent.useMutation({ onSuccess: () => { toast.success("Event updated."); content.refetch(); resetEvent(); } });
  const deleteEvent = trpc.cms.deleteEvent.useMutation({ onSuccess: () => { toast.success("Event removed."); content.refetch(); } });
  const createImage = trpc.cms.createImage.useMutation({ onSuccess: () => { toast.success("Portfolio image added."); content.refetch(); resetImage(); } });
  const updateImage = trpc.cms.updateImage.useMutation({ onSuccess: () => { toast.success("Portfolio image updated."); content.refetch(); resetImage(); } });
  const deleteImage = trpc.cms.deleteImage.useMutation({ onSuccess: () => { toast.success("Portfolio image removed."); content.refetch(); } });
  const createJournal = trpc.cms.createJournal.useMutation({ onSuccess: () => { toast.success("Journal post published."); content.refetch(); resetJournal(); } });
  const updateJournal = trpc.cms.updateJournal.useMutation({ onSuccess: () => { toast.success("Journal post updated."); content.refetch(); resetJournal(); } });
  const deleteJournal = trpc.cms.deleteJournal.useMutation({ onSuccess: () => { toast.success("Journal post removed."); content.refetch(); } });
  const deleteEnquiry = trpc.cms.deleteEnquiry.useMutation({ onSuccess: () => { toast.success("Enquiry deleted."); content.refetch(); } });
  const approveUser = trpc.users.approve.useMutation({ onSuccess: () => { toast.success("User approval updated."); usersQuery.refetch(); } });
  const deleteUser = trpc.users.delete.useMutation({ onSuccess: () => { toast.success("User removed."); usersQuery.refetch(); } });
  const updateOrderStatus = trpc.orders.updateStatus.useMutation({ onSuccess: () => { toast.success("Order status updated."); ordersQuery.refetch(); } });
  const deleteOrder = trpc.orders.delete.useMutation({ onSuccess: () => { toast.success("Order deleted."); ordersQuery.refetch(); } });

  const section = location === "/admin/events" ? "events" : location === "/admin/images" ? "images" : location === "/admin/canvases" ? "canvases" : location === "/admin/journal" ? "journal" : location === "/admin/enquiries" ? "enquiries" : location === "/admin/users" ? "users" : location === "/admin/orders" ? "orders" : "overview";
  const data = content.data as { canvases: CanvasRow[]; events: EventRow[]; images: ImageRow[]; journal: JournalRow[]; enquiries: EnquiryRow[] } | undefined;
  const userRows = usersQuery.data as UserRow[] | undefined;
  const orderRows = ordersQuery.data as OrderRow[] | undefined;
  const counts = useMemo(() => ({ canvases: data?.canvases?.length ?? 0, events: data?.events?.length ?? 0, images: data?.images?.length ?? 0, journal: data?.journal?.length ?? 0, enquiries: data?.enquiries?.length ?? 0 }), [data]);

  function resetCanvas() { setCanvasForm(emptyCanvas); setCanvasFile(null); setEditingCanvas(null); }
  function resetEvent() { setEventForm(emptyEvent); setEventFile(null); setEditingEvent(null); }
  function resetImage() { setImageForm(emptyImage); setImageFile(null); setEditingImage(null); }
  function resetJournal() { setJournalForm(emptyJournal); setImageFile(null); setEditingJournal(null); }
  function editCanvas(item: CanvasRow) { setCanvasForm({ title: item.title, kind: item.kind, price: item.price, size: item.size, status: item.status, description: item.description, imageUrl: item.imageUrl, imageKey: item.imageKey ?? "", sortOrder: item.sortOrder }); setEditingCanvas(item.id); setSection("canvases"); }
  function editEvent(item: EventRow) { setEventForm({ title: item.title, type: item.type, description: item.description, venue: item.venue, city: item.city, startAt: toLocalInput(item.startAt), endAt: toLocalInput(item.endAt), accent: item.accent, isPublished: item.isPublished }); setEditingEvent(item.id); setSection("events"); }
  function editImage(item: ImageRow) { setImageForm({ name: item.name, label: item.label, altText: item.altText, imageUrl: item.imageUrl, imageKey: item.imageKey ?? "", sortOrder: item.sortOrder }); setEditingImage(item.id); setSection("images"); }
  function editJournal(item: JournalRow) { setJournalForm({ slug: item.slug, title: item.title, excerpt: item.excerpt, body: item.body, category: item.category, imageUrl: item.image_url, imageKey: item.image_key ?? "", altText: item.alt_text, publishedAt: toLocalInput(item.published_at), isPublished: item.is_published, seoTitle: item.seo_title ?? "", seoDescription: item.seo_description ?? "", authorName: item.author_name }); setEditingJournal(item.id); setSection("journal"); }
  function setSection(next: string) { setLocation(next === "overview" ? "/admin" : `/admin/${next}`); }
  async function maybeUpload(file: File | null) { if (!file) return null; return upload.mutateAsync({ fileName: file.name, contentType: file.type, data: await encodeFile(file) }); }

  async function saveCanvas() {
    try {
      const uploaded = await maybeUpload(canvasFile);
      const dataToSave = { ...canvasForm, imageUrl: uploaded?.url ?? canvasForm.imageUrl, imageKey: uploaded?.key ?? (canvasForm.imageKey || null) };
      if (!dataToSave.imageUrl) throw new Error("Choose an image before saving this canvas.");
      if (editingCanvas) updateCanvas.mutate({ id: editingCanvas, data: dataToSave }); else createCanvas.mutate(dataToSave);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the canvas."); }
  }

  async function saveEvent() {
    try {
      const eventData = { ...eventForm, startAt: new Date(eventForm.startAt), endAt: new Date(eventForm.endAt) };
      if (eventData.startAt >= eventData.endAt) throw new Error("The end time must be after the start time.");
      if (editingEvent) updateEvent.mutate({ id: editingEvent, data: eventData }); else createEvent.mutate(eventData);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the event."); }
  }

  async function saveImage() {
    try {
      const uploaded = await maybeUpload(imageFile);
      const dataToSave = { ...imageForm, imageUrl: uploaded?.url ?? imageForm.imageUrl, imageKey: uploaded?.key ?? (imageForm.imageKey || null) };
      if (!dataToSave.imageUrl) throw new Error("Choose an image before saving this record.");
      if (editingImage) updateImage.mutate({ id: editingImage, data: dataToSave }); else createImage.mutate(dataToSave);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the image."); }
  }

  async function saveJournal() {
    try {
      const uploaded = await maybeUpload(imageFile);
      const dataToSave = { ...journalForm, imageUrl: uploaded?.url ?? journalForm.imageUrl, imageKey: uploaded?.key ?? (journalForm.imageKey || null), publishedAt: new Date(journalForm.publishedAt) };
      if (!dataToSave.imageUrl) throw new Error("Choose a cover image before saving this journal post.");
      if (editingJournal) updateJournal.mutate({ id: editingJournal, data: dataToSave }); else createJournal.mutate(dataToSave);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the journal post."); }
  }

  if (!isAdmin) return <div className="cms-denied"><p className="cms-eyebrow">THREADed FORMS / PRIVATE</p><h1>Admin access only.</h1><p>This desk is reserved for Tehila's studio account.</p></div>;

  return <div className="cms-shell">
    {section === "overview" && <>
      <DashboardHeader title={`${getNairobiGreeting()}, Tehila.`} description="Your private studio desk for keeping the shop, calendar, and portfolio current." />
      <div className="cms-stat-grid"><button onClick={() => setSection("canvases")} className="cms-stat"><span>SHOP PIECES</span><strong>{counts.canvases}</strong><small>Manage canvases <ArrowUpRight size={14} /></small></button><button onClick={() => setSection("events")} className="cms-stat"><span>UPCOMING EVENTS</span><strong>{counts.events}</strong><small>Update the calendar <ArrowUpRight size={14} /></small></button><button onClick={() => setSection("journal")} className="cms-stat"><span>JOURNAL POSTS</span><strong>{counts.journal}</strong><small>Write a studio note <ArrowUpRight size={14} /></small></button><button onClick={() => setSection("images")} className="cms-stat"><span>PORTFOLIO IMAGES</span><strong>{counts.images}</strong><small>Replace any image <ArrowUpRight size={14} /></small></button></div>
      <div className="cms-overview-grid"><section className="cms-panel cms-welcome"><p className="cms-eyebrow">A SMALL NOTE</p><h2>The quiet work is the work.</h2><p>Add a canvas when a new piece is ready, publish events as dates become firm, write a journal note when there is something to say, and replace portfolio images whenever the studio changes.</p><button className="cms-primary" onClick={() => setSection("journal")}><FileText size={16} /> Write a journal note</button></section><section className="cms-panel"><div className="cms-panel-heading"><div><p className="cms-eyebrow">QUICK LINKS</p><h2>Keep things moving</h2></div></div><button className="cms-quick-link" onClick={() => setSection("events")}><CalendarDays size={18} /><span><b>Plan the next gathering</b><small>Visitors can save dates to Google or Apple Calendar.</small></span><ArrowUpRight size={16} /></button><button className="cms-quick-link" onClick={() => setSection("journal")}><FileText size={18} /><span><b>Write from the studio</b><small>New journal posts are stored in Supabase and get their own URL.</small></span><ArrowUpRight size={16} /></button><button className="cms-quick-link" onClick={() => setSection("images")}><ImagePlus size={18} /><span><b>Refresh the visual story</b><small>Swap any image without touching the code.</small></span><ArrowUpRight size={16} /></button></section></div>
    </>}

    {section === "canvases" && <><DashboardHeader title="Shop canvases" description="Add, edit, or remove the original pieces shown in the shop." onAdd={resetCanvas} /><div className="cms-two-column"><section className="cms-panel cms-list">{data?.canvases?.map((item) => <div className="cms-record" key={item.id}><img src={resolveAdminImage(item.imageUrl)} alt={item.title} /><div><span className="cms-record-status">{item.status.replace("_", " ")}</span><h3>{item.title}</h3><p>{item.kind} · {item.size} · {item.price}</p></div><div className="cms-record-actions"><button onClick={() => editCanvas(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button onClick={() => deleteCanvas.mutate({ id: item.id })} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingCanvas ? "Edit canvas" : "New canvas"} onClose={editingCanvas ? resetCanvas : undefined} /><div className="cms-form-grid"><Field label="Title" value={canvasForm.title} onChange={(value) => setCanvasForm({ ...canvasForm, title: value })} /><Field label="Kind" value={canvasForm.kind} onChange={(value) => setCanvasForm({ ...canvasForm, kind: value })} /><Field label="Price (KSh)" value={canvasForm.price} onChange={(value) => setCanvasForm({ ...canvasForm, price: value })} /><Field label="Size" value={canvasForm.size} onChange={(value) => setCanvasForm({ ...canvasForm, size: value })} /><label className="cms-field"><span>Status</span><select value={canvasForm.status} onChange={(event) => setCanvasForm({ ...canvasForm, status: event.target.value as CanvasForm["status"] })}><option value="available">Available</option><option value="one_of_one">One of one</option><option value="reserved">Reserved</option><option value="coming_soon">Coming soon</option><option value="sold">Sold</option></select></label><Field label="Sort order" type="number" value={String(canvasForm.sortOrder)} onChange={(value) => setCanvasForm({ ...canvasForm, sortOrder: Number(value) })} /></div><TextField label="Description" value={canvasForm.description} onChange={(value) => setCanvasForm({ ...canvasForm, description: value })} /><ImagePicker file={canvasFile} currentUrl={canvasForm.imageUrl} onFile={setCanvasFile} /><button className="cms-primary cms-save" onClick={saveCanvas} disabled={upload.isPending || createCanvas.isPending || updateCanvas.isPending}><Save size={16} /> {editingCanvas ? "Save changes" : "Add canvas"}</button></section></div></>}

    {section === "events" && <><DashboardHeader title="Upcoming events" description="Keep open studios, exhibitions, and workshops current for visitors." onAdd={resetEvent} /><div className="cms-two-column"><section className="cms-panel cms-list">{data?.events?.map((item) => <div className="cms-event-record" key={item.id}><div className="cms-date-block"><b>{new Date(item.startAt).toLocaleString("en-US", { month: "short" }).toUpperCase()}</b><strong>{new Date(item.startAt).getDate()}</strong></div><div><span className="cms-record-status">{item.isPublished ? "Published" : "Draft"}</span><h3>{item.title}</h3><p>{item.venue} · {item.city}</p><small>{new Date(item.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small></div><div className="cms-record-actions"><button onClick={() => editEvent(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button onClick={() => deleteEvent.mutate({ id: item.id })} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingEvent ? "Edit event" : "New event"} onClose={editingEvent ? resetEvent : undefined} /><div className="cms-form-grid"><Field label="Title" value={eventForm.title} onChange={(value) => setEventForm({ ...eventForm, title: value })} /><label className="cms-field"><span>Type</span><select value={eventForm.type} onChange={(event) => setEventForm({ ...eventForm, type: event.target.value as EventForm["type"] })}><option value="studio_visit">Studio visit</option><option value="group_exhibition">Group exhibition</option><option value="workshop">Workshop</option></select></label><Field label="Venue" value={eventForm.venue} onChange={(value) => setEventForm({ ...eventForm, venue: value })} /><Field label="City" value={eventForm.city} onChange={(value) => setEventForm({ ...eventForm, city: value })} /><label className="cms-field"><span>Starts</span><input type="datetime-local" value={eventForm.startAt} onChange={(event) => setEventForm({ ...eventForm, startAt: event.target.value })} /></label><label className="cms-field"><span>Ends</span><input type="datetime-local" value={eventForm.endAt} onChange={(event) => setEventForm({ ...eventForm, endAt: event.target.value })} /></label><label className="cms-field"><span>Accent</span><select value={eventForm.accent} onChange={(event) => setEventForm({ ...eventForm, accent: event.target.value as EventForm["accent"] })}><option value="coral">Coral</option><option value="sage">Sage</option><option value="plum">Plum</option></select></label><label className="cms-field"><span>Visibility</span><select value={eventForm.isPublished} onChange={(event) => setEventForm({ ...eventForm, isPublished: Number(event.target.value) })}><option value={1}>Published</option><option value={0}>Draft</option></select></label></div><TextField label="Description" value={eventForm.description} onChange={(value) => setEventForm({ ...eventForm, description: value })} /><button className="cms-primary cms-save" onClick={saveEvent} disabled={createEvent.isPending || updateEvent.isPending}><Save size={16} /> {editingEvent ? "Save changes" : "Publish event"}</button></section></div></>}

    {section === "images" && <><DashboardHeader title="Portfolio images" description="Replace the images used across the public studio without editing the site." onAdd={resetImage} /><div className="cms-two-column"><section className="cms-panel cms-image-grid">{data?.images?.map((item) => <div className="cms-image-record" key={item.id}><img src={resolveAdminImage(item.imageUrl)} alt={item.altText} /><div className="cms-image-record-body"><div><span className="cms-record-status">{item.name}</span><h3>{item.label}</h3><p>{item.altText}</p></div><div className="cms-record-actions"><button onClick={() => editImage(item)} aria-label={`Edit ${item.label}`}><Pencil size={15} /></button><button onClick={() => deleteImage.mutate({ id: item.id })} aria-label={`Delete ${item.label}`}><Trash2 size={15} /></button></div></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingImage ? "Replace image" : "New portfolio image"} onClose={editingImage ? resetImage : undefined} /><div className="cms-form-grid"><Field label="Internal name" value={imageForm.name} onChange={(value) => setImageForm({ ...imageForm, name: value })} /><Field label="Label" value={imageForm.label} onChange={(value) => setImageForm({ ...imageForm, label: value })} /><Field label="Sort order" type="number" value={String(imageForm.sortOrder)} onChange={(value) => setImageForm({ ...imageForm, sortOrder: Number(value) })} /></div><TextField label="Alt text" value={imageForm.altText} onChange={(value) => setImageForm({ ...imageForm, altText: value })} /><ImagePicker file={imageFile} currentUrl={imageForm.imageUrl} onFile={setImageFile} /><button className="cms-primary cms-save" onClick={saveImage} disabled={upload.isPending || createImage.isPending || updateImage.isPending}><Upload size={16} /> {editingImage ? "Replace image" : "Add image"}</button></section></div></>}

    {section === "journal" && <><DashboardHeader title="Studio journal" description="Write personal notes, process stories, and new-work updates. Every published post gets its own SEO-ready URL." onAdd={resetJournal} /><div className="cms-two-column"><section className="cms-panel cms-list">{data?.journal?.map((item) => <div className="cms-journal-record" key={item.id}><img src={resolveAdminImage(item.image_url)} alt={item.alt_text} /><div><span className="cms-record-status">{item.is_published ? "Published" : "Draft"} · {item.category}</span><h3>{item.title}</h3><p>{item.excerpt}</p><small>/journal/{item.slug}</small></div><div className="cms-record-actions"><button onClick={() => editJournal(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button onClick={() => deleteJournal.mutate({ id: item.id })} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingJournal ? "Edit journal post" : "New journal post"} onClose={editingJournal ? resetJournal : undefined} /><div className="cms-form-grid"><Field label="Title" value={journalForm.title} onChange={(value) => setJournalForm({ ...journalForm, title: value })} /><Field label="Slug" value={journalForm.slug} onChange={(value) => setJournalForm({ ...journalForm, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} /><Field label="Category" value={journalForm.category} onChange={(value) => setJournalForm({ ...journalForm, category: value })} /><Field label="Author" value={journalForm.authorName} onChange={(value) => setJournalForm({ ...journalForm, authorName: value })} /><label className="cms-field"><span>Published at</span><input type="datetime-local" value={journalForm.publishedAt} onChange={(event) => setJournalForm({ ...journalForm, publishedAt: event.target.value })} /></label><label className="cms-field"><span>Visibility</span><select value={journalForm.isPublished ? "published" : "draft"} onChange={(event) => setJournalForm({ ...journalForm, isPublished: event.target.value === "published" })}><option value="published">Published</option><option value="draft">Draft</option></select></label></div><TextField label="Excerpt" value={journalForm.excerpt} onChange={(value) => setJournalForm({ ...journalForm, excerpt: value })} /><TextField label="Body" value={journalForm.body} onChange={(value) => setJournalForm({ ...journalForm, body: value })} /><div className="cms-form-grid"><Field label="SEO title" value={journalForm.seoTitle} onChange={(value) => setJournalForm({ ...journalForm, seoTitle: value })} /><Field label="SEO description" value={journalForm.seoDescription} onChange={(value) => setJournalForm({ ...journalForm, seoDescription: value })} /></div><ImagePicker file={imageFile} currentUrl={journalForm.imageUrl} onFile={setImageFile} /><button className="cms-primary cms-save" onClick={saveJournal} disabled={upload.isPending || createJournal.isPending || updateJournal.isPending}><Save size={16} /> {editingJournal ? "Save journal changes" : "Publish journal post"}</button></section></div></>}
    {section === "enquiries" && <><DashboardHeader title="Commission enquiries" description="Read the project briefs visitors send from the commission page. Delete messages after you have followed up." /><section className="cms-panel cms-enquiries-list">{data?.enquiries?.length ? data.enquiries.map((item) => <article className="cms-enquiry-record" key={item.id}><div className="cms-enquiry-heading"><div><span className="cms-record-status">{item.project_type}</span><h2>{item.name}</h2><a href={`mailto:${item.email}`}>{item.email}</a></div><div className="cms-enquiry-date">{new Date(item.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div></div><div className="cms-enquiry-details">{item.room && <span><b>Room</b>{item.room}</span>}{item.size && <span><b>Size</b>{item.size}</span>}{item.budget && <span><b>Budget</b>{item.budget}</span>}{item.timeline && <span><b>Timeline</b>{item.timeline}</span>}</div><p>{item.message}</p><div className="cms-record-actions"><a className="cms-text-action" href={`https://wa.me/254113448688?text=${encodeURIComponent(`Hi ${item.name}, thank you for your Threaded Forms enquiry.`)}`} target="_blank" rel="noreferrer">Reply on WhatsApp <ArrowUpRight size={14} /></a><button onClick={() => deleteEnquiry.mutate({ id: item.id })} aria-label={`Delete enquiry from ${item.name}`}><Trash2 size={15} /></button></div></article>) : <div className="cms-empty-state"><Inbox size={28} /><h2>No enquiries yet.</h2><p>New commission briefs will appear here when visitors submit the form.</p></div>}</section></>}

    {section === "orders" && <><DashboardHeader title="Order requests" description="Review WhatsApp checkout requests, confirm delivery separately, and keep artwork availability current." /><section className="cms-panel cms-orders-list">{orderRows?.length ? orderRows.map((order) => { let items: Array<{ title: string; size: string; price: string; quantity: number }> = []; try { items = JSON.parse(order.items); } catch {} return <article className="cms-order-record" key={order.id}><div className="cms-order-heading"><div><span className="cms-record-status">{order.reference}</span><h2>{order.customerName}</h2><a href={order.email ? `mailto:${order.email}` : `tel:${order.phone}`}>{order.email || order.phone}</a></div><div className="cms-enquiry-date">{new Date(order.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div></div><div className="cms-order-items">{items.map((item, index) => <div key={`${item.title}-${index}`}><span>{item.quantity} × {item.title}</span><small>{item.size} · {item.price}</small></div>)}</div><div className="cms-enquiry-details"><span><b>Artwork subtotal</b>{order.subtotal}</span><span><b>Delivery</b>{order.deliveryMethod}</span><span><b>Area</b>{order.area}</span><span><b>Address</b>{order.address}</span></div>{order.notes && <p>{order.notes}</p>}<div className="cms-order-controls"><select value={order.status} onChange={(event) => updateOrderStatus.mutate({ id: order.id, status: event.target.value as never })}>{Object.entries(orderStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><a className="cms-text-action" href={orderWhatsAppUrl(order)} target="_blank" rel="noreferrer">Open WhatsApp <ArrowUpRight size={14} /></a><button onClick={() => { if (window.confirm(`Delete order ${order.reference}?`)) deleteOrder.mutate({ id: order.id }); }} aria-label={`Delete order ${order.reference}`}><Trash2 size={15} /></button></div></article> }) : <div className="cms-empty-state"><ShoppingBag size={28} /><h2>No order requests yet.</h2><p>Customer WhatsApp checkout requests will appear here.</p></div>}</section></>}

    {section === "users" && <><DashboardHeader title="Studio users" description="Approve new accounts before they can log in. Every approved admin has full studio access." /><section className="cms-panel cms-users-list">{userRows?.length ? userRows.map((item) => <article className="cms-user-record" key={item.id}><div className="cms-user-avatar">{(item.name || item.email || "?").slice(0, 1).toUpperCase()}</div><div className="cms-user-main"><div className="cms-user-title"><h2>{item.name || "Unnamed user"}</h2>{item.isDefaultAdmin === 1 && <span className="cms-default-badge">Default admin</span>}{item.role === "admin" && item.isDefaultAdmin !== 1 && <span className="cms-record-status">Admin</span>}</div><a href={item.email ? `mailto:${item.email}` : undefined}>{item.email || "No email"}</a><small>Registered {new Date(item.createdAt).toLocaleDateString()} · {item.loginMethod || "account"}</small></div><div className="cms-user-status"><span className={`cms-approval-pill ${item.isApproved === 1 ? "approved" : "pending"}`}>{item.isApproved === 1 ? <><Check size={13} /> Approved</> : "Pending approval"}</span>{item.isDefaultAdmin !== 1 && <div className="cms-record-actions"><button onClick={() => approveUser.mutate({ id: item.id, isApproved: item.isApproved === 1 ? 0 : 1 })} aria-label={`${item.isApproved === 1 ? "Revoke" : "Approve"} ${item.name || item.email}`}>{item.isApproved === 1 ? <UserCheck size={15} /> : <Check size={15} />}</button><button onClick={() => { if (window.confirm(`Remove ${item.name || item.email} from the studio?`)) deleteUser.mutate({ id: item.id }); }} aria-label={`Delete ${item.name || item.email}`}><Trash2 size={15} /></button></div>}</div></article>) : <div className="cms-empty-state"><Users size={28} /><h2>No registered users yet.</h2><p>The first registration will become the default admin.</p></div>}</section></>}

  </div>;
}

function FormTitle({ title, onClose }: { title: string; onClose?: () => void }) { return <div className="cms-panel-heading"><div><p className="cms-eyebrow">CONTENT EDITOR</p><h2>{title}</h2></div>{onClose && <button className="cms-icon-button" onClick={onClose} aria-label="Cancel editing"><X size={16} /></button>}</div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="cms-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="cms-field cms-field-full"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} /></label>; }
function ImagePicker({ file, currentUrl, onFile }: { file: File | null; currentUrl: string; onFile: (file: File | null) => void }) { return <div className="cms-upload"><div className="cms-upload-preview">{currentUrl ? <img src={file ? URL.createObjectURL(file) : resolveAdminImage(currentUrl)} alt="Selected preview" /> : <ImagePlus size={24} />}</div><div><label className="cms-upload-button"><Upload size={15} /> {file ? "Choose a different image" : "Upload image"}<input type="file" accept="image/*" onChange={(event) => onFile(event.target.files?.[0] ?? null)} /></label><small>{file?.name ?? (currentUrl ? "Current image will stay unless you choose a new file." : "JPG, PNG, or WebP · max 6 MB")}</small></div></div>; }

export default function AdminDashboard() {
  return <DashboardLayout>{({ user }) => <AdminDashboardInner user={user} />}</DashboardLayout>;
}
