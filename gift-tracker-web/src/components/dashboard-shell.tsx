"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  createGiftIdea,
  createOccasion,
  createPerson,
  fetchDashboardData,
  getApiBaseUrl,
  type CreateGiftIdeaInput,
  type CreateOccasionInput,
  type CreatePersonInput,
  type DashboardData,
  type Occasion,
  type Person,
} from "@/lib/api";

const emptyPersonForm: CreatePersonInput = {
  name: "",
  relationship: "",
  interests: "",
  notes: "",
};

const emptyOccasionForm: CreateOccasionInput = {
  person_id: 0,
  kind: "birthday",
  title: "",
  date: "",
  recurring_yearly: true,
};

const emptyGiftIdeaForm: CreateGiftIdeaInput = {
  person_id: 0,
  title: "",
  url: "",
  price_cents: null,
  notes: "",
  status: "idea",
};

const occasionKinds = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "holiday", label: "Holiday" },
  { value: "custom", label: "Custom" },
];

const giftIdeaStatuses = [
  { value: "idea", label: "Idea" },
  { value: "considering", label: "Considering" },
  { value: "bought", label: "Bought" },
  { value: "given", label: "Given" },
  { value: "archived", label: "Archived" },
];

function formatOccasionDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function totalGiftIdeas(people: Person[]) {
  return people.reduce((sum, person) => sum + person.gift_ideas.length, 0);
}

function totalBoughtIdeas(people: Person[]) {
  return people.reduce(
    (sum, person) =>
      sum + person.gift_ideas.filter((giftIdea) => giftIdea.status === "bought").length,
    0,
  );
}

function interestTags(interests: string | null) {
  return interests
    ? interests
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
}

export function DashboardShell() {
  const [dashboard, setDashboard] = useState<DashboardData>({
    people: [],
    upcomingOccasions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [occasionError, setOccasionError] = useState<string | null>(null);
  const [occasionSuccess, setOccasionSuccess] = useState<string | null>(null);
  const [giftIdeaError, setGiftIdeaError] = useState<string | null>(null);
  const [giftIdeaSuccess, setGiftIdeaSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreatePersonInput>(emptyPersonForm);
  const [occasionForm, setOccasionForm] = useState<CreateOccasionInput>(emptyOccasionForm);
  const [giftIdeaForm, setGiftIdeaForm] = useState<CreateGiftIdeaInput>(emptyGiftIdeaForm);
  const [isPending, startTransition] = useTransition();

  const apiBaseUrl = getApiBaseUrl();

  async function loadDashboard() {
    try {
      setError(null);
      const data = await fetchDashboardData();
      setDashboard(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (dashboard.people.length === 0) {
      setOccasionForm(emptyOccasionForm);
      setGiftIdeaForm(emptyGiftIdeaForm);
      return;
    }

    setOccasionForm((current) => ({
      ...current,
      person_id: current.person_id || dashboard.people[0].id,
    }));
    setGiftIdeaForm((current) => ({
      ...current,
      person_id: current.person_id || dashboard.people[0].id,
    }));
  }, [dashboard.people]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    startTransition(async () => {
      try {
        await createPerson(formState);
        setFormState(emptyPersonForm);
        setSubmitSuccess("Person added to your gifting circle.");
        await loadDashboard();
      } catch (submitErr) {
        setSubmitError(
          submitErr instanceof Error ? submitErr.message : "Unable to add person right now.",
        );
      }
    });
  }

  function handleOccasionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOccasionError(null);
    setOccasionSuccess(null);

    startTransition(async () => {
      try {
        await createOccasion(occasionForm);
        setOccasionForm((current) => ({
          ...emptyOccasionForm,
          person_id: current.person_id,
        }));
        setOccasionSuccess("Occasion added to the calendar.");
        await loadDashboard();
      } catch (submitErr) {
        setOccasionError(
          submitErr instanceof Error ? submitErr.message : "Unable to add occasion right now.",
        );
      }
    });
  }

  function handleGiftIdeaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGiftIdeaError(null);
    setGiftIdeaSuccess(null);

    startTransition(async () => {
      try {
        await createGiftIdea(giftIdeaForm);
        setGiftIdeaForm((current) => ({
          ...emptyGiftIdeaForm,
          person_id: current.person_id,
        }));
        setGiftIdeaSuccess("Gift idea saved.");
        await loadDashboard();
      } catch (submitErr) {
        setGiftIdeaError(
          submitErr instanceof Error ? submitErr.message : "Unable to save gift idea right now.",
        );
      }
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ee,_#f4ebde_48%,_#e4d4c1)] px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-[radial-gradient(circle,_rgba(184,92,56,0.18),_transparent_72%)] blur-3xl" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,250,242,0.94),rgba(255,242,226,0.88))] shadow-[0_30px_90px_rgba(83,55,32,0.14)] backdrop-blur">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-[#f2d7c2] px-4 py-1 text-sm font-medium text-[#9d4d2e]">
                Dashboard
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Keep the right gifts warm before the important dates arrive.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  This dashboard gives you one place to track people, upcoming occasions,
                  and the gift ideas already in motion.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="People tracked"
                  value={String(dashboard.people.length)}
                  tone="cream"
                />
                <StatCard
                  label="Upcoming dates"
                  value={String(dashboard.upcomingOccasions.length)}
                  tone="white"
                />
                <StatCard
                  label="Gift ideas saved"
                  value={String(totalGiftIdeas(dashboard.people))}
                  tone="ink"
                  detail={`${totalBoughtIdeas(dashboard.people)} already bought`}
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-[#2f241d] p-6 text-[#f8ede0] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="text-sm uppercase tracking-[0.25em] text-[#d9bca5]">
                Connection
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-[#d9bca5]">API base URL</p>
                  <p className="mt-2 break-all text-sm">{apiBaseUrl}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-[#d9bca5]">Status</p>
                  <p className="mt-2 text-sm">
                    {loading
                      ? "Loading dashboard data..."
                      : error
                        ? "Connection needs attention"
                        : "Live data connected"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void loadDashboard();
                  }}
                  className="inline-flex rounded-full bg-[#f8ede0] px-4 py-2 text-sm font-medium text-[#2f241d] transition hover:bg-white"
                >
                  Refresh data
                </button>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[1.5rem] border border-[#dca68b] bg-[#fff2eb] px-6 py-5 text-[#8f3f20] shadow-[0_16px_48px_rgba(143,63,32,0.08)]">
            <h2 className="text-lg font-semibold">Dashboard couldn&apos;t load yet</h2>
            <p className="mt-2 text-sm leading-6">
              {error}. Make sure the Rails API is running and the database has been prepared.
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Panel
              eyebrow="Soonest moments"
              title="Upcoming occasions"
              description="These are the dates that are closest to needing a gift decision."
            >
              {loading ? (
                <LoadingGrid />
              ) : dashboard.upcomingOccasions.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {dashboard.upcomingOccasions.map((occasion) => (
                    <OccasionCard key={occasion.id} occasion={occasion} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming occasions yet"
                  description="Add a person and their birthday or special day to start building your reminder pipeline."
                />
              )}
            </Panel>

            <Panel
              eyebrow="People"
              title="Gift circle"
              description="A quick snapshot of who you are tracking and how much context you already have."
            >
              {loading ? (
                <LoadingList />
              ) : dashboard.people.length > 0 ? (
                <div className="grid gap-4">
                  {dashboard.people.map((person) => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No people tracked yet"
                  description="Use the quick-add form to seed your first person and start the gifting workflow."
                />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              eyebrow="Quick add"
              title="Add a new person"
              description="Keep this lightweight for now. We can expand it into a full profile editor after the dashboard feels right."
            >
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Name"
                    value={formState.name}
                    onChange={(value) => setFormState((current) => ({ ...current, name: value }))}
                    placeholder="Jamie Rivera"
                    required
                  />
                  <Field
                    label="Relationship"
                    value={formState.relationship}
                    onChange={(value) =>
                      setFormState((current) => ({ ...current, relationship: value }))
                    }
                    placeholder="Friend, cousin, partner"
                  />
                </div>
                <Field
                  label="Interests"
                  value={formState.interests}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, interests: value }))
                  }
                  placeholder="Books, coffee, skincare"
                />
                <TextAreaField
                  label="Notes"
                  value={formState.notes}
                  onChange={(value) => setFormState((current) => ({ ...current, notes: value }))}
                  placeholder="A few hints that will help future you pick better gifts."
                />

                {submitError ? <p className="text-sm text-[#a0401f]">{submitError}</p> : null}
                {submitSuccess ? <p className="text-sm text-[#2a6b46]">{submitSuccess}</p> : null}

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#b85c38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d2d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving person..." : "Add person"}
                </button>
              </form>
            </Panel>

            <Panel
              eyebrow="Calendar"
              title="Add an occasion"
              description="Attach a birthday, anniversary, or custom date to someone already in your circle."
            >
              <form className="space-y-4" onSubmit={handleOccasionSubmit}>
                <SelectField
                  label="Person"
                  value={String(occasionForm.person_id)}
                  onChange={(value) =>
                    setOccasionForm((current) => ({ ...current, person_id: Number(value) }))
                  }
                  options={dashboard.people.map((person) => ({
                    value: String(person.id),
                    label: person.name,
                  }))}
                  disabled={dashboard.people.length === 0}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Occasion type"
                    value={occasionForm.kind}
                    onChange={(value) =>
                      setOccasionForm((current) => ({ ...current, kind: value }))
                    }
                    options={occasionKinds}
                  />
                  <Field
                    label="Date"
                    value={occasionForm.date}
                    onChange={(value) =>
                      setOccasionForm((current) => ({ ...current, date: value }))
                    }
                    placeholder="2099-06-10"
                    type="date"
                    required
                  />
                </div>
                <Field
                  label="Title"
                  value={occasionForm.title}
                  onChange={(value) =>
                    setOccasionForm((current) => ({ ...current, title: value }))
                  }
                  placeholder="Alex Birthday"
                  required
                />
                <label className="flex items-center gap-3 rounded-2xl bg-[#f8f0e4] px-4 py-3 text-sm text-[#5f4a3a]">
                  <input
                    type="checkbox"
                    checked={occasionForm.recurring_yearly}
                    onChange={(event) =>
                      setOccasionForm((current) => ({
                        ...current,
                        recurring_yearly: event.target.checked,
                      }))
                    }
                  />
                  Repeat this occasion every year
                </label>

                {occasionError ? <p className="text-sm text-[#a0401f]">{occasionError}</p> : null}
                {occasionSuccess ? <p className="text-sm text-[#2a6b46]">{occasionSuccess}</p> : null}

                <button
                  type="submit"
                  disabled={isPending || dashboard.people.length === 0}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#7c4a36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#683c2b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving occasion..." : "Add occasion"}
                </button>
              </form>
            </Panel>

            <Panel
              eyebrow="Idea capture"
              title="Save a gift idea"
              description="Log something while it is fresh, even if you are not ready to buy it yet."
            >
              <form className="space-y-4" onSubmit={handleGiftIdeaSubmit}>
                <SelectField
                  label="Person"
                  value={String(giftIdeaForm.person_id)}
                  onChange={(value) =>
                    setGiftIdeaForm((current) => ({ ...current, person_id: Number(value) }))
                  }
                  options={dashboard.people.map((person) => ({
                    value: String(person.id),
                    label: person.name,
                  }))}
                  disabled={dashboard.people.length === 0}
                />
                <Field
                  label="Idea title"
                  value={giftIdeaForm.title}
                  onChange={(value) =>
                    setGiftIdeaForm((current) => ({ ...current, title: value }))
                  }
                  placeholder="Weekend getaway voucher"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Status"
                    value={giftIdeaForm.status}
                    onChange={(value) =>
                      setGiftIdeaForm((current) => ({ ...current, status: value }))
                    }
                    options={giftIdeaStatuses}
                  />
                  <Field
                    label="Price (USD)"
                    value={
                      giftIdeaForm.price_cents === null
                        ? ""
                        : String(giftIdeaForm.price_cents / 100)
                    }
                    onChange={(value) =>
                      setGiftIdeaForm((current) => ({
                        ...current,
                        price_cents: value ? Math.round(Number(value) * 100) : null,
                      }))
                    }
                    placeholder="120"
                    type="number"
                  />
                </div>
                <Field
                  label="Link"
                  value={giftIdeaForm.url}
                  onChange={(value) => setGiftIdeaForm((current) => ({ ...current, url: value }))}
                  placeholder="https://example.com"
                  type="url"
                />
                <TextAreaField
                  label="Notes"
                  value={giftIdeaForm.notes}
                  onChange={(value) =>
                    setGiftIdeaForm((current) => ({ ...current, notes: value }))
                  }
                  placeholder="Why this feels like a good fit."
                />

                {giftIdeaError ? <p className="text-sm text-[#a0401f]">{giftIdeaError}</p> : null}
                {giftIdeaSuccess ? <p className="text-sm text-[#2a6b46]">{giftIdeaSuccess}</p> : null}

                <button
                  type="submit"
                  disabled={isPending || dashboard.people.length === 0}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#2f241d] px-5 py-3 text-sm font-semibold text-[#f8ede0] transition hover:bg-[#231912] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving idea..." : "Save gift idea"}
                </button>
              </form>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-black/5 bg-card px-5 py-5 shadow-[0_24px_70px_rgba(83,55,32,0.08)] sm:px-6 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: "cream" | "white" | "ink";
  detail?: string;
}) {
  const toneClassName =
    tone === "ink"
      ? "bg-[#2f241d] text-[#f8ede0]"
      : tone === "white"
        ? "bg-white text-foreground"
        : "bg-[#fff4e8] text-foreground";

  return (
    <div className={`rounded-[1.35rem] px-4 py-4 shadow-[0_14px_35px_rgba(83,55,32,0.08)] ${toneClassName}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm opacity-75">{detail}</p> : null}
    </div>
  );
}

function OccasionCard({ occasion }: { occasion: Occasion }) {
  return (
    <article className="rounded-[1.4rem] border border-black/6 bg-[#fff7ef] p-4 shadow-[0_12px_30px_rgba(83,55,32,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {occasion.kind}
          </p>
          <h3 className="mt-2 text-lg font-semibold">{occasion.title}</h3>
          <p className="mt-1 text-sm text-muted">{occasion.person_name}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#8b5b42]">
          {formatOccasionDate(occasion.date)}
        </span>
      </div>
    </article>
  );
}

function PersonCard({ person }: { person: Person }) {
  const tags = interestTags(person.interests);

  return (
    <article className="rounded-[1.4rem] border border-black/6 bg-white p-5 shadow-[0_12px_30px_rgba(83,55,32,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">{person.name}</h3>
          <p className="mt-1 text-sm text-muted">{person.relationship || "Relationship not set"}</p>
          {person.notes ? <p className="mt-3 text-sm leading-6 text-muted">{person.notes}</p> : null}
        </div>
        <div className="grid min-w-[160px] gap-2 rounded-[1.2rem] bg-[#f8f0e4] p-3 text-sm text-[#5f4a3a]">
          <div className="flex items-center justify-between gap-3">
            <span>Occasions</span>
            <strong>{person.occasions.length}</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Gift ideas</span>
            <strong>{person.gift_ideas.length}</strong>
          </div>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e5c4aa] bg-[#fff5eb] px-3 py-1 text-xs font-medium text-[#935236]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {person.gift_ideas.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {person.gift_ideas.slice(0, 2).map((giftIdea) => (
            <div
              key={giftIdea.id}
              className="flex items-center justify-between rounded-2xl bg-[#fbf7f2] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{giftIdea.title}</p>
                <p className="text-muted">{giftIdea.status}</p>
              </div>
              {giftIdea.price_cents ? (
                <span className="font-medium text-[#704933]">
                  ${(giftIdea.price_cents / 100).toFixed(0)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: "text" | "date" | "url" | "number";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[#5f4a3a]">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#e5d8ca] bg-[#fffdf9] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[#c97a58] focus:ring-2 focus:ring-[#f2d7c2]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[#5f4a3a]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-2xl border border-[#e5d8ca] bg-[#fffdf9] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[#c97a58] focus:ring-2 focus:ring-[#f2d7c2] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[#5f4a3a]">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#e5d8ca] bg-[#fffdf9] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[#c97a58] focus:ring-2 focus:ring-[#f2d7c2]"
      />
    </label>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-[#dbb89c] bg-[#fff9f2] px-5 py-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-[1.4rem] bg-[linear-gradient(90deg,#f4eadf,#fff7ef,#f4eadf)]"
        />
      ))}
    </div>
  );
}

function LoadingList() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-[1.4rem] bg-[linear-gradient(90deg,#f4eadf,#fff7ef,#f4eadf)]"
        />
      ))}
    </div>
  );
}
