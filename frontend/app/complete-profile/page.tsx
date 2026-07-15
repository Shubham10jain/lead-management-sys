"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CompleteProfileForm } from "@/components/complete-profile-form";
import { api, ApiError } from "@/lib/api";
import { clearToken } from "@/lib/auth";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((me) => {
        if (me.role === "attorney") {
          router.push("/attorney/leads");
          return;
        }
        return api
          .getMyProfile()
          .then(() => router.push("/dashboard"))
          .catch((err) => {
            if (err instanceof ApiError && err.status === 404) {
              setEmail(me.email);
              setLoading(false);
              return;
            }
            throw err;
          });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.push("/sign-in");
          return;
        }
      });
  }, [router]);

  if (loading || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full h-16 flex items-center px-6 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#091426] rounded flex items-center justify-center text-white text-xs font-bold">
              SJ
            </div>
            <span className="font-bold text-foreground tracking-tight">SJ Attorney&apos;s</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Onboarding
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <h1 className="text-2xl font-bold text-foreground mb-3">Final Step</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Complete your professional profile so an attorney can review your case and match you
              with the right representation.
            </p>
          </div>
          <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <CompleteProfileForm registeredEmail={email} />
          </div>
        </div>
      </main>
    </div>
  );
}
