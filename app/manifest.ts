import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Peroba — Boletos",
    short_name: "Peroba",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#071d63",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
