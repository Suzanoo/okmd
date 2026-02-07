"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

const nav = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/news", label: "NEWS" },
  { href: "/events", label: "EVENTS" },
  { href: "/contact", label: "CONTACT US" },
];

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-md">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Image
          src="https://www.okmd.or.th/images/template/logo_okmd.png"
          alt="OKMD"
          width={75}
          height={75}
          className="rounded-2xl bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur-md object-contain"
        />
      </div>

      {/* CENTER */}
      <nav className="hidden md:flex items-center gap-6">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-white/90 hover:text-white transition"
          >
            {item.label}
          </Link>
        ))}
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
      </div>
    </header>
  );
}
