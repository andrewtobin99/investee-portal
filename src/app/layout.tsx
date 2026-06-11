import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
