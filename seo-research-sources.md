# Threaded Forms Kenya/Nairobi SEO research notes

## Scope

Target market: Kenya, with Nairobi as the local priority. Data source: public web research only; no paid keyword-volume connector was used. Search volume values in the workbook are planning estimates, not third-party measured volumes, and should be validated later in Google Search Console, Google Keyword Planner, Ahrefs, or Semrush.

## Public market signals

The public search results surfaced recurring language around Kenyan handmade art, Kenya wall art, canvas wall decor, string art, custom wall art, and handmade fiber/textile work. Etsy's Kenyan Handmade Art marketplace displayed 1,000+ relevant results and included terms such as handmade Kenyan art, Kenya wall art, African wall decor, woven art, handcrafted rug designs, and made-in-Kenya sculpture. Source: https://www.etsy.com/market/kenyan_handmade_art

Search results also surfaced Nairobi-specific language around canvas paintings for home decor, hand-crafted wall art made in Nairobi, string-art workshops, and textile/fiber-art exhibitions. These signals support separating the portfolio into commercial clusters (buy/commission wall art), local discovery clusters (Nairobi/Kenya), and educational/story clusters (string-art process, fiber art, workshops, studio journal).

## Official SEO implementation guidance

Google recommends JSON-LD as the easiest structured-data format to maintain and says structured data should describe visible page content. It recommends validating markup with the Rich Results Test and submitting a sitemap through Search Console. Source: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

Google's LocalBusiness guidance says local business markup should include the business name and physical address, with geo, opening hours, and price range as useful recommended properties. Source: https://developers.google.com/search/docs/appearance/structured-data/local-business

Google's Article guidance recommends Article/BlogPosting markup with headline, image, author, datePublished, and dateModified where applicable. It also recommends canonical URLs and a sitemap for discoverability. Source: https://developers.google.com/search/docs/appearance/structured-data/article

## Product decisions applied

The public site now has individual `/journal/:slug` pages, canonical and Open Graph metadata, Article JSON-LD for journal pages, Person/ArtGallery/WebSite JSON-LD for the home page, dynamic robots.txt and sitemap.xml routes, admin disallow rules, and Supabase-backed journal CRUD with draft/published status and SEO title/description fields.
