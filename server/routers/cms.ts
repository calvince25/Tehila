import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "../storage";
import {
  createCanvas,
  createPortfolioImage,
  createStudioEvent,
  deleteCanvas,
  deletePortfolioImage,
  deleteStudioEvent,
  listAdminContent,
  listCanvases,
  listPortfolioImages,
  listPublishedEvents,
  updateCanvas,
  updatePortfolioImage,
  updateStudioEvent,
} from "../db";
import {
  createJournalPost,
  deleteJournalPost,
  getJournalPostBySlug,
  createCommissionEnquiry,
  deleteCommissionEnquiry,
  listCommissionEnquiries,
  listAdminJournalPosts,
  listPublishedJournalPosts,
  updateJournalPost,
} from "../supabase";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const statusSchema = z.enum(["available", "one_of_one", "coming_soon", "sold"]);
const eventTypeSchema = z.enum(["studio_visit", "group_exhibition", "workshop"]);
const accentSchema = z.enum(["coral", "sage", "plum"]);

const canvasFields = {
  title: z.string().min(1).max(180),
  kind: z.string().min(1).max(120),
  price: z.string().min(1).max(40),
  size: z.string().min(1).max(80),
  status: statusSchema,
  description: z.string().min(1),
  imageUrl: z.string().min(1),
  imageKey: z.string().max(512).optional().nullable(),
  sortOrder: z.number().int().default(0),
};

const eventFields = {
  title: z.string().min(1).max(180),
  type: eventTypeSchema,
  description: z.string().min(1),
  venue: z.string().min(1).max(180),
  city: z.string().min(1).max(180),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  accent: accentSchema,
  isPublished: z.number().int().min(0).max(1).default(1),
};

const imageFields = {
  name: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  altText: z.string().min(1).max(240),
  imageUrl: z.string().min(1),
  imageKey: z.string().max(512).optional().nullable(),
  sortOrder: z.number().int().default(0),
};

const journalFields = {
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z.string().min(1).max(180),
  excerpt: z.string().min(1).max(320),
  body: z.string().min(1),
  category: z.string().min(1).max(120),
  imageUrl: z.string().min(1),
  imageKey: z.string().max(512).optional().nullable(),
  altText: z.string().min(1).max(240),
  publishedAt: z.coerce.date(),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().max(180).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  authorName: z.string().min(1).max(120).default("Tehila"),
};

const uploadInput = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.string().regex(/^image\//),
  data: z.string().min(1),
});

export const contentRouter = router({
  all: publicProcedure.query(async () => {
    const [canvases, events, images, journal] = await Promise.all([
      listCanvases(),
      listPublishedEvents(),
      listPortfolioImages(),
      listPublishedJournalPosts(),
    ]);
    return { canvases, events, images, journal };
  }),
  journalBySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => getJournalPostBySlug(input.slug)),
  submitCommission: publicProcedure.input(z.object({
    name: z.string().min(1).max(160),
    email: z.string().email().max(320),
    project_type: z.string().min(1).max(180),
    room: z.string().max(180).optional().nullable(),
    size: z.string().max(120).optional().nullable(),
    budget: z.string().max(120).optional().nullable(),
    timeline: z.string().max(180).optional().nullable(),
    message: z.string().min(1).max(5000),
  })).mutation(({ input }) => createCommissionEnquiry({ ...input, room: input.room ?? null, size: input.size ?? null, budget: input.budget ?? null, timeline: input.timeline ?? null })),
});

export const cmsRouter = router({
  all: adminProcedure.query(async () => ({ ...(await listAdminContent()), journal: await listAdminJournalPosts(), enquiries: await listCommissionEnquiries() })),
  deleteEnquiry: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteCommissionEnquiry(input.id)),

  uploadImage: adminProcedure.input(uploadInput).mutation(async ({ input, ctx }) => {
    if (input.data.length > 8_000_000) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Please upload an image smaller than 6 MB." });
    }
    const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const buffer = Buffer.from(input.data, "base64");
    return storagePut(`threaded-forms/${ctx.user.id}/${Date.now()}-${safeName}`, buffer, input.contentType);
  }),

  createCanvas: adminProcedure.input(z.object(canvasFields)).mutation(({ input }) => createCanvas(input)),
  updateCanvas: adminProcedure.input(z.object({ id: z.number().int(), data: z.object(canvasFields).partial() })).mutation(({ input }) => updateCanvas(input.id, input.data)),
  deleteCanvas: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteCanvas(input.id)),

  createEvent: adminProcedure.input(z.object(eventFields)).mutation(({ input }) => createStudioEvent(input)),
  updateEvent: adminProcedure.input(z.object({ id: z.number().int(), data: z.object(eventFields).partial() })).mutation(({ input }) => updateStudioEvent(input.id, input.data)),
  deleteEvent: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteStudioEvent(input.id)),

  createImage: adminProcedure.input(z.object(imageFields)).mutation(({ input }) => createPortfolioImage(input)),
  updateImage: adminProcedure.input(z.object({ id: z.number().int(), data: z.object(imageFields).partial() })).mutation(({ input }) => updatePortfolioImage(input.id, input.data)),
  deleteImage: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deletePortfolioImage(input.id)),

  createJournal: adminProcedure.input(z.object(journalFields)).mutation(({ input }) => createJournalPost({
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    category: input.category,
    image_url: input.imageUrl,
    image_key: input.imageKey ?? null,
    alt_text: input.altText,
    published_at: input.publishedAt.toISOString(),
    is_published: input.isPublished,
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
    author_name: input.authorName,
  })),
  updateJournal: adminProcedure.input(z.object({ id: z.number().int(), data: z.object(journalFields).partial() })).mutation(({ input }) => updateJournalPost(input.id, {
    ...(input.data.slug !== undefined ? { slug: input.data.slug } : {}),
    ...(input.data.title !== undefined ? { title: input.data.title } : {}),
    ...(input.data.excerpt !== undefined ? { excerpt: input.data.excerpt } : {}),
    ...(input.data.body !== undefined ? { body: input.data.body } : {}),
    ...(input.data.category !== undefined ? { category: input.data.category } : {}),
    ...(input.data.imageUrl !== undefined ? { image_url: input.data.imageUrl } : {}),
    ...(input.data.imageKey !== undefined ? { image_key: input.data.imageKey ?? null } : {}),
    ...(input.data.altText !== undefined ? { alt_text: input.data.altText } : {}),
    ...(input.data.publishedAt !== undefined ? { published_at: input.data.publishedAt.toISOString() } : {}),
    ...(input.data.isPublished !== undefined ? { is_published: input.data.isPublished } : {}),
    ...(input.data.seoTitle !== undefined ? { seo_title: input.data.seoTitle ?? null } : {}),
    ...(input.data.seoDescription !== undefined ? { seo_description: input.data.seoDescription ?? null } : {}),
    ...(input.data.authorName !== undefined ? { author_name: input.data.authorName } : {}),
  })),
  deleteJournal: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteJournalPost(input.id)),
});
