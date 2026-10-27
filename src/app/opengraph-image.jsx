// File-based Open Graph image — replaces the previously referenced (missing)
// /og-image.jpg. Generated at request time; served at /opengraph-image.
import { ImageResponse } from "next/og";
import { OgCard, OG_ALT, OG_SIZE } from "./components/OgCard";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<OgCard />, { ...size, alt: OG_ALT });
}
