"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import ThemeToggle from "./ThemeToggle";

const nav = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/news", label: "NEWS" },
  { href: "/events", label: "EVENTS" },
  { href: "/contact", label: "CONTACT US" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LEFT: Logo -> Home */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Go to Home"
            className="inline-flex"
            onClick={() => setOpen(false)}
          >
            <Image
              src="https://www.okmd.or.th/images/template/logo_okmd.png"
              alt="OKMD"
              width={75}
              height={75}
              className="rounded-2xl bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur-md object-contain"
              priority
            />
          </Link>
        </div>

        {/* CENTER: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => {
            const active = pathname === item.href;
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
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.okmd.or.th/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md transition hover:bg-white/15"
          >
            OKMD Website ↗
          </a>

          <ThemeToggle />

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-white/90 backdrop-blur-md transition hover:bg-white/15"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <div
        id="mobile-nav"
        className={[
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <nav className="mx-4 mb-4 rounded-2xl border border-white/15 bg-black/20 backdrop-blur-md">
          <ul className="flex flex-col p-2">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "block rounded-xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/90 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
