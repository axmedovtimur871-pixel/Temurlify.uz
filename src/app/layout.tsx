import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const display = Instrument_Serif({ variable: "--font-display", subsets: ["latin", "latin-ext"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "Temurlify — nemis tilini tizimli o'rganing", template: "%s · Temurlify" },
  description: "A1 dan C1 gacha 120 ta dars, uy vazifalari, lug'at, AI tarjimon va jonli o'yinlar — raqamli nemis tili sinfxonasi.",
  applicationName: "Temurlify",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#101215" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}>
      <head>
        {/* Apply the saved theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
