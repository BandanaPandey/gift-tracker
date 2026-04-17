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
  email: string | null;
  relationship: string | null;
  notes: string | null;
  interests: string | null;
  occasions: Occasion[];
  gift_ideas: GiftIdea[];
};

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: CurrentUser;
};

export type DashboardData = {
  people: Person[];
  upcomingOccasions: Occasion[];
  reminderFeed: ReminderFeedItem[];
  reminderActivity: ReminderNotification[];
};

export type ReminderFeedItem = Occasion & {
  reminder_date: string;
  days_until_reminder: number;
  days_until_occurrence: number;
};

export type ReminderNotification = {
  id: number;
  occasion_id: number;
  person_name: string;
  title: string;
  occasion_date: string;
  reminder_date: string;
  channel: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type CreatePersonInput = {
  name: string;
  email: string;
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

function authHeaders(token?: string): Record<string, string> {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
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

export async function fetchDashboardData(token: string): Promise<DashboardData> {
  const apiBaseUrl = getApiBaseUrl();
  const [people, upcomingOccasions, reminderFeed, reminderActivity] = await Promise.all([
    fetch(`${apiBaseUrl}/api/v1/people`, { cache: "no-store", headers: authHeaders(token) }).then((response) =>
      parseJson<Person[]>(response),
    ),
    fetch(`${apiBaseUrl}/api/v1/occasions/upcoming?limit=6`, {
      cache: "no-store",
      headers: authHeaders(token),
    }).then((response) => parseJson<Occasion[]>(response)),
    fetch(`${apiBaseUrl}/api/v1/occasions/reminders?window_days=60`, {
      cache: "no-store",
      headers: authHeaders(token),
    }).then((response) => parseJson<ReminderFeedItem[]>(response)),
    fetch(`${apiBaseUrl}/api/v1/reminder_notifications?limit=8`, {
      cache: "no-store",
      headers: authHeaders(token),
    }).then((response) => parseJson<ReminderNotification[]>(response)),
  ]);

  return { people, upcomingOccasions, reminderFeed, reminderActivity };
}

export async function createPerson(input: CreatePersonInput, token: string) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/people`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      person: input,
    }),
  }).then((response) => parseJson<Person>(response));
}

export async function createOccasion(input: CreateOccasionInput, token: string) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/occasions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      occasion: input,
    }),
  }).then((response) => parseJson<Occasion>(response));
}

export async function createGiftIdea(input: CreateGiftIdeaInput, token: string) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/gift_ideas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      gift_idea: input,
    }),
  }).then((response) => parseJson<GiftIdea>(response));
}

export async function queueReminderNotifications(token: string, targetDate?: string) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/reminder_notifications/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(targetDate ? { target_date: targetDate } : {}),
  }).then((response) =>
    parseJson<{
      target_date: string;
      queued_count: number;
      notifications: ReminderNotification[];
    }>(response),
  );
}

export async function processQueuedReminderNotifications(token: string) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/reminder_notifications/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
  }).then((response) =>
    parseJson<{
      processed_count: number;
      sent_count: number;
      skipped_count: number;
      notifications: ReminderNotification[];
    }>(response),
  );
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user: input }),
  }).then((response) => parseJson<AuthResponse>(response));
}

export async function login(input: { email: string; password: string }) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session: input }),
  }).then((response) => parseJson<AuthResponse>(response));
}

export async function fetchCurrentUser(token: string) {
  const apiBaseUrl = getApiBaseUrl();

  return fetch(`${apiBaseUrl}/api/v1/auth/me`, {
    headers: authHeaders(token),
    cache: "no-store",
  }).then((response) => parseJson<{ user: CurrentUser }>(response));
}
