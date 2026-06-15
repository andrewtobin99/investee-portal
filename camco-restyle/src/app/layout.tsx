import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

/*
 * Proxima Nova is the Camco brand typeface (licensed via Adobe Fonts). Source
 * Sans 3 is a close, free stand-in so the app matches the brand out of the box.
 * If you have a Proxima Nova license, swap this for next/font/local or the
 * Adobe Fonts <link> and update the className below.
 */
const brandSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Investee Portal",
  description: "Submit and track your reporting requirements.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={brandSans.className}>
      <body>{children}</body>
    </html>
  );
}
