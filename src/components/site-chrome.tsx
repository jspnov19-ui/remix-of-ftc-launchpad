import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/simulation", label: "Simulation" },
  { to: "/lessons", label: "Lessons" },
  { to: "/about", label: "About us" },
] as const;

export function SiteChrome({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground antialiased">
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-deep to-ink" />
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-accent-sky/25 blur-3xl"
        style={{ animation: "drift 18s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full bg-accent-teal/20 blur-3xl"
        style={{ animation: "drift 24s ease-in-out infinite" }}
      />
      <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-accent-sky/15 blur-3xl" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      <div className="relative">
        <header className="sticky top-0 z-30 mx-auto max-w-6xl px-5 pt-5">
          <div className="glass-panel flex items-center justify-between rounded-2xl px-5 py-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent-sky to-accent-teal font-display font-bold text-ink">
                C19
              </div>
              <div>
                <p className="font-display leading-none font-semibold">Cognition Simulator</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  FTC Team 19655 · Rancho Cordova
                </p>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="rounded-lg px-3 py-2 font-display text-sm text-secondary-foreground transition-colors hover:bg-white/10"
                  activeProps={{ className: "bg-white/15 text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/simulation"
                className="ml-2 rounded-lg bg-accent-teal px-4 py-2 font-display text-sm font-semibold text-ink shadow-[0_0_24px_-2px_oklch(0.79_0.125_182/0.6)]"
              >
                Launch sim
              </Link>
            </nav>
            <button
              className="rounded-lg border border-border px-3 py-2 text-sm md:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
          {open && (
            <nav className="glass-panel mt-2 flex flex-col rounded-2xl p-2 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: item.to === "/" }}
                  className="rounded-lg px-3 py-3 font-display text-sm hover:bg-white/10"
                  activeProps={{ className: "bg-white/15" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <main className="mx-auto max-w-6xl px-5 pb-16">{children}</main>

        <footer className="relative mt-6 border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent-sky to-accent-teal font-display font-bold text-ink">
                C19
              </div>
              <div>
                <p className="font-display text-sm font-semibold">FTC Team Cognition 19655</p>
                <p className="text-xs text-muted-foreground">
                  Established 2021 · Rancho Cordova, CA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-sm text-secondary-foreground">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className="transition-colors hover:text-accent-teal">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
