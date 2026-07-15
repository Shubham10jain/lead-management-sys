"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  ApiError,
  STATUS_LABELS,
  VISA_STATUS_LABELS,
  type Lead,
  type LeadStatus,
  type VisaStatus,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useInactivityLogout } from "@/lib/use-inactivity-logout";

const STAGES: { status: LeadStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Yet to be reviewed", color: "bg-red-100 text-red-800" },
  { status: "IN_PROGRESS", label: "In Process", color: "bg-amber-100 text-amber-800" },
  { status: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
];

export default function LeadDashboardPage() {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [visaStatus, setVisaStatus] = useState<string>("");

  const handleLogout = useCallback(() => {
    clearToken();
    router.push("/sign-in");
  }, [router]);

  useInactivityLogout(handleLogout);

  useEffect(() => {
    Promise.all([api.me(), api.getMyProfile()])
      .then(([me, myLead]) => {
        setFullName(me.full_name);
        setLead(myLead);
        setFirstName(myLead.first_name);
        setLastName(myLead.last_name);
        setLocation(myLead.location);
        setVisaStatus(myLead.visa_status);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.push("/sign-in");
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          router.push("/complete-profile");
          return;
        }
        setError("Failed to load your profile.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateMyProfile({
        first_name: firstName,
        last_name: lastName,
        location,
        visa_status: visaStatus as VisaStatus,
      });
      setLead(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-destructive">{error ?? "Something went wrong."}</p>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.status === lead.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full h-16 flex items-center justify-between px-6 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#091426] rounded flex items-center justify-center text-white text-xs font-bold">
            SJ
          </div>
          <span className="font-bold text-foreground tracking-tight">SJ Attorney&apos;s</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">{fullName}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-1">Candidate Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Manage your profile and track your application progress in real-time.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-6 py-5 border-b border-border">
              <h2 className="font-semibold text-foreground">My Profile</h2>
              <p className="text-sm text-muted-foreground">Update your personal information.</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={lead.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="visa_status">Visa status</Label>
                  <Select value={visaStatus} onValueChange={(v) => setVisaStatus(v ?? "")} disabled={saving}>
                    <SelectTrigger id="visa_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VISA_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Resume</Label>
                  <div className="h-8 flex items-center px-3 rounded-lg border border-border bg-muted text-sm text-foreground truncate">
                    {lead.resume_filename}
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Application Status</h2>
            <div className="space-y-3 mb-6">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Current Stage
              </span>
              <div
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${STAGES[currentStageIndex]?.color}`}
              >
                {STATUS_LABELS[lead.status]}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Status Legend
              </span>
              {STAGES.map((stage) => (
                <div key={stage.status} className="flex items-center justify-between py-1">
                  <span
                    className={`text-sm ${stage.status === lead.status ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {stage.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${stage.color}`}>
                    {stage.status === "PENDING"
                      ? "RED"
                      : stage.status === "IN_PROGRESS"
                        ? "YELLOW"
                        : "GREEN"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
