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

const uploadInput = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.string().regex(/^image\//),
  data: z.string().min(1),
});

export const contentRouter = router({
  all: publicProcedure.query(async () => {
    const [canvases, events, images] = await Promise.all([
      listCanvases(),
      listPublishedEvents(),
      listPortfolioImages(),
    ]);
    return { canvases, events, images };
  }),
});

export const cmsRouter = router({
  all: adminProcedure.query(() => listAdminContent()),

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
});
