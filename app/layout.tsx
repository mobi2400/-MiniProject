import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppHeader } from "../components/AppHeader";
import { currentAccountId } from "../lib/session";

export const metadata: Metadata = {
  title: "MiniProject | Prepare for your next role",
  description: "Compare your CV with a target job, practice specific skills, and build a revised CV backed by your experience.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const signedIn = Boolean(await currentAccountId());
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip">
          Skip to main content
        </a>
        <AppHeader signedIn={signedIn} />
        {children}
      </body>
    </html>
  );
}
