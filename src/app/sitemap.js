// sitemap.js — public, indexable routes only. Auth-gated surfaces (dashboard,
// admin, profile, …) are deliberately excluded; see robots.js.
const BASE = "https://jobmatchai.app";

const PUBLIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/jobs", priority: 0.9, changeFrequency: "daily" },
  { path: "/learn", priority: 0.7, changeFrequency: "weekly" },
  { path: "/companies", priority: 0.7, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },
  { path: "/compliance", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap() {
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFrequency,
    priority,
  }));
}
