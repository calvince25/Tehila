import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ImagePlus, LayoutDashboard, LogOut, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const emptyCanvas = { title: "", kind: "Original wall work", price: "", size: "", status: "available" as const, description: "", imageUrl: "", imageKey: "", sortOrder: 0 };
const emptyEvent = { title: "", type: "studio_visit" as const, description: "", venue: "", city: "Nairobi", startAt: "", endAt: "", accent: "coral" as const, isPublished: 1 };
const emptyImage = { name: "", label: "", altText: "", imageUrl: "", imageKey: "", sortOrder: 0 };

type CanvasForm = typeof emptyCanvas;
type EventForm = typeof emptyEvent;
type ImageForm = typeof emptyImage;
type CanvasRow = CanvasForm & { id: number; createdAt: Date; updatedAt: Date };
type EventRow = EventForm & { id: number; startAt: Date; endAt: Date; createdAt: Date; updatedAt: Date };
type ImageRow = ImageForm & { id: number; createdAt: Date; updatedAt: Date };

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

function AdminDashboardInner() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [canvasForm, setCanvasForm] = useState<CanvasForm>(emptyCanvas);
  const [eventForm, setEventForm] = useState<EventForm>(emptyEvent);
  const [imageForm, setImageForm] = useState<ImageForm>(emptyImage);
  const [editingCanvas, setEditingCanvas] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [canvasFile, setCanvasFile] = useState<File | null>(null);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const content = trpc.cms.all.useQuery(undefined, { enabled: isAdmin, retry: false });
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

  const section = location === "/admin/events" ? "events" : location === "/admin/images" ? "images" : location === "/admin/canvases" ? "canvases" : "overview";
  const data = content.data as { canvases: CanvasRow[]; events: EventRow[]; images: ImageRow[] } | undefined;
  const counts = useMemo(() => ({ canvases: data?.canvases?.length ?? 0, events: data?.events?.length ?? 0, images: data?.images?.length ?? 0 }), [data]);

  function resetCanvas() { setCanvasForm(emptyCanvas); setCanvasFile(null); setEditingCanvas(null); }
  function resetEvent() { setEventForm(emptyEvent); setEventFile(null); setEditingEvent(null); }
  function resetImage() { setImageForm(emptyImage); setImageFile(null); setEditingImage(null); }
  function editCanvas(item: CanvasRow) { setCanvasForm({ title: item.title, kind: item.kind, price: item.price, size: item.size, status: item.status, description: item.description, imageUrl: item.imageUrl, imageKey: item.imageKey ?? "", sortOrder: item.sortOrder }); setEditingCanvas(item.id); setSection("canvases"); }
  function editEvent(item: EventRow) { setEventForm({ title: item.title, type: item.type, description: item.description, venue: item.venue, city: item.city, startAt: toLocalInput(item.startAt), endAt: toLocalInput(item.endAt), accent: item.accent, isPublished: item.isPublished }); setEditingEvent(item.id); setSection("events"); }
  function editImage(item: ImageRow) { setImageForm({ name: item.name, label: item.label, altText: item.altText, imageUrl: item.imageUrl, imageKey: item.imageKey ?? "", sortOrder: item.sortOrder }); setEditingImage(item.id); setSection("images"); }
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

  if (authLoading || content.isLoading) return <div className="cms-loading">Opening the studio desk…</div>;
  if (!user) return null;
  if (!isAdmin) return <div className="cms-denied"><p className="cms-eyebrow">THREADed FORMS / PRIVATE</p><h1>Admin access only.</h1><p>This desk is reserved for Tehila's studio account.</p></div>;

  return <div className="cms-shell">
    {section === "overview" && <>
      <DashboardHeader title="Good morning, Tehila." description="Your private studio desk for keeping the shop, calendar, and portfolio current." />
      <div className="cms-stat-grid"><button onClick={() => setSection("canvases")} className="cms-stat"><span>SHOP PIECES</span><strong>{counts.canvases}</strong><small>Manage canvases <ArrowUpRight size={14} /></small></button><button onClick={() => setSection("events")} className="cms-stat"><span>UPCOMING EVENTS</span><strong>{counts.events}</strong><small>Update the calendar <ArrowUpRight size={14} /></small></button><button onClick={() => setSection("images")} className="cms-stat"><span>PORTFOLIO IMAGES</span><strong>{counts.images}</strong><small>Replace any image <ArrowUpRight size={14} /></small></button></div>
      <div className="cms-overview-grid"><section className="cms-panel cms-welcome"><p className="cms-eyebrow">A SMALL NOTE</p><h2>The quiet work is the work.</h2><p>Add a canvas when a new piece is ready, publish events as dates become firm, and replace portfolio images whenever the studio changes. The public site updates from here.</p><button className="cms-primary" onClick={() => setSection("canvases")}><Plus size={16} /> Add a canvas</button></section><section className="cms-panel"><div className="cms-panel-heading"><div><p className="cms-eyebrow">QUICK LINKS</p><h2>Keep things moving</h2></div></div><button className="cms-quick-link" onClick={() => setSection("events")}><CalendarDays size={18} /><span><b>Plan the next gathering</b><small>Visitors can save dates to Google or Apple Calendar.</small></span><ArrowUpRight size={16} /></button><button className="cms-quick-link" onClick={() => setSection("images")}><ImagePlus size={18} /><span><b>Refresh the visual story</b><small>Swap any image without touching the code.</small></span><ArrowUpRight size={16} /></button></section></div>
    </>}

    {section === "canvases" && <><DashboardHeader title="Shop canvases" description="Add, edit, or remove the original pieces shown in the shop." onAdd={resetCanvas} /><div className="cms-two-column"><section className="cms-panel cms-list">{data?.canvases?.map((item) => <div className="cms-record" key={item.id}><img src={item.imageUrl} alt={item.title} /><div><span className="cms-record-status">{item.status.replace("_", " ")}</span><h3>{item.title}</h3><p>{item.kind} · {item.size} · {item.price}</p></div><div className="cms-record-actions"><button onClick={() => editCanvas(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button onClick={() => deleteCanvas.mutate({ id: item.id })} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingCanvas ? "Edit canvas" : "New canvas"} onClose={editingCanvas ? resetCanvas : undefined} /><div className="cms-form-grid"><Field label="Title" value={canvasForm.title} onChange={(value) => setCanvasForm({ ...canvasForm, title: value })} /><Field label="Kind" value={canvasForm.kind} onChange={(value) => setCanvasForm({ ...canvasForm, kind: value })} /><Field label="Price" value={canvasForm.price} onChange={(value) => setCanvasForm({ ...canvasForm, price: value })} /><Field label="Size" value={canvasForm.size} onChange={(value) => setCanvasForm({ ...canvasForm, size: value })} /><label className="cms-field"><span>Status</span><select value={canvasForm.status} onChange={(event) => setCanvasForm({ ...canvasForm, status: event.target.value as CanvasForm["status"] })}><option value="available">Available</option><option value="one_of_one">One of one</option><option value="coming_soon">Coming soon</option><option value="sold">Sold</option></select></label><Field label="Sort order" type="number" value={String(canvasForm.sortOrder)} onChange={(value) => setCanvasForm({ ...canvasForm, sortOrder: Number(value) })} /></div><TextField label="Description" value={canvasForm.description} onChange={(value) => setCanvasForm({ ...canvasForm, description: value })} /><ImagePicker file={canvasFile} currentUrl={canvasForm.imageUrl} onFile={setCanvasFile} /><button className="cms-primary cms-save" onClick={saveCanvas} disabled={upload.isPending || createCanvas.isPending || updateCanvas.isPending}><Save size={16} /> {editingCanvas ? "Save changes" : "Add canvas"}</button></section></div></>}

    {section === "events" && <><DashboardHeader title="Upcoming events" description="Keep open studios, exhibitions, and workshops current for visitors." onAdd={resetEvent} /><div className="cms-two-column"><section className="cms-panel cms-list">{data?.events?.map((item) => <div className="cms-event-record" key={item.id}><div className="cms-date-block"><b>{new Date(item.startAt).toLocaleString("en-US", { month: "short" }).toUpperCase()}</b><strong>{new Date(item.startAt).getDate()}</strong></div><div><span className="cms-record-status">{item.isPublished ? "Published" : "Draft"}</span><h3>{item.title}</h3><p>{item.venue} · {item.city}</p><small>{new Date(item.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small></div><div className="cms-record-actions"><button onClick={() => editEvent(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button onClick={() => deleteEvent.mutate({ id: item.id })} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingEvent ? "Edit event" : "New event"} onClose={editingEvent ? resetEvent : undefined} /><div className="cms-form-grid"><Field label="Title" value={eventForm.title} onChange={(value) => setEventForm({ ...eventForm, title: value })} /><label className="cms-field"><span>Type</span><select value={eventForm.type} onChange={(event) => setEventForm({ ...eventForm, type: event.target.value as EventForm["type"] })}><option value="studio_visit">Studio visit</option><option value="group_exhibition">Group exhibition</option><option value="workshop">Workshop</option></select></label><Field label="Venue" value={eventForm.venue} onChange={(value) => setEventForm({ ...eventForm, venue: value })} /><Field label="City" value={eventForm.city} onChange={(value) => setEventForm({ ...eventForm, city: value })} /><label className="cms-field"><span>Starts</span><input type="datetime-local" value={eventForm.startAt} onChange={(event) => setEventForm({ ...eventForm, startAt: event.target.value })} /></label><label className="cms-field"><span>Ends</span><input type="datetime-local" value={eventForm.endAt} onChange={(event) => setEventForm({ ...eventForm, endAt: event.target.value })} /></label><label className="cms-field"><span>Accent</span><select value={eventForm.accent} onChange={(event) => setEventForm({ ...eventForm, accent: event.target.value as EventForm["accent"] })}><option value="coral">Coral</option><option value="sage">Sage</option><option value="plum">Plum</option></select></label><label className="cms-field"><span>Visibility</span><select value={eventForm.isPublished} onChange={(event) => setEventForm({ ...eventForm, isPublished: Number(event.target.value) })}><option value={1}>Published</option><option value={0}>Draft</option></select></label></div><TextField label="Description" value={eventForm.description} onChange={(value) => setEventForm({ ...eventForm, description: value })} /><button className="cms-primary cms-save" onClick={saveEvent} disabled={createEvent.isPending || updateEvent.isPending}><Save size={16} /> {editingEvent ? "Save changes" : "Publish event"}</button></section></div></>}

    {section === "images" && <><DashboardHeader title="Portfolio images" description="Replace the images used across the public studio without editing the site." onAdd={resetImage} /><div className="cms-two-column"><section className="cms-panel cms-image-grid">{data?.images?.map((item) => <div className="cms-image-record" key={item.id}><img src={item.imageUrl} alt={item.altText} /><div className="cms-image-record-body"><div><span className="cms-record-status">{item.name}</span><h3>{item.label}</h3><p>{item.altText}</p></div><div className="cms-record-actions"><button onClick={() => editImage(item)} aria-label={`Edit ${item.label}`}><Pencil size={15} /></button><button onClick={() => deleteImage.mutate({ id: item.id })} aria-label={`Delete ${item.label}`}><Trash2 size={15} /></button></div></div></div>)}</section><section className="cms-panel cms-form-panel"><FormTitle title={editingImage ? "Replace image" : "New portfolio image"} onClose={editingImage ? resetImage : undefined} /><div className="cms-form-grid"><Field label="Internal name" value={imageForm.name} onChange={(value) => setImageForm({ ...imageForm, name: value })} /><Field label="Label" value={imageForm.label} onChange={(value) => setImageForm({ ...imageForm, label: value })} /><Field label="Sort order" type="number" value={String(imageForm.sortOrder)} onChange={(value) => setImageForm({ ...imageForm, sortOrder: Number(value) })} /></div><TextField label="Alt text" value={imageForm.altText} onChange={(value) => setImageForm({ ...imageForm, altText: value })} /><ImagePicker file={imageFile} currentUrl={imageForm.imageUrl} onFile={setImageFile} /><button className="cms-primary cms-save" onClick={saveImage} disabled={upload.isPending || createImage.isPending || updateImage.isPending}><Upload size={16} /> {editingImage ? "Replace image" : "Add image"}</button></section></div></>}
  </div>;
}

function FormTitle({ title, onClose }: { title: string; onClose?: () => void }) { return <div className="cms-panel-heading"><div><p className="cms-eyebrow">CONTENT EDITOR</p><h2>{title}</h2></div>{onClose && <button className="cms-icon-button" onClick={onClose} aria-label="Cancel editing"><X size={16} /></button>}</div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="cms-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="cms-field cms-field-full"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} /></label>; }
function ImagePicker({ file, currentUrl, onFile }: { file: File | null; currentUrl: string; onFile: (file: File | null) => void }) { return <div className="cms-upload"><div className="cms-upload-preview">{currentUrl ? <img src={file ? URL.createObjectURL(file) : currentUrl} alt="Selected preview" /> : <ImagePlus size={24} />}</div><div><label className="cms-upload-button"><Upload size={15} /> {file ? "Choose a different image" : "Upload image"}<input type="file" accept="image/*" onChange={(event) => onFile(event.target.files?.[0] ?? null)} /></label><small>{file?.name ?? (currentUrl ? "Current image will stay unless you choose a new file." : "JPG, PNG, or WebP · max 6 MB")}</small></div></div>; }

export default function AdminDashboard() {
  return <DashboardLayout><AdminDashboardInner /></DashboardLayout>;
}
