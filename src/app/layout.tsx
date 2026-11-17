import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company Leave Tracker",
  description: "Vacation & Sick Leave Tracker for small companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
