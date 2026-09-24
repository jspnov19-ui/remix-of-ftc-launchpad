import { createFileRoute, Link } from "@tanstack/react-router";
import { SimWorkbench } from "@/components/sim-workbench";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Robot Simulation — 2026-27 Field | Cognition 19655" },
      {
        name: "description",
        content:
          "Write a simplified autonomous program, step through it line by line, and watch a demo FTC robot drive, grab, and score on the 2026-27 field.",
      },
      { property: "og:title", content: "Robot Simulation — 2026-27 FTC Field" },
      {
        property: "og:description",
        content:
          "Edit the demo robot's autonomous code and watch it run on a top-down 2026-27 field with live telemetry.",
      },
    ],
  }),
  component: Simulation,
});

function Simulation() {
  return (
    <>
      <section className="pt-14 pb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase backdrop-blur-md">
          2026–27 field · autonomous period
        </span>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold md:text-5xl">
          Program the demo robot
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-foreground">
          Edit the program, then press Step to run one line at a time. The robot starts in the
          dashed box, grabs the yellow sample, and releases it in the blue goal. New to coding?{" "}
          <Link to="/lessons" className="text-accent-teal underline underline-offset-4">Start with the lessons</Link>.
        </p>
      </section>
      <SimWorkbench />
    </>
  );
}
