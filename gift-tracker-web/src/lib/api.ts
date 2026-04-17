export type Occasion = {
  id: number;
  person_id: number;
  person_name: string;
  kind: string;
  title: string;
  date: string;
  recurring_yearly: boolean;
  reminder_days_before: number;
  reminder_enabled: boolean;
};

export type GiftIdea = {
  id: number;
  person_id: number;
  title: string;
  url: string | null;
  price_cents: number | null;
  notes: string | null;
  status: string;
};

export type Person = {
  id: number;
  name: string;
  relationship: string | null;
  notes: string | null;
  interests: string | null;
  occasions: Occasion[];
  gift_ideas: GiftIdea[];
};

export type DashboardData = {
  people: Person[];
  upcomingOccasions: Occasion[];
  reminderFeed: ReminderFeedItem[];
};

export type ReminderFeedItem = Occasion & {
  reminder_date: string;
  days_until_reminder: number;
  days_until_occurrence: number;
};

export type CreatePersonInput = {
  name: string;
  relationship: string;
  interests: string;
  notes: string;
};

export type CreateOccasionInput = {
  person_id: number;
  kind: string;
  title: string;
  date: string;
  recurring_yearly: boolean;
  reminder_days_before: number;
  reminder_enabled: boolean;
};

export type CreateGiftIdeaInput = {
  person_id: number;
  title: string;
  url: string;
  price_cents: number | null;
  notes: string;
  status: string;
};

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : Array.isArray(body?.errors)
          ? body.errors.join(", ")
          : "Request failed.";

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const apiBaseUrl = getApiBaseUrl();
  const [people, upcomingOccasions, reminderFeed] = await Promise.all([
    fetch(`${apiBaseUrl}/api/v1/people`, { cache: "no-store" }).then((response) =>
      parseJson<Person[]>(response),
    ),
    fetch(`${apiBaseUrl}/api/v1/occasions/upcoming?limit=6`, {
      cache: "no-store",
    }).then((response) => parseJson<Occasion[]>(response)),
    fetch(`${apiBaseUrl}/api/v1/occasions/reminders?window_days=60`, {
      cache: "no-store",
    }).then((response) => parseJson<ReminderFeedItem[]>(response)),
  ]);

  return { people, upcomingOccasions, reminderFeed };
}

export async function createPerson(input: CreatePersonInput) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/people`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      person: input,
    }),
  }).then((response) => parseJson<Person>(response));
}

export async function createOccasion(input: CreateOccasionInput) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/occasions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      occasion: input,
    }),
  }).then((response) => parseJson<Occasion>(response));
}

export async function createGiftIdea(input: CreateGiftIdeaInput) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/gift_ideas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gift_idea: input,
    }),
  }).then((response) => parseJson<GiftIdea>(response));
}
