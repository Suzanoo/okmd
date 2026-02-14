"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

const nav = [
  { href: "/", label: "HOME" },
  { href: "/boq", label: "MONEY" },
  { href: "/report", label: "REPORT" },
  { href: "/contact", label: "CONTACT US" },
];

type Props = {
  user: User | null;
  isAdmin: boolean;
};

export default function AppHeader({ user, isAdmin }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // close on route change
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (prev !== null && prev !== pathname && open) {
      setOpen(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [pathname, open]);

  // lock background scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // focus management: open -> focus first item, close -> return focus to button
  useEffect(() => {
    if (open) {
      // wait next paint so refs are ready
      requestAnimationFrame(() => firstLinkRef.current?.focus());
    } else {
      requestAnimationFrame(() => menuBtnRef.current?.focus());
    }
  }, [open]);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* LEFT: Logo -> Home */}
        <Link
          href="/"
          aria-label="Go to Home"
          className="inline-flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/logo.png"
            alt="OKMD"
            width={50}
            height={50}
            className="rounded-full bg-white/10 p-1 ring-1 ring-black backdrop-blur-md object-contain"
            priority
          />
        </Link>

        {/* CENTER: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm font-medium transition",
                  active ? "text-white" : "text-white/90 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <a
            href="https://www.okmd.or.th/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md transition hover:bg-white/15"
          >
            KAMUI Website
            <ExternalLink className="h-4 w-4" />
          </a>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Thwme switch */}
          <ThemeToggle />
          {/* Logout */}
          {user ? (
            <>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
              {isAdmin ? <Link href="/admin">ADMIN</Link> : null}
              <LogoutButton />
            </>
          ) : (
            // <Link href="/login">Login</Link>
            ""
          )}

          {/* Hamburger (mobile only) */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden relative inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-white/90 backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/25"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-drawer"
          >
            {/* Active indicator */}
            <span
              className={[
                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full transition",
                open ? "opacity-100 scale-100" : "opacity-0 scale-75",
              ].join(" ")}
              style={{ background: "hsl(217 91% 60%)" }}
              aria-hidden="true"
            />
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={[
          "md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Backdrop (blur + fade) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={[
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px] transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Close menu overlay"
          tabIndex={open ? 0 : -1}
        />

        {/* Drawer Panel (right) */}
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          className={[
            "fixed right-0 top-0 z-50 h-dvh w-[86vw] max-w-[360px]",
            // cinematic glass: gradient + blur + subtle noise-like feel via opacity layers
            "bg-linear-to-b from-white/[0.10] via-black/[0.55] to-black/[0.72]",
            "backdrop-blur-xl",
            "border-l border-white/15 ring-1 ring-white/10",
            "shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
            "transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/10">
                <Image
                  src="/images/logo.png"
                  alt="KAMUI"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">KAMUI</div>
                <div className="text-xs text-white/60">Dashboard</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white/90 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/25"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer content */}
          <nav className="px-3 py-4">
            <ul className="flex flex-col gap-1">
              {nav.map((item, idx) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      ref={idx === 0 ? firstLinkRef : undefined}
                      className={[
                        "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                        "border border-white/10 bg-white/[0.03]",
                        "focus:outline-none focus:ring-2 focus:ring-white/20",
                        active
                          ? "bg-white/14 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: "hsl(160 84% 39%)" }}
                          aria-hidden="true"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* External link */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-2">
              <a
                href="https://www.okmd.or.th/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <span>KAMUI Website</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-4 px-2 text-xs text-white/50">
              Tip: กด <span className="text-white/80">Esc</span> เพื่อปิดเมนู
            </div>
          </nav>

          {/* Bottom safe area padding */}
          <div className="h-6" />
        </aside>
      </div>
    </header>
  );
}
