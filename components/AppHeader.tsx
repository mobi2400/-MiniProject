"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../app/account/actions";

const signedInLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Find jobs" },
  { href: "/profile", label: "Profile" },
];

export function AppHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  // The home page has its own header.
  if (pathname === "/") return null;

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-brand">MiniProject</Link>
        {signedIn && (
          <nav className="app-nav" aria-label="Main">
            {signedInLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="app-nav-link" aria-current={current(href)}>
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="app-header-actions">
          {signedIn ? (
            <form action={signOut}>
              <button type="submit" className="button-secondary app-signout">Sign out</button>
            </form>
          ) : (
            <Link href="/account" className="app-nav-link" aria-current={current("/account")}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
