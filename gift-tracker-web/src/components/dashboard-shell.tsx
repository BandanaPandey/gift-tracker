"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  createGiftIdea,
  createOccasion,
  createPerson,
  deleteGiftIdea,
  deleteOccasion,
  deletePerson,
  fetchDashboardData,
  getApiBaseUrl,
  processQueuedReminderNotifications,
  queueReminderNotifications,
  updateReminderPreferences,
  type CreateGiftIdeaInput,
  type CreateOccasionInput,
  type CreatePersonInput,
  type CurrentUser,
  type DashboardData,
  type GiftIdea,
  type Occasion,
  type Person,
  type ReminderFeedItem,
  type ReminderNotification,
  updateGiftIdea,
  updateOccasion,
  updatePerson,
} from "@/lib/api";

const emptyPersonForm: CreatePersonInput = {
  name: "",
  email: "",
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
  reminder_days_before: 14,
  reminder_enabled: true,
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

type EditorTarget =
  | { type: "person"; id: number }
  | { type: "occasion"; id: number }
  | { type: "giftIdea"; id: number };

type DeleteTarget =
  | {
      type: "person";
      id: number;
      title: string;
      description: string;
      confirmLabel: string;
    }
  | {
      type: "occasion";
      id: number;
      title: string;
      description: string;
      confirmLabel: string;
    }
  | {
      type: "giftIdea";
      id: number;
      title: string;
      description: string;
      confirmLabel: string;
    };

function formatOccasionDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function reminderLabel(occasion: Occasion) {
  if (!occasion.reminder_enabled) {
    return "Reminder off";
  }

  return `${occasion.reminder_days_before} day${occasion.reminder_days_before === 1 ? "" : "s"} before`;
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

function totalOccasions(people: Person[]) {
  return people.reduce((sum, person) => sum + person.occasions.length, 0);
}

function interestTags(interests: string | null) {
  return interests
    ? interests
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
}

function personToForm(person: Person): CreatePersonInput {
  return {
    name: person.name,
    email: person.email ?? "",
    relationship: person.relationship ?? "",
    interests: person.interests ?? "",
    notes: person.notes ?? "",
  };
}

function occasionToForm(occasion: Occasion): CreateOccasionInput {
  return {
    person_id: occasion.person_id,
    kind: occasion.kind,
    title: occasion.title,
    date: occasion.date,
    recurring_yearly: occasion.recurring_yearly,
    reminder_days_before: occasion.reminder_days_before,
    reminder_enabled: occasion.reminder_enabled,
  };
}

function giftIdeaToForm(giftIdea: GiftIdea): CreateGiftIdeaInput {
  return {
    person_id: giftIdea.person_id,
    title: giftIdea.title,
    url: giftIdea.url ?? "",
    price_cents: giftIdea.price_cents,
    notes: giftIdea.notes ?? "",
    status: giftIdea.status,
  };
}

export function DashboardShell({
  token,
  currentUser,
  onCurrentUserChange,
  onLogout,
}: {
  token: string;
  currentUser: CurrentUser;
  onCurrentUserChange: (user: CurrentUser) => void;
  onLogout: () => void;
}) {
  const [dashboard, setDashboard] = useState<DashboardData>({
    people: [],
    upcomingOccasions: [],
    reminderFeed: [],
    reminderActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [occasionError, setOccasionError] = useState<string | null>(null);
  const [occasionSuccess, setOccasionSuccess] = useState<string | null>(null);
  const [giftIdeaError, setGiftIdeaError] = useState<string | null>(null);
  const [giftIdeaSuccess, setGiftIdeaSuccess] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueSuccess, setQueueSuccess] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSuccess, setEditorSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreatePersonInput>(emptyPersonForm);
  const [occasionForm, setOccasionForm] = useState<CreateOccasionInput>({
    ...emptyOccasionForm,
    reminder_days_before: currentUser.default_reminder_days_before,
    reminder_enabled: currentUser.default_reminder_enabled,
  });
  const [giftIdeaForm, setGiftIdeaForm] = useState<CreateGiftIdeaInput>(emptyGiftIdeaForm);
  const [personEditForm, setPersonEditForm] = useState<CreatePersonInput>(emptyPersonForm);
  const [occasionEditForm, setOccasionEditForm] = useState<CreateOccasionInput>(emptyOccasionForm);
  const [giftIdeaEditForm, setGiftIdeaEditForm] = useState<CreateGiftIdeaInput>(emptyGiftIdeaForm);
  const [settingsForm, setSettingsForm] = useState({
    default_reminder_days_before: currentUser.default_reminder_days_before,
    default_reminder_enabled: currentUser.default_reminder_enabled,
    reminder_feed_window_days: currentUser.reminder_feed_window_days,
  });
  const [isPending, startTransition] = useTransition();

  const apiBaseUrl = getApiBaseUrl();

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDashboardData(token, currentUser.reminder_feed_window_days);
      setDashboard(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token, currentUser.reminder_feed_window_days]);

  const allOccasions = useMemo(
    () =>
      dashboard.people.flatMap((person) =>
        person.occasions.map((occasion) => ({
          ...occasion,
          person_name: person.name,
        })),
      ),
    [dashboard.people],
  );

  const allGiftIdeas = useMemo(
    () =>
      dashboard.people.flatMap((person) =>
        person.gift_ideas.map((giftIdea) => ({
          ...giftIdea,
          person_name: person.name,
        })),
      ),
    [dashboard.people],
  );

  const selectedPerson =
    editorTarget?.type === "person"
      ? dashboard.people.find((person) => person.id === editorTarget.id) ?? null
      : null;
  const selectedOccasion =
    editorTarget?.type === "occasion"
      ? allOccasions.find((occasion) => occasion.id === editorTarget.id) ?? null
      : null;
  const selectedGiftIdea =
    editorTarget?.type === "giftIdea"
      ? allGiftIdeas.find((giftIdea) => giftIdea.id === editorTarget.id) ?? null
      : null;

  useEffect(() => {
    setSettingsForm({
      default_reminder_days_before: currentUser.default_reminder_days_before,
      default_reminder_enabled: currentUser.default_reminder_enabled,
      reminder_feed_window_days: currentUser.reminder_feed_window_days,
    });
    setOccasionForm((current) => ({
      ...current,
      reminder_days_before: current.title ? current.reminder_days_before : currentUser.default_reminder_days_before,
      reminder_enabled: current.title ? current.reminder_enabled : currentUser.default_reminder_enabled,
    }));
  }, [
    currentUser.default_reminder_days_before,
    currentUser.default_reminder_enabled,
    currentUser.reminder_feed_window_days,
  ]);

  useEffect(() => {
    if (dashboard.people.length === 0) {
      setOccasionForm({
        ...emptyOccasionForm,
        reminder_days_before: currentUser.default_reminder_days_before,
        reminder_enabled: currentUser.default_reminder_enabled,
      });
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
  }, [dashboard.people, currentUser.default_reminder_days_before, currentUser.default_reminder_enabled]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (editorTarget?.type === "person" && selectedPerson) {
      setPersonEditForm(personToForm(selectedPerson));
    }
  }, [editorTarget, selectedPerson]);

  useEffect(() => {
    if (editorTarget?.type === "occasion" && selectedOccasion) {
      setOccasionEditForm(occasionToForm(selectedOccasion));
    }
  }, [editorTarget, selectedOccasion]);

  useEffect(() => {
    if (editorTarget?.type === "giftIdea" && selectedGiftIdea) {
      setGiftIdeaEditForm(giftIdeaToForm(selectedGiftIdea));
    }
  }, [editorTarget, selectedGiftIdea]);

  function clearEditorMessages() {
    setEditorError(null);
    setEditorSuccess(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  }

  function openPersonEditor(person: Person) {
    clearEditorMessages();
    setDeleteTarget(null);
    setEditorTarget({ type: "person", id: person.id });
    setPersonEditForm(personToForm(person));
  }

  function openOccasionEditor(occasion: Occasion) {
    clearEditorMessages();
    setDeleteTarget(null);
    setEditorTarget({ type: "occasion", id: occasion.id });
    setOccasionEditForm(occasionToForm(occasion));
  }

  function openGiftIdeaEditor(giftIdea: GiftIdea) {
    clearEditorMessages();
    setDeleteTarget(null);
    setEditorTarget({ type: "giftIdea", id: giftIdea.id });
    setGiftIdeaEditForm(giftIdeaToForm(giftIdea));
  }

  function openPersonDelete(person: Person) {
    clearEditorMessages();
    setEditorTarget(null);
    setDeleteTarget({
      type: "person",
      id: person.id,
      title: `Delete ${person.name}?`,
      description:
        "This permanently removes the person, all of their occasions, and all of their saved gift ideas. This action cannot be undone.",
      confirmLabel: "Delete person and related records",
    });
  }

  function openOccasionDelete(occasion: Occasion) {
    clearEditorMessages();
    setEditorTarget(null);
    setDeleteTarget({
      type: "occasion",
      id: occasion.id,
      title: `Delete ${occasion.title}?`,
      description: "This permanently removes the occasion from your reminder timeline.",
      confirmLabel: "Delete occasion",
    });
  }

  function openGiftIdeaDelete(giftIdea: GiftIdea) {
    clearEditorMessages();
    setEditorTarget(null);
    setDeleteTarget({
      type: "giftIdea",
      id: giftIdea.id,
      title: `Delete ${giftIdea.title}?`,
      description: "This permanently removes the gift idea from your planning list.",
      confirmLabel: "Delete gift idea",
    });
  }

  function resetStudio() {
    setEditorTarget(null);
    setDeleteTarget(null);
    clearEditorMessages();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    startTransition(async () => {
      try {
        await createPerson(formState, token);
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
        await createOccasion(occasionForm, token);
        setOccasionForm((current) => ({
          ...emptyOccasionForm,
          person_id: current.person_id,
          reminder_days_before: currentUser.default_reminder_days_before,
          reminder_enabled: currentUser.default_reminder_enabled,
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
        await createGiftIdea(giftIdeaForm, token);
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

  function handleQueueReminders() {
    setQueueError(null);
    setQueueSuccess(null);

    startTransition(async () => {
      try {
        const result = await queueReminderNotifications(token);
        setQueueSuccess(
          result.queued_count > 0
            ? `${result.queued_count} reminder notification${result.queued_count === 1 ? "" : "s"} queued.`
            : "No reminders are due today."
        );
        await loadDashboard();
      } catch (queueErr) {
        setQueueError(
          queueErr instanceof Error ? queueErr.message : "Unable to queue reminders right now.",
        );
      }
    });
  }

  function handleProcessReminders() {
    setProcessError(null);
    setProcessSuccess(null);

    startTransition(async () => {
      try {
        const result = await processQueuedReminderNotifications(token);
        setProcessSuccess(
          result.processed_count > 0
            ? `${result.sent_count} sent, ${result.skipped_count} skipped.`
            : "No queued reminders were waiting."
        );
        await loadDashboard();
      } catch (processErr) {
        setProcessError(
          processErr instanceof Error ? processErr.message : "Unable to process queued reminders."
        );
      }
    });
  }

  function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);

    startTransition(async () => {
      try {
        const response = await updateReminderPreferences(token, settingsForm);
        onCurrentUserChange(response.user);
        setSettingsSuccess("Reminder defaults updated.");
        await loadDashboard();
      } catch (settingsErr) {
        setSettingsError(
          settingsErr instanceof Error ? settingsErr.message : "Unable to update reminder defaults.",
        );
      }
    });
  }

  function handlePersonUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPerson) {
      return;
    }

    setEditorError(null);
    setEditorSuccess(null);

    startTransition(async () => {
      try {
        await updatePerson(selectedPerson.id, personEditForm, token);
        setEditorSuccess("Person details updated.");
        await loadDashboard();
      } catch (updateErr) {
        setEditorError(
          updateErr instanceof Error ? updateErr.message : "Unable to update this person right now.",
        );
      }
    });
  }

  function handleOccasionUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOccasion) {
      return;
    }

    setEditorError(null);
    setEditorSuccess(null);

    startTransition(async () => {
      try {
        await updateOccasion(selectedOccasion.id, occasionEditForm, token);
        setEditorSuccess("Occasion updated.");
        await loadDashboard();
      } catch (updateErr) {
        setEditorError(
          updateErr instanceof Error
            ? updateErr.message
            : "Unable to update this occasion right now.",
        );
      }
    });
  }

  function handleGiftIdeaUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGiftIdea) {
      return;
    }

    setEditorError(null);
    setEditorSuccess(null);

    startTransition(async () => {
      try {
        await updateGiftIdea(selectedGiftIdea.id, giftIdeaEditForm, token);
        setEditorSuccess("Gift idea updated.");
        await loadDashboard();
      } catch (updateErr) {
        setEditorError(
          updateErr instanceof Error
            ? updateErr.message
            : "Unable to update this gift idea right now.",
        );
      }
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleteError(null);
    setDeleteSuccess(null);

    startTransition(async () => {
      try {
        if (deleteTarget.type === "person") {
          await deletePerson(deleteTarget.id, token);
          setDeleteSuccess("Person and related records removed.");
        } else if (deleteTarget.type === "occasion") {
          await deleteOccasion(deleteTarget.id, token);
          setDeleteSuccess("Occasion removed.");
        } else {
          await deleteGiftIdea(deleteTarget.id, token);
          setDeleteSuccess("Gift idea removed.");
        }

        await loadDashboard();
        setDeleteTarget(null);
        setEditorTarget(null);
      } catch (deleteErr) {
        setDeleteError(
          deleteErr instanceof Error ? deleteErr.message : "Unable to delete this record right now.",
        );
      }
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff9f2,_#f2e6d7_42%,_#e2cfb9)] px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-80 max-w-6xl rounded-full bg-[radial-gradient(circle,_rgba(184,92,56,0.16),_transparent_70%)] blur-3xl" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,250,242,0.96),rgba(255,242,226,0.9))] shadow-[0_35px_90px_rgba(83,55,32,0.16)] backdrop-blur">
          <div className="grid gap-8 px-5 py-6 sm:px-7 lg:grid-cols-[1.35fr_0.95fr] lg:px-10 lg:py-9">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-[#e7c9b0] bg-[#fff5ea] px-4 py-1 text-sm font-medium text-[#9d4d2e]">
                Warm editorial dashboard
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#2b221b] sm:text-5xl">
                  Keep gift planning calm, clear, and beautifully close at hand.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Manage people, special dates, and ideas from one responsive workspace with
                  smoother editing, safer delete flows, and a little more breathing room.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="People tracked" value={String(dashboard.people.length)} tone="cream" />
                <StatCard label="Occasions captured" value={String(totalOccasions(dashboard.people))} tone="white" />
                <StatCard
                  label="Gift ideas saved"
                  value={String(totalGiftIdeas(dashboard.people))}
                  tone="ink"
                  detail={`${totalBoughtIdeas(dashboard.people)} already bought`}
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-[#2f241d] p-5 text-[#f8ede0] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[#d9bca5]">Studio controls</p>
              <div className="mt-4 space-y-4">
                <InfoTile label="Signed in as">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="mt-1 text-sm text-[#d9bca5]">{currentUser.email}</p>
                </InfoTile>
                <InfoTile label="API base URL">
                  <p className="break-all text-sm">{apiBaseUrl}</p>
                </InfoTile>
                <InfoTile label="Status">
                  <p className="text-sm">
                    {loading
                      ? "Loading dashboard data..."
                      : error
                        ? "Connection needs attention"
                        : "Everything is connected"}
                  </p>
                </InfoTile>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StudioButton
                    onClick={() => {
                      setLoading(true);
                      void loadDashboard();
                    }}
                    light
                  >
                    Refresh data
                  </StudioButton>
                  <StudioButton onClick={onLogout}>Log out</StudioButton>
                  <StudioButton onClick={handleQueueReminders}>Queue reminders</StudioButton>
                  <StudioButton onClick={handleProcessReminders}>Process reminders</StudioButton>
                </div>
                <StatusMessage error={queueError} success={queueSuccess} />
                <StatusMessage error={processError} success={processSuccess} />
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

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Panel
              eyebrow="Reminder runway"
              title="Attention queue"
              description="These are the moments where a reminder should surface soon based on your current lead times."
            >
              {loading ? (
                <LoadingList />
              ) : dashboard.reminderFeed.length > 0 ? (
                <div className="grid gap-3">
                  {dashboard.reminderFeed.map((reminder) => (
                    <ReminderCard key={`${reminder.id}-${reminder.reminder_date}`} reminder={reminder} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No reminders due soon"
                  description="As your occasion dates get closer, this queue will show which people need your attention next."
                />
              )}
            </Panel>

            <Panel
              eyebrow="Soonest moments"
              title="Upcoming occasions"
              description="Edit a date directly from the timeline, or use it to jump into the management studio."
            >
              {loading ? (
                <LoadingGrid />
              ) : dashboard.upcomingOccasions.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {dashboard.upcomingOccasions.map((occasion) => (
                    <OccasionCard
                      key={occasion.id}
                      occasion={occasion}
                      active={editorTarget?.type === "occasion" && editorTarget.id === occasion.id}
                      onEdit={() => openOccasionEditor(occasion)}
                      onDelete={() => openOccasionDelete(occasion)}
                    />
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
              description="This is your working roster. Each person card now supports edits, protected delete flows, and quick access to their dates and gift ideas."
            >
              {loading ? (
                <LoadingList />
              ) : dashboard.people.length > 0 ? (
                <div className="grid gap-4">
                  {dashboard.people.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      active={editorTarget?.type === "person" && editorTarget.id === person.id}
                      activeOccasionId={editorTarget?.type === "occasion" ? editorTarget.id : null}
                      activeGiftIdeaId={editorTarget?.type === "giftIdea" ? editorTarget.id : null}
                      onEditPerson={() => openPersonEditor(person)}
                      onDeletePerson={() => openPersonDelete(person)}
                      onEditOccasion={openOccasionEditor}
                      onDeleteOccasion={openOccasionDelete}
                      onEditGiftIdea={openGiftIdeaEditor}
                      onDeleteGiftIdea={openGiftIdeaDelete}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No people tracked yet"
                  description="Use the quick-add form to seed your first person and start the gifting workflow."
                />
              )}
            </Panel>

            <Panel
              eyebrow="Reminder log"
              title="Recent reminder activity"
              description="This queue shows which reminder notifications have been generated so far."
            >
              {loading ? (
                <LoadingList />
              ) : dashboard.reminderActivity.length > 0 ? (
                <div className="grid gap-3">
                  {dashboard.reminderActivity.map((notification) => (
                    <ReminderActivityCard key={notification.id} notification={notification} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No reminder activity yet"
                  description="Use the queue action to create notifications for reminders due today."
                />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              eyebrow="Manage records"
              title="Edit and delete studio"
              description="Select any person, occasion, or gift idea from the dashboard to refine it here."
            >
              {editorTarget?.type === "person" && selectedPerson ? (
                <form className="space-y-4" onSubmit={handlePersonUpdate}>
                  <StudioHeader
                    label="Editing person"
                    title={selectedPerson.name}
                    onCancel={resetStudio}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Name"
                      value={personEditForm.name}
                      onChange={(value) =>
                        setPersonEditForm((current) => ({ ...current, name: value }))
                      }
                      placeholder="Jamie Rivera"
                      required
                    />
                    <Field
                      label="Email"
                      value={personEditForm.email}
                      onChange={(value) =>
                        setPersonEditForm((current) => ({ ...current, email: value }))
                      }
                      placeholder="jamie@example.com"
                      type="email"
                    />
                  </div>
                  <Field
                    label="Relationship"
                    value={personEditForm.relationship}
                    onChange={(value) =>
                      setPersonEditForm((current) => ({ ...current, relationship: value }))
                    }
                    placeholder="Friend, sibling, partner"
                  />
                  <Field
                    label="Interests"
                    value={personEditForm.interests}
                    onChange={(value) =>
                      setPersonEditForm((current) => ({ ...current, interests: value }))
                    }
                    placeholder="Books, coffee, skincare"
                  />
                  <TextAreaField
                    label="Notes"
                    value={personEditForm.notes}
                    onChange={(value) =>
                      setPersonEditForm((current) => ({ ...current, notes: value }))
                    }
                    placeholder="Useful details for future gifting decisions."
                  />
                  <StatusMessage error={editorError} success={editorSuccess} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <PrimaryButton type="submit" disabled={isPending}>
                      {isPending ? "Saving person..." : "Save person"}
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={resetStudio}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </form>
              ) : editorTarget?.type === "occasion" && selectedOccasion ? (
                <form className="space-y-4" onSubmit={handleOccasionUpdate}>
                  <StudioHeader
                    label="Editing occasion"
                    title={selectedOccasion.title}
                    onCancel={resetStudio}
                  />
                  <SelectField
                    label="Person"
                    value={String(occasionEditForm.person_id)}
                    onChange={(value) =>
                      setOccasionEditForm((current) => ({
                        ...current,
                        person_id: Number(value),
                      }))
                    }
                    options={dashboard.people.map((person) => ({
                      value: String(person.id),
                      label: person.name,
                    }))}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Occasion type"
                      value={occasionEditForm.kind}
                      onChange={(value) =>
                        setOccasionEditForm((current) => ({ ...current, kind: value }))
                      }
                      options={occasionKinds}
                    />
                    <Field
                      label="Date"
                      value={occasionEditForm.date}
                      onChange={(value) =>
                        setOccasionEditForm((current) => ({ ...current, date: value }))
                      }
                      placeholder="2099-06-10"
                      type="date"
                      required
                    />
                  </div>
                  <Field
                    label="Title"
                    value={occasionEditForm.title}
                    onChange={(value) =>
                      setOccasionEditForm((current) => ({ ...current, title: value }))
                    }
                    placeholder="Alex Birthday"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Reminder lead time"
                      value={String(occasionEditForm.reminder_days_before)}
                      onChange={(value) =>
                        setOccasionEditForm((current) => ({
                          ...current,
                          reminder_days_before: Number(value || 0),
                        }))
                      }
                      placeholder="14"
                      type="number"
                      required
                    />
                    <ToggleField
                      label="Enable reminder"
                      checked={occasionEditForm.reminder_enabled}
                      onChange={(checked) =>
                        setOccasionEditForm((current) => ({
                          ...current,
                          reminder_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <ToggleField
                    label="Repeat this occasion every year"
                    checked={occasionEditForm.recurring_yearly}
                    onChange={(checked) =>
                      setOccasionEditForm((current) => ({
                        ...current,
                        recurring_yearly: checked,
                      }))
                    }
                  />
                  <StatusMessage error={editorError} success={editorSuccess} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <PrimaryButton type="submit" disabled={isPending}>
                      {isPending ? "Saving occasion..." : "Save occasion"}
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={resetStudio}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </form>
              ) : editorTarget?.type === "giftIdea" && selectedGiftIdea ? (
                <form className="space-y-4" onSubmit={handleGiftIdeaUpdate}>
                  <StudioHeader
                    label="Editing gift idea"
                    title={selectedGiftIdea.title}
                    onCancel={resetStudio}
                  />
                  <SelectField
                    label="Person"
                    value={String(giftIdeaEditForm.person_id)}
                    onChange={(value) =>
                      setGiftIdeaEditForm((current) => ({
                        ...current,
                        person_id: Number(value),
                      }))
                    }
                    options={dashboard.people.map((person) => ({
                      value: String(person.id),
                      label: person.name,
                    }))}
                  />
                  <Field
                    label="Idea title"
                    value={giftIdeaEditForm.title}
                    onChange={(value) =>
                      setGiftIdeaEditForm((current) => ({ ...current, title: value }))
                    }
                    placeholder="Weekend getaway voucher"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Status"
                      value={giftIdeaEditForm.status}
                      onChange={(value) =>
                        setGiftIdeaEditForm((current) => ({ ...current, status: value }))
                      }
                      options={giftIdeaStatuses}
                    />
                    <Field
                      label="Price (USD)"
                      value={
                        giftIdeaEditForm.price_cents === null
                          ? ""
                          : String(giftIdeaEditForm.price_cents / 100)
                      }
                      onChange={(value) =>
                        setGiftIdeaEditForm((current) => ({
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
                    value={giftIdeaEditForm.url}
                    onChange={(value) =>
                      setGiftIdeaEditForm((current) => ({ ...current, url: value }))
                    }
                    placeholder="https://example.com"
                    type="url"
                  />
                  <TextAreaField
                    label="Notes"
                    value={giftIdeaEditForm.notes}
                    onChange={(value) =>
                      setGiftIdeaEditForm((current) => ({ ...current, notes: value }))
                    }
                    placeholder="Why this feels like a strong fit."
                  />
                  <StatusMessage error={editorError} success={editorSuccess} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <PrimaryButton type="submit" disabled={isPending}>
                      {isPending ? "Saving idea..." : "Save gift idea"}
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={resetStudio}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </form>
              ) : deleteTarget ? (
                <div className="space-y-4">
                  <StudioHeader label="Delete confirmation" title={deleteTarget.title} onCancel={resetStudio} />
                  <div className="rounded-[1.5rem] border border-[#e9c4b3] bg-[linear-gradient(135deg,#fff7ef,#fff0e6)] p-5 text-[#6b3b25]">
                    <p className="text-sm leading-6">{deleteTarget.description}</p>
                  </div>
                  <StatusMessage error={deleteError} success={deleteSuccess} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <DangerButton type="button" disabled={isPending} onClick={handleConfirmDelete}>
                      {isPending ? "Deleting..." : deleteTarget.confirmLabel}
                    </DangerButton>
                    <SecondaryButton type="button" onClick={resetStudio}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Nothing selected yet"
                  description="Tap edit on any person, occasion, or gift idea to refine it here. Delete actions also open in this protected studio."
                />
              )}
            </Panel>

            <Panel
              eyebrow="Reminder defaults"
              title="Reminder settings"
              description="These defaults shape future occasions and control how far ahead the dashboard watches for reminder moments."
            >
              <form className="space-y-4" onSubmit={handleSettingsSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Default reminder lead time"
                    value={String(settingsForm.default_reminder_days_before)}
                    onChange={(value) =>
                      setSettingsForm((current) => ({
                        ...current,
                        default_reminder_days_before: Number(value || 0),
                      }))
                    }
                    placeholder="14"
                    type="number"
                    required
                  />
                  <Field
                    label="Reminder feed window"
                    value={String(settingsForm.reminder_feed_window_days)}
                    onChange={(value) =>
                      setSettingsForm((current) => ({
                        ...current,
                        reminder_feed_window_days: Number(value || 1),
                      }))
                    }
                    placeholder="60"
                    type="number"
                    required
                  />
                </div>
                <ToggleField
                  label="Enable reminders by default"
                  checked={settingsForm.default_reminder_enabled}
                  onChange={(checked) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_reminder_enabled: checked,
                    }))
                  }
                />
                <StatusMessage error={settingsError} success={settingsSuccess} />
                <PrimaryButton type="submit" disabled={isPending}>
                  {isPending ? "Saving defaults..." : "Save reminder defaults"}
                </PrimaryButton>
              </form>
            </Panel>

            <Panel
              eyebrow="Quick add"
              title="Add a new person"
              description="Keep the circle growing without leaving the dashboard."
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
                    label="Email"
                    value={formState.email}
                    onChange={(value) => setFormState((current) => ({ ...current, email: value }))}
                    placeholder="jamie@example.com"
                    type="email"
                  />
                </div>
                <Field
                  label="Relationship"
                  value={formState.relationship}
                  onChange={(value) => setFormState((current) => ({ ...current, relationship: value }))}
                  placeholder="Friend, cousin, partner"
                />
                <Field
                  label="Interests"
                  value={formState.interests}
                  onChange={(value) => setFormState((current) => ({ ...current, interests: value }))}
                  placeholder="Books, coffee, skincare"
                />
                <TextAreaField
                  label="Notes"
                  value={formState.notes}
                  onChange={(value) => setFormState((current) => ({ ...current, notes: value }))}
                  placeholder="A few hints that will help future you pick better gifts."
                />
                <StatusMessage error={submitError} success={submitSuccess} />
                <PrimaryButton type="submit" disabled={isPending}>
                  {isPending ? "Saving person..." : "Add person"}
                </PrimaryButton>
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
                    onChange={(value) => setOccasionForm((current) => ({ ...current, date: value }))}
                    placeholder="2099-06-10"
                    type="date"
                    required
                  />
                </div>
                <Field
                  label="Title"
                  value={occasionForm.title}
                  onChange={(value) => setOccasionForm((current) => ({ ...current, title: value }))}
                  placeholder="Alex Birthday"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Reminder lead time"
                    value={String(occasionForm.reminder_days_before)}
                    onChange={(value) =>
                      setOccasionForm((current) => ({
                        ...current,
                        reminder_days_before: Number(value || 0),
                      }))
                    }
                    placeholder="14"
                    type="number"
                    required
                  />
                  <ToggleField
                    label="Enable reminder"
                    checked={occasionForm.reminder_enabled}
                    onChange={(checked) =>
                      setOccasionForm((current) => ({
                        ...current,
                        reminder_enabled: checked,
                      }))
                    }
                  />
                </div>
                <ToggleField
                  label="Repeat this occasion every year"
                  checked={occasionForm.recurring_yearly}
                  onChange={(checked) =>
                    setOccasionForm((current) => ({
                      ...current,
                      recurring_yearly: checked,
                    }))
                  }
                />
                <StatusMessage error={occasionError} success={occasionSuccess} />
                <PrimaryButton type="submit" disabled={isPending || dashboard.people.length === 0}>
                  {isPending ? "Saving occasion..." : "Add occasion"}
                </PrimaryButton>
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
                  onChange={(value) => setGiftIdeaForm((current) => ({ ...current, title: value }))}
                  placeholder="Weekend getaway voucher"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Status"
                    value={giftIdeaForm.status}
                    onChange={(value) => setGiftIdeaForm((current) => ({ ...current, status: value }))}
                    options={giftIdeaStatuses}
                  />
                  <Field
                    label="Price (USD)"
                    value={
                      giftIdeaForm.price_cents === null ? "" : String(giftIdeaForm.price_cents / 100)
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
                  onChange={(value) => setGiftIdeaForm((current) => ({ ...current, notes: value }))}
                  placeholder="Why this feels like a good fit."
                />
                <StatusMessage error={giftIdeaError} success={giftIdeaSuccess} />
                <PrimaryButton type="submit" disabled={isPending || dashboard.people.length === 0}>
                  {isPending ? "Saving idea..." : "Save gift idea"}
                </PrimaryButton>
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
    <section className="rounded-[1.8rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,251,246,0.98),rgba(255,247,239,0.92))] px-5 py-5 shadow-[0_24px_70px_rgba(83,55,32,0.08)] sm:px-6 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#2b221b]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-sm text-[#d9bca5]">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function StudioHeader({
  label,
  title,
  onCancel,
}: {
  label: string;
  title: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{label}</p>
        <h3 className="mt-2 text-xl font-semibold text-[#2b221b]">{title}</h3>
      </div>
      <SecondaryButton type="button" onClick={onCancel}>
        Close
      </SecondaryButton>
    </div>
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
        : "bg-[#fff2e4] text-foreground";

  return (
    <div className={`rounded-[1.4rem] px-4 py-4 shadow-[0_14px_35px_rgba(83,55,32,0.08)] ${toneClassName}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm opacity-75">{detail}</p> : null}
    </div>
  );
}

function OccasionCard({
  occasion,
  active,
  onEdit,
  onDelete,
}: {
  occasion: Occasion;
  active: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border p-4 shadow-[0_12px_30px_rgba(83,55,32,0.06)] transition ${
        active
          ? "border-[#cc825f] bg-[linear-gradient(135deg,#fff3e8,#ffe9d8)]"
          : "border-black/6 bg-[#fff7ef]"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{occasion.kind}</p>
          <h3 className="mt-2 text-lg font-semibold">{occasion.title}</h3>
          <p className="mt-1 text-sm text-muted">{occasion.person_name}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[#9f5f3e]">
            {reminderLabel(occasion)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#8b5b42]">
            {formatOccasionDate(occasion.date)}
          </span>
          <ActionRow onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
}

function PersonCard({
  person,
  active,
  activeOccasionId,
  activeGiftIdeaId,
  onEditPerson,
  onDeletePerson,
  onEditOccasion,
  onDeleteOccasion,
  onEditGiftIdea,
  onDeleteGiftIdea,
}: {
  person: Person;
  active: boolean;
  activeOccasionId: number | null;
  activeGiftIdeaId: number | null;
  onEditPerson: () => void;
  onDeletePerson: () => void;
  onEditOccasion: (occasion: Occasion) => void;
  onDeleteOccasion: (occasion: Occasion) => void;
  onEditGiftIdea: (giftIdea: GiftIdea) => void;
  onDeleteGiftIdea: (giftIdea: GiftIdea) => void;
}) {
  const tags = interestTags(person.interests);

  return (
    <article
      className={`rounded-[1.5rem] border p-5 shadow-[0_14px_30px_rgba(83,55,32,0.07)] transition ${
        active ? "border-[#cc825f] bg-[#fff7ef]" : "border-black/6 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{person.name}</h3>
          <p className="text-sm text-muted">{person.relationship || "Relationship not set"}</p>
          <p className="text-sm text-muted">{person.email || "No reminder email set"}</p>
          {person.notes ? <p className="max-w-2xl text-sm leading-6 text-muted">{person.notes}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[210px]">
          <div className="grid gap-2 rounded-[1.2rem] bg-[#f8f0e4] p-3 text-sm text-[#5f4a3a]">
            <div className="flex items-center justify-between gap-3">
              <span>Occasions</span>
              <strong>{person.occasions.length}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Gift ideas</span>
              <strong>{person.gift_ideas.length}</strong>
            </div>
          </div>
          <ActionRow onEdit={onEditPerson} onDelete={onDeletePerson} />
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

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SubSection title="Occasions">
          {person.occasions.length > 0 ? (
            person.occasions.map((occasion) => (
              <MiniRecord
                key={occasion.id}
                active={activeOccasionId === occasion.id}
                title={occasion.title}
                subtitle={`${occasion.kind} • ${formatOccasionDate(occasion.date)}`}
                meta={reminderLabel(occasion)}
                onEdit={() => onEditOccasion(occasion)}
                onDelete={() => onDeleteOccasion(occasion)}
              />
            ))
          ) : (
            <EmptyMiniState text="No occasions yet" />
          )}
        </SubSection>

        <SubSection title="Gift ideas">
          {person.gift_ideas.length > 0 ? (
            person.gift_ideas.map((giftIdea) => (
              <MiniRecord
                key={giftIdea.id}
                active={activeGiftIdeaId === giftIdea.id}
                title={giftIdea.title}
                subtitle={giftIdea.status}
                meta={
                  giftIdea.price_cents ? `$${(giftIdea.price_cents / 100).toFixed(0)}` : "No price yet"
                }
                onEdit={() => onEditGiftIdea(giftIdea)}
                onDelete={() => onDeleteGiftIdea(giftIdea)}
              />
            ))
          ) : (
            <EmptyMiniState text="No gift ideas yet" />
          )}
        </SubSection>
      </div>
    </article>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.3rem] border border-[#eee2d4] bg-[#fbf7f2] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7d5845]">{title}</h4>
      </div>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function MiniRecord({
  title,
  subtitle,
  meta,
  active,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  meta: string;
  active: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-[1.1rem] border px-3 py-3 transition ${
        active ? "border-[#cc825f] bg-[#fff3e8]" : "border-[#eee2d4] bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-[#2b221b]">{title}</p>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#9a6548]">{meta}</p>
        </div>
        <ActionRow compact onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function EmptyMiniState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.1rem] border border-dashed border-[#dbc7b8] bg-[#fffaf6] px-4 py-4 text-sm text-muted">
      {text}
    </div>
  );
}

function ReminderCard({ reminder }: { reminder: ReminderFeedItem }) {
  return (
    <article className="rounded-[1.4rem] border border-[#e4c6b0] bg-[linear-gradient(135deg,#fff7ef,#fff1e5)] p-4 shadow-[0_12px_30px_rgba(83,55,32,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">reminder</p>
          <h3 className="mt-2 text-lg font-semibold">{reminder.title}</h3>
          <p className="mt-1 text-sm text-muted">{reminder.person_name}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#8b5b42]">
          {formatOccasionDate(reminder.reminder_date)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#7a4e37]">
        <span className="rounded-full bg-white px-3 py-1">
          {reminder.days_until_reminder <= 0
            ? "Due now"
            : `In ${reminder.days_until_reminder} day${reminder.days_until_reminder === 1 ? "" : "s"}`}
        </span>
        <span className="rounded-full bg-white px-3 py-1">
          Occasion in {reminder.days_until_occurrence} day{reminder.days_until_occurrence === 1 ? "" : "s"}
        </span>
      </div>
    </article>
  );
}

function ReminderActivityCard({ notification }: { notification: ReminderNotification }) {
  return (
    <article className="rounded-[1.4rem] border border-black/6 bg-white p-4 shadow-[0_12px_30px_rgba(83,55,32,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {notification.status}
          </p>
          <h3 className="mt-2 text-lg font-semibold">{notification.title}</h3>
          <p className="mt-1 text-sm text-muted">{notification.person_name}</p>
        </div>
        <span className="rounded-full bg-[#f8f0e4] px-3 py-1 text-xs font-medium text-[#7a4e37]">
          {notification.channel}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#7a4e37]">
        <span className="rounded-full bg-[#f8f0e4] px-3 py-1">
          Reminder {formatOccasionDate(notification.reminder_date)}
        </span>
        <span className="rounded-full bg-[#f8f0e4] px-3 py-1">
          Occasion {formatOccasionDate(notification.occasion_date)}
        </span>
        {notification.sent_at ? (
          <span className="rounded-full bg-[#f8f0e4] px-3 py-1">
            Sent {formatOccasionDate(notification.sent_at)}
          </span>
        ) : null}
      </div>
      {notification.error_message ? (
        <p className="mt-3 text-sm text-[#a0401f]">{notification.error_message}</p>
      ) : null}
    </article>
  );
}

function ActionRow({
  onEdit,
  onDelete,
  compact = false,
}: {
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const sizeClass = compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onEdit}
        className={`inline-flex items-center justify-center rounded-full border border-[#dfc4b0] bg-white text-[#7c4a36] transition hover:border-[#c57b58] hover:bg-[#fff4ea] ${sizeClass}`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={`inline-flex items-center justify-center rounded-full border border-[#efc1b2] bg-[#fff4ef] text-[#a14725] transition hover:border-[#db8e73] hover:bg-[#ffe7dd] ${sizeClass}`}
      >
        Delete
      </button>
    </div>
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
  type?: "text" | "date" | "url" | "number" | "email";
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

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#e9dacd] bg-[#fffaf5] px-4 py-3 text-sm text-[#5f4a3a]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
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

function StatusMessage({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (!error && !success) {
    return null;
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="rounded-2xl border border-[#efc1b2] bg-[#fff3ee] px-4 py-3 text-sm text-[#a0401f]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-2xl border border-[#cfe3d4] bg-[#eff8f1] px-4 py-3 text-sm text-[#2a6b46]">
          {success}
        </p>
      ) : null}
    </div>
  );
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex w-full items-center justify-center rounded-full bg-[#b85c38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d2d] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex w-full items-center justify-center rounded-full border border-[#ddc6b2] bg-white px-5 py-3 text-sm font-semibold text-[#6e4d39] transition hover:bg-[#fff7ef] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex w-full items-center justify-center rounded-full bg-[#a84a2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f3d21] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function StudioButton({
  children,
  light = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { light?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
        light
          ? "bg-[#f8ede0] text-[#2f241d] hover:bg-white"
          : "border border-white/20 text-[#f8ede0] hover:bg-white/10"
      } ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-[1.4rem] bg-[linear-gradient(90deg,#f4eadf,#fff7ef,#f4eadf)]"
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
          className="h-40 animate-pulse rounded-[1.4rem] bg-[linear-gradient(90deg,#f4eadf,#fff7ef,#f4eadf)]"
        />
      ))}
    </div>
  );
}
