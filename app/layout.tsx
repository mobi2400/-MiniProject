import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniProject | Prepare for your next role",
  description: "Compare your CV with a target job, practice specific skills, and build a revised CV backed by your experience.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
