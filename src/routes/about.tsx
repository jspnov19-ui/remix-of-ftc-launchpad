import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About FTC Team Cognition 19655 | Rancho Cordova, CA" },
      {
        name: "description",
        content:
          "FTC Team Cognition 19655 was established in 2021 in Rancho Cordova, California. We build competition robots and mentor FLL members into FIRST Tech Challenge.",
      },
      { property: "og:title", content: "About FTC Team Cognition 19655" },
      {
        property: "og:description",
        content:
          "Established 2021 in Rancho Cordova, CA — building robots and mentoring the next wave of FTC students.",
      },
    ],
  }),
  component: About,
});

const facts = [
  { l: "Team number", v: "19655" },
  { l: "Established", v: "2021" },
  { l: "Home base", v: "Rancho Cordova, CA" },
  { l: "Program", v: "FIRST Tech Challenge" },
];

const values = [
  {
    title: "Rookies first",
    body: "Every new member gets time on the drive team, in the code, and in the notebook. Nobody sits and watches.",
  },
  {
    title: "Build, break, rebuild",
    body: "Our best mechanisms are version three. We prototype fast, test on the tile floor, and keep what survives a match.",
  },
  {
    title: "Pass it down",
    body: "We mentor FLL teams around Sacramento County, which is exactly why this simulator exists — it's the lesson we teach every season.",
  },
];

const timeline = [
  { year: "2021", body: "Cognition 19655 is founded in Rancho Cordova with a garage, a starter kit, and eight students." },
  { year: "2022", body: "First full competition season: drive team, engineering notebook, and a working autonomous." },
  { year: "2024", body: "Started running build-and-code workshops for local FLL teams moving up to FTC." },
  { year: "2026", body: "Released this simulator so rookies can learn the 2026–27 field before touching hardware." },
];

export default function About() {
  return (
    <>
      <section className="pt-14 pb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase backdrop-blur-md">
          About us
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] font-semibold md:text-5xl">
          FTC Team <span className="text-accent-teal">Cognition 19655</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-secondary-foreground">
          Established 2021 in Rancho Cordova, California. We design, build, and program robots for the
          FIRST Tech Challenge — and we spend just as much time helping younger students find their way
          into it.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.l} className="glass-panel rounded-2xl p-5">
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{f.l}</p>
              <p className="mt-2 font-display text-xl font-semibold">{f.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="glass-panel rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{v.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 glass-panel rounded-3xl p-7 md:p-9">
        <h2 className="font-display text-2xl font-semibold">Our seasons so far</h2>
        <div className="mt-6 space-y-4">
          {timeline.map((t) => (
            <div key={t.year} className="flex gap-5 rounded-2xl border border-border bg-white/5 p-5">
              <span className="font-display text-accent-teal">{t.year}</span>
              <p className="text-sm leading-relaxed text-secondary-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 glass-panel rounded-3xl p-7 text-center md:p-9">
        <h2 className="font-display text-2xl font-semibold">Thinking about joining FTC?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-secondary-foreground">
          Start in the simulator. Write an autonomous, miss the goal zone a few times, and you'll
          already understand what a rookie meeting looks like.
        </p>
        <Link
          to="/simulation"
          className="mt-6 inline-block rounded-xl bg-accent-teal px-5 py-3 font-display font-semibold text-ink"
        >
          Try the simulation
        </Link>
      </section>
    </>
  );
}
