import "./globals.css";
import LiveVisuals from "./components/LiveVisuals/LiveVisuals";
import Chatbot from "./components/Chatbot/Chatbot";
import Providers from "./Providers";
import StoreProvider from "./store/StoreProvider";

export const metadata = {
  metadataBase: new URL("https://jobmatchai.app"),
  title: "SkillMatch AI - AI-Powered Skill Matching for Candidates & Recruiters",
  description:
    "Match your unique skills with the perfect career opportunities using our advanced AI-driven platform.",
  applicationName: "SkillMatch AI",
  // Open Graph — images come from the file-based opengraph-image.jsx
  // (the old /og-image.jpg reference pointed at a file that never existed).
  openGraph: {
    title: "SkillMatch AI - AI-Powered Skill Matching for Candidates & Recruiters",
    description:
      "Match your unique skills with the perfect career opportunities using our advanced AI-driven platform.",
    url: "https://jobmatchai.app",
    siteName: "SkillMatch AI",
    type: "website",
  },
  // Twitter — images come from file-based twitter-image.jsx
  twitter: {
    card: "summary_large_image",
    title: "SkillMatch AI - AI-Powered Skill Matching for Candidates & Recruiters",
    description:
      "Match your unique skills with the perfect career opportunities using our advanced AI-driven platform.",
    creator: "@jobmatchai",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
        {/* Sitemap link */}
        {process.env.NEXT_PUBLIC_VERCEL_URL ? (
          <link href={`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/sitemap.xml`} rel="sitemap" />
        ) : (
          <link href="https://jobmatchai.app/sitemap.xml" rel="sitemap" />
        )}
        {/* Favicon + PWA icon come from the file-based src/app/icon.jsx —
            the old /favicon.ico, /apple-touch-icon.png and /manifest.json
            links all pointed at files that never existed. */}
      </head>
      <body className="antialiased">
        <StoreProvider>
          <Providers>
            <LiveVisuals />
            {children}
            <Chatbot />
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}
