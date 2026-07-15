"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";

interface LoginFormProps {
  title: string;
  subtitle: string;
  signupHref?: { label: string; href: string };
  crossPortalHref?: { label: string; linkLabel: string; href: string };
}

export function LoginForm({ title, subtitle, signupHref, crossPortalHref }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { access_token } = await api.login(email, password);
      setToken(access_token);

      const me = await api.me();
      if (me.role === "attorney") {
        router.push("/attorney/leads");
        return;
      }

      try {
        await api.getMyProfile();
        router.push("/dashboard");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          router.push("/complete-profile");
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <h1 className="text-2xl font-semibold text-foreground mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {signupHref && (
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href={signupHref.href} className="text-primary font-semibold hover:underline">
              {signupHref.label}
            </Link>
          </p>
        </div>
      )}

      {crossPortalHref && (
        <div className={signupHref ? "mt-4 text-center" : "mt-8 pt-6 border-t border-border text-center"}>
          <p className="text-sm text-muted-foreground">
            {crossPortalHref.label}{" "}
            <Link href={crossPortalHref.href} className="text-primary font-semibold hover:underline">
              {crossPortalHref.linkLabel}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
