"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { authApi } from "@/lib/api-client";

function GitHubLoginButton() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/workspace";

  function handleGitHubLogin() {
    const url = new URL("/api/auth/login", window.location.origin);
    if (redirect) {
      url.searchParams.set("next", redirect);
    }
    window.location.href = url.toString();
  }

  return (
    <Button
      onClick={handleGitHubLogin}
      variant="outline"
      size="lg"
      aria-label="Sign in with GitHub"
      className="w-full border-border hover:bg-accent hover:text-accent-foreground"
    >
      Sign in with GitHub
    </Button>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/workspace";

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;

    setError(null);
    startTransition(async () => {
      try {
        await authApi.demoLogin({ username, password });
        router.push(redirect);
      } catch {
        setError("Invalid credentials.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" aria-live="polite" aria-atomic="false">
      {error && (
        <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-foreground">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          placeholder="demo"
          className="rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="demo"
          className="rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="default" size="lg" disabled={isPending} className="mt-2">
        {isPending ? "Signing in…" : "Sign in with Demo Account"}
      </Button>
    </form>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");

  return (
    <>
      {authStatus === "error" && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Authentication failed. Please try again.
        </div>
      )}

      {authStatus === "denied" && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Access denied. Please contact support.
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <GitHubLoginButton />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with demo
            </span>
          </div>
        </div>

        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav variant="light" />
      <div className="mx-auto flex w-full max-w-sm flex-col px-5 pt-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Sign in to SpecForge</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI-powered specification workspace
          </p>
        </div>

        <Suspense fallback={<div className="mt-8 text-center text-sm text-muted-foreground">Loading...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
