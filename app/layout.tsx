import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/app/providers";
import { getMessages, getRequestLocale } from "@/lib/i18n/server";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export const metadata: Metadata = {
  applicationName: "Convivia",
  title: "Convivia — la casa condivisa organizzata",
  description:
    "Spese ripartite (anche in %), scontrini, calendario condiviso con Google/Apple, liste spesa e compiti. Gratis per iniziare: coinquilini e famiglie.",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Convivia",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/convivia-icon.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = await getMessages();
  const rtl = locale === "ar";

  return (
    <html
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      className={`${plusJakarta.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-dvh min-h-full flex-col">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
