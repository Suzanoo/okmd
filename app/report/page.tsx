import { requireActiveUser } from "@/lib/auth/requireActiveUser";
import Image from "next/image";
import Link from "next/link";

type EntryCardProps = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

function EntryCard({ title, description, href, badge }: EntryCardProps) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition
                 hover:bg-white/15 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h3>

        {badge ? (
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/90">
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-white/75">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/90">
        <span className="transition group-hover:translate-x-0.5">Open</span>
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          →
        </span>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-white/30 transition group-hover:opacity-100" />
    </Link>
  );
}

export default async function ReportPage() {
  await requireActiveUser({ nextPath: "/report" });

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* BG Image */}
      <Image
        src="/images/okmd-2.jpg"
        alt="OKMD project background"
        fill
        priority
        className="object-cover"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-black/5" />
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/45 to-black/70" />

      {/* Content */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        {/* Hero */}
        <section className="mt-16">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
            LET IT BE
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            🙈 🙉 🙊
          </h1>

          {/* Action Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EntryCard
              title="PROGRESS"
              description="Plan vs Actual • S-curve • weekly/monthly snapshots"
              href="/report/progress"
              badge="Reports"
            />
            <EntryCard
              title="MAN POWER"
              description="Labour productivity • Manpower allocation • Weekly/monthly snapshots"
              href="/report/manpower"
              badge="Reports"
            />
            <EntryCard
              title="COST"
              description="Cost performance index (CPI) • Cost variance (CV) • Weekly/monthly snapshots"
              href="/report/cost"
              badge="Reports"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto pt-10 text-xs text-white/55 flex items-center">
          <span>© {new Date().getFullYear()} OKMD CM • Built with Next.js</span>

          {/* <Link
            href="/forms"
            className="ml-auto text-sm text-white/55  hover:text-foreground underline underline-offset-4"
          >
            Project Forms
          </Link> */}
        </footer>
      </div>
    </main>
  );
}
