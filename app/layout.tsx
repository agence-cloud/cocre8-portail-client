import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * La charte Cocre8 demande BDO Grotesk, une police premium qui n'est pas
 * encore achetée ni hébergée. Plus Jakarta Sans en est le repli le plus
 * proche, et se charge depuis Google Fonts. Jamais de serif.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nouvelle École",
  description: "Ton espace personnel pour avancer, pilier par pilier.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
