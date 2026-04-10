import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Convivia — Casa condivisa",
    short_name: "Convivia",
    description: "Spese condivise, calendario, liste spesa e compiti per coinquilini.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f5f3ff",
    theme_color: "#6366f1",
    icons: [
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
