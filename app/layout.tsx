import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resort Booking",
  description: "Resort booking system with LINE LIFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}