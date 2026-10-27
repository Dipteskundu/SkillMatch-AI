// robots.js — Next-native robots.txt (public pages crawlable; private areas
// disallowed). Sitemap URL follows the canonical domain used across metadata.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/profile/",
          "/saved-jobs/",
          "/applications/",
          "/applicants/",
          "/post-job/",
          "/my-jobs/",
          "/resume/",
          "/skill-gap-detection/",
          "/skill-test/",
          "/verification/",
          "/communication/",
          "/copilot/",
          "/signin",
          "/signup",
          "/api/",
        ],
      },
    ],
    sitemap: "https://jobmatchai.app/sitemap.xml",
  };
}
