export type JournalPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  image_url: string;
  image_key: string | null;
  alt_text: string;
  published_at: string;
  updated_at: string;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  author_name: string;
};
