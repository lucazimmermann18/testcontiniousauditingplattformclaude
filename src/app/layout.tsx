import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Continuum Audit · Continuous Auditing Plattform",
  description: "KI-gestützte Continuous Auditing Plattform für Enterprise-Unternehmen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
