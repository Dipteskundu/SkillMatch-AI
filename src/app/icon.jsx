// File-based favicon/app icon — generated at request time (the repo never had
// a real /favicon.ico, /apple-touch-icon.png or /manifest.json).
import { ImageResponse } from "next/og";

export const alt = "SkillMatch AI";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)",
          color: "#ffffff",
          fontSize: 320,
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    { ...size, alt: "SkillMatch AI" },
  );
}
