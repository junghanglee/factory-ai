// Generates public/sitemap.xml. Runs via predev/prebuild hooks.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://linktofactory.com";
const today = new Date().toISOString().slice(0, 10);

interface Entry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Static, indexable public routes
const staticEntries: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "weekly", priority: "0.8" },
  { path: "/search", changefreq: "weekly", priority: "0.6" },
  { path: "/category/all", changefreq: "daily", priority: "0.9" },
  { path: "/login", changefreq: "yearly", priority: "0.3" },
  { path: "/signup", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/acceptable-use", changefreq: "yearly", priority: "0.2" },
];

// Category routes (keep in sync with categories table / src/data/categories.ts)
const categoryIds = [
  "ai-image",
  "ai-video",
  "ai-webtoon",
  "ai-ads",
  "ai-assistant",
  "ai-game",
  "ai-music",
  "ai-writing",
];
const categoryEntries: Entry[] = categoryIds.map((id) => ({
  path: `/category/${id}`,
  changefreq: "daily",
  priority: "0.9",
}));

const entries: Entry[] = [...staticEntries, ...categoryEntries];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${BASE_URL}${e.path}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        (e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>\n` : "") +
        (e.priority ? `    <priority>${e.priority}</priority>\n` : "") +
        `  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
