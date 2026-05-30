import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aliz Studio",
    short_name: "Aliz",
    description: "Appointment-only barbering with a guided booking demo flow.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#11100f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
