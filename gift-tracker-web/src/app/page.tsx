export default function Home() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffaf2,_#f6f1e8_55%,_#eedfce)] px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-card shadow-[0_24px_80px_rgba(83,55,32,0.08)]">
          <div className="grid gap-8 px-8 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-12 md:py-14">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-accent-soft px-4 py-1 text-sm font-medium text-accent">
                Web frontend ready
              </span>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Gift Tracker starter with a separate Rails API and Next.js frontend.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  This setup keeps the UI and backend deployable on different domains while
                  staying simple enough for an MVP. Next we can add auth, people, occasions,
                  gift ideas, and reminder workflows.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm font-medium">
                <span className="rounded-full border border-black/10 px-4 py-2">
                  Frontend: Next.js
                </span>
                <span className="rounded-full border border-black/10 px-4 py-2">
                  Backend: Rails API
                </span>
                <span className="rounded-full border border-black/10 px-4 py-2">
                  Data: PostgreSQL
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#2f241d] p-6 text-[#f8ede0]">
              <p className="text-sm uppercase tracking-[0.25em] text-[#d9bca5]">
                API configuration
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm text-[#d9bca5]">Frontend env</p>
                  <code className="mt-1 block rounded-xl bg-black/20 px-4 py-3 text-sm">
                    NEXT_PUBLIC_API_BASE_URL
                  </code>
                </div>
                <div>
                  <p className="text-sm text-[#d9bca5]">Current fallback</p>
                  <code className="mt-1 block rounded-xl bg-black/20 px-4 py-3 text-sm break-all">
                    {apiBaseUrl}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-[#d9bca5]">Backend health route</p>
                  <code className="mt-1 block rounded-xl bg-black/20 px-4 py-3 text-sm">
                    /api/v1/health
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Backend first",
              description:
                "Rails is running in API mode, namespaced under /api/v1, which keeps business logic isolated from the UI.",
            },
            {
              title: "Separate deploys",
              description:
                "The frontend uses an environment variable for the API base URL, so app.yourdomain.com can call api.yourdomain.com cleanly.",
            },
            {
              title: "MVP-friendly",
              description:
                "The structure is ready for people, occasions, gift ideas, and reminder jobs without reworking the architecture later.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-black/5 bg-card px-6 py-6 shadow-[0_16px_48px_rgba(83,55,32,0.06)]"
            >
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
