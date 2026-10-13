import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bosonic Code Explorer" },
      {
        name: "description",
        content: "Interactive 3D Wigner function explorers for bosonic error-correcting codes.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Bosonic Code Explorer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a code to explore its 3D Wigner function.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/gkp"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          GKP
        </Link>
        <Link
          to="/cat"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Cat qubit
        </Link>
      </div>
      <p className="absolute right-4 bottom-3 text-[0.72rem] text-muted-foreground">
        by Thiziri Aissaoui (with AI)
      </p>
    </main>
  );
}
