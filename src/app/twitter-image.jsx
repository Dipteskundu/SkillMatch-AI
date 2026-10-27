// File-based Twitter image — same artwork as the OG image.
import { ImageResponse } from "next/og";
import { OgCard, OG_ALT, OG_SIZE } from "./components/OgCard";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<OgCard />, { ...size, alt: OG_ALT });
}
