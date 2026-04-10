import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Convivia — Casa condivisa",
    short_name: "Convivia",
    description: "Spese condivise, calendario, liste spesa e compiti per coinquilini.",
    lang: "it",
    dir: "ltr",
    start_url: "/case",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "any",
    background_color: "#f5f3ff",
    theme_color: "#6366f1",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: "/pwa-icon/192",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
      {
        src: "/convivia-icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  };
}
