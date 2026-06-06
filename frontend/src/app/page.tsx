import Link from "next/link";

const features = [
  {
    icon: "🎥",
    title: "Upload & Create",
    desc: "Share short videos up to 5 minutes. Add captions, hashtags, and let the algorithm do the rest.",
  },
  {
    icon: "🔥",
    title: "Trending Feed",
    desc: "Discover personalized content with our smart recommendation engine. Scroll, discover, repeat.",
  },
  {
    icon: "👥",
    title: "Build Community",
    desc: "Follow creators, comment, like, and grow your audience. Your tribe is waiting.",
  },
  {
    icon: "🔔",
    title: "Stay Connected",
    desc: "Real-time notifications keep you in the loop. Never miss a moment from your favorites.",
  },
  {
    icon: "🔍",
    title: "Discover & Search",
    desc: "Find creators, trending hashtags, and viral content. The next big thing is one search away.",
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    desc: "Built with cutting-edge tech for a buttery smooth experience. No lag, no buffering.",
  },
];

export default function HomePage() {

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="glass fixed inset-x-0 top-0 z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-4 shadow-soft backdrop-blur-md sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#14b8a6] flex items-center justify-center shadow-lg shadow-cyan-200/30">
            <span className="text-black font-bold text-sm">M</span>
          </div>
          <span className="text-lg sm:text-xl font-black gradient-text">MikMok</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-full px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-gradient-to-r from-[#06b6d4] to-[#14b8a6] px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <main className="relative flex-1 overflow-hidden px-6 pt-24 sm:px-8 lg:px-12">
        <div className="absolute top-16 left-0 h-80 w-80 rounded-full bg-[#06b6d4] opacity-10 blur-[120px]" />
        <div className="absolute top-24 right-4 h-72 w-72 rounded-full bg-[#14b8a6] opacity-10 blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0f172a] opacity-5 blur-[120px]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#06b6d4]/20 bg-[#06b6d4]/10 px-4 py-2 text-sm font-medium text-[#0f172a] shadow-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#06b6d4] animate-pulse" />
            Now in Beta
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            <span className="gradient-text">Short Videos.</span>
            <br />
            <span className="text-slate-950">Big Impact.</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Create, discover, and share short-form video content with millions of creators.
            Your moments deserve an audience.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row pb-16">
            <Link
              href="/sign-up"
              className="btn-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#06b6d4] to-[#14b8a6] px-8 py-4 text-base font-semibold text-white shadow-soft transition duration-200 hover:scale-[1.02] hover:opacity-95"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-8 py-4 text-base font-medium text-slate-700 transition hover:bg-muted"
            >
              Explore Feed →
            </Link>
          </div>
        </div>
      </main>

      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to <span className="gradient-text">go viral</span>
          </h2>

          <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[2.5rem] bg-white border border-border/60 p-10 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[#06b6d4]/30 flex flex-col"
              >
                <div className="mb-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-muted/50 text-4xl shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-slate-950 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-lg leading-relaxed text-slate-600 flex-1">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background/70 px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#14b8a6] text-sm font-bold text-slate-950 shadow-lg shadow-cyan-200/25">
              M
            </div>
            <span className="text-base font-semibold gradient-text">MikMok</span>
          </div>

          <p className="text-sm text-slate-500">© 2025 MikMok. All rights reserved.</p>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-500">
            <Link href="#" className="transition hover:text-slate-900">Privacy</Link>
            <Link href="#" className="transition hover:text-slate-900">Terms</Link>
            <Link href="#" className="transition hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
