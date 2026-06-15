import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Complaint Triage Assistant",
  description:
    "NLP classifier that predicts the product category of a financial complaint and suggests a triage team and priority.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-800 antialiased">{children}</body>
    </html>
  );
}
