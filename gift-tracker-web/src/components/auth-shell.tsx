"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { fetchCurrentUser, login, signUp, type CurrentUser } from "@/lib/api";

const storageKey = "gift-tracker-auth-token";

type AuthMode = "login" | "signup";

const emptyLoginForm = {
  email: "",
  password: "",
};

const emptySignUpForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
};

export function AuthShell() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [signUpForm, setSignUpForm] = useState(emptySignUpForm);
  const [error, setError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const savedToken = window.localStorage.getItem(storageKey);

    if (!savedToken) {
      setLoadingSession(false);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetchCurrentUser(savedToken);
        setToken(savedToken);
        setCurrentUser(response.user);
      } catch {
        window.localStorage.removeItem(storageKey);
      } finally {
        setLoadingSession(false);
      }
    });
  }, []);

  function persistSession(nextToken: string, user: CurrentUser) {
    window.localStorage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setCurrentUser(user);
    setError(null);
  }

  function handleLogout() {
    window.localStorage.removeItem(storageKey);
    setToken(null);
    setCurrentUser(null);
    setLoginForm(emptyLoginForm);
    setSignUpForm(emptySignUpForm);
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await login(loginForm);
        persistSession(response.token, response.user);
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Unable to log in right now.");
      }
    });
  }

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await signUp(signUpForm);
        persistSession(response.token, response.user);
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Unable to create your account.");
      }
    });
  }

  if (loadingSession) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ee,_#f4ebde_48%,_#e4d4c1)] px-5 py-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,250,242,0.94),rgba(255,242,226,0.88))] p-8 shadow-[0_30px_90px_rgba(83,55,32,0.14)]">
          <p className="text-sm uppercase tracking-[0.25em] text-[#9d4d2e]">Gift Tracker</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#2f241d]">
            Restoring your planning space...
          </h1>
        </div>
      </main>
    );
  }

  if (token && currentUser) {
    return <DashboardShell token={token} currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ee,_#f4ebde_48%,_#e4d4c1)] px-5 py-10 text-[#2f241d] sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,250,242,0.94),rgba(255,242,226,0.88))] p-8 shadow-[0_30px_90px_rgba(83,55,32,0.14)]">
          <span className="inline-flex rounded-full bg-[#f2d7c2] px-4 py-1 text-sm font-medium text-[#9d4d2e]">
            Personal gifting hub
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight">
            Plan gifts with your own private reminder workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#6e5a49]">
            Save people, track important dates, and turn reminder emails into a routine you can trust.
          </p>
        </section>

        <section className="rounded-[2rem] bg-[#2f241d] p-8 text-[#f8ede0] shadow-[0_24px_70px_rgba(47,36,29,0.24)]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === "login" ? "bg-[#f8ede0] text-[#2f241d]" : "border border-white/20 text-[#f8ede0] hover:bg-white/10"}`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === "signup" ? "bg-[#f8ede0] text-[#2f241d]" : "border border-white/20 text-[#f8ede0] hover:bg-white/10"}`}
            >
              Create account
            </button>
          </div>

          {mode === "login" ? (
            <form className="mt-8 grid gap-4" onSubmit={handleLogin}>
              <AuthField
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(value) => setLoginForm((current) => ({ ...current, email: value }))}
                placeholder="you@example.com"
              />
              <AuthField
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                placeholder="password123"
              />
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-full bg-[#f8ede0] px-5 py-3 text-sm font-medium text-[#2f241d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Logging in..." : "Log in"}
              </button>
            </form>
          ) : (
            <form className="mt-8 grid gap-4" onSubmit={handleSignup}>
              <AuthField
                label="Name"
                value={signUpForm.name}
                onChange={(value) => setSignUpForm((current) => ({ ...current, name: value }))}
                placeholder="Bandana Pandey"
              />
              <AuthField
                label="Email"
                type="email"
                value={signUpForm.email}
                onChange={(value) => setSignUpForm((current) => ({ ...current, email: value }))}
                placeholder="you@example.com"
              />
              <AuthField
                label="Password"
                type="password"
                value={signUpForm.password}
                onChange={(value) => setSignUpForm((current) => ({ ...current, password: value }))}
                placeholder="At least 8 characters"
              />
              <AuthField
                label="Confirm password"
                type="password"
                value={signUpForm.password_confirmation}
                onChange={(value) =>
                  setSignUpForm((current) => ({ ...current, password_confirmation: value }))
                }
                placeholder="Repeat your password"
              />
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-full bg-[#f8ede0] px-5 py-3 text-sm font-medium text-[#2f241d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          {error ? <p className="mt-4 text-sm text-[#f4b9a2]">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}

function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password";
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-[#e8d8ca]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[1.2rem] border border-white/15 bg-white/8 px-4 py-3 text-sm text-[#fff7ef] outline-none transition placeholder:text-[#bfae9d] focus:border-[#f2d7c2] focus:bg-white/12"
        required
      />
    </label>
  );
}
