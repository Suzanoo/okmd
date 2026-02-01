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

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* BG Image */}
      <Image
        src="/images/holi_fest.png"
        alt="OKMD project background"
        fill
        priority
        className="object-cover"
      />

      {/* Overlays */}
      {/* <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/70" /> */}

      {/* Content */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md" />
            <div>
              <p className="text-sm font-medium text-white/90">OKMD</p>
              <p className="text-xs text-white/60">Construction Management</p>
            </div>
          </div>

          <a
            href="https://www.okmd.or.th/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md transition hover:bg-white/15"
          >
            OKMD Website ↗
          </a>
        </header>

        {/* Hero */}
        <section className="mt-16">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
            Project Control Center
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            OKMD – New Building
            <span className="block text-white/70">
              Construction Management App
            </span>
          </h1>

          {/* <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
            เข้าใช้งานเร็วผ่านเมนูหลักด้านล่าง: คุม BOQ, ติดตาม Progress
            และดูรายงานภาพรวมโครงการ
          </p> */}

          {/* Action Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EntryCard
              title="BOQ"
              description="Quantity & cost control • BOQ query • package summary"
              href="/boq"
              badge="Cost"
            />
            <EntryCard
              title="Progress"
              description="Plan vs Actual • S-curve • weekly/monthly snapshots"
              href="/progress"
              badge="Schedule"
            />
            <EntryCard
              title="Report"
              description="Executive overview • key issues • export-ready summaries"
              href="/report"
              badge="KPI"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto pt-10 text-xs text-white/55">
          © {new Date().getFullYear()} OKMD CM • Built with Next.js
        </footer>
      </div>
    </main>
  );
}
