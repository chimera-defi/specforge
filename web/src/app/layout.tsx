import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const groteskSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpecForge — Multiplayer Spec Authoring",
  description:
    "Collaborative spec IDE for teams that want governed agent work, attributable changes, and a cleaner path from idea to runnable product.",
  openGraph: {
    title: "SpecForge — Multiplayer Spec Authoring",
    description:
      "Humans edit live, agents propose patches, and every change is reviewable before it makes it into the canonical spec.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${groteskSans.variable} ${plexMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
