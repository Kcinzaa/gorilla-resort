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
      <body>
        {children}
        <footer className="bg-slate-100 px-3 pb-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Gorilla Resort • Resort Booking System
          </div>
        </footer>
      </body>
    </html>
  );
}
