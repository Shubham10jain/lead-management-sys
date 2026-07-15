"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  api,
  ApiError,
  STATUS_LABELS,
  VISA_STATUS_LABELS,
  type LeadDetail,
  type LeadStatus,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";

const NEXT_STATUS: Partial<Record<LeadStatus, { target: LeadStatus; label: string }>> = {
  PENDING: { target: "IN_PROGRESS", label: "Mark In Process" },
  IN_PROGRESS: { target: "COMPLETED", label: "Mark Completed" },
};

const BADGE_VARIANT: Record<LeadStatus, "secondary" | "default" | "outline"> = {
  PENDING: "secondary",
  IN_PROGRESS: "outline",
  COMPLETED: "default",
};

export default function AttorneyLeadDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearToken();
        router.push("/attorney/login");
        return true;
      }
      return false;
    },
    [router]
  );

  useEffect(() => {
    api
      .getLead(params.id)
      .then(setLead)
      .catch((err) => {
        if (handleAuthError(err)) return;
        setError(err instanceof ApiError ? err.message : "Failed to load lead.");
      })
      .finally(() => setLoading(false));
  }, [params.id, handleAuthError]);

  async function handleAdvanceStatus() {
    if (!lead) return;
    const next = NEXT_STATUS[lead.status];
    if (!next) return;
    setUpdating(true);
    try {
      const updated = await api.updateLeadStatus(lead.id, next.target);
      const history = await api.getLead(lead.id);
      setLead({ ...updated, history: history.history });
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(err instanceof ApiError ? err.message : "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDownload() {
    if (!lead) return;
    setDownloading(true);
    try {
      await api.downloadResume(lead.id, lead.resume_filename);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(err instanceof ApiError ? err.message : "Failed to download resume.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-10 text-sm text-destructive">{error}</p>;
  if (!lead) return null;

  const next = NEXT_STATUS[lead.status];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground border">
            {lead.first_name[0]}
            {lead.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                {lead.first_name} {lead.last_name}
              </h1>
              <Badge variant={BADGE_VARIANT[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{lead.email}</span>
              <span>{lead.location}</span>
            </div>
          </div>
        </div>
        {next && (
          <Button onClick={handleAdvanceStatus} disabled={updating} size="lg">
            {updating ? "Updating..." : next.label}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Prospect Submission</h2>
            <span className="text-xs text-muted-foreground uppercase">
              Submitted: {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Full Name</p>
              <p className="font-semibold text-foreground">
                {lead.first_name} {lead.last_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Work Email</p>
              <p className="font-semibold text-primary">{lead.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Phone Number</p>
              <p className="font-semibold text-foreground">{lead.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Visa Status</p>
              <p className="font-semibold text-foreground">
                {VISA_STATUS_LABELS[lead.visa_status]}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Source</p>
              <p className="font-semibold text-foreground">{lead.source}</p>
            </div>
          </div>
          {lead.interest_note && (
            <div className="border-t border-border pt-6">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                Prospect Interest Note
              </p>
              <blockquote className="italic text-sm text-muted-foreground border-l-4 border-primary/30 pl-4 py-2 bg-muted rounded-r-lg">
                &ldquo;{lead.interest_note}&rdquo;
              </blockquote>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Resume / CV</h3>
            <div className="bg-muted rounded-lg aspect-[3/4] flex items-center justify-center border border-border mb-4 text-sm text-muted-foreground text-center px-4">
              {lead.resume_filename}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? "Downloading..." : `Download (${lead.resume_mime_type ?? "file"})`}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-12 bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="font-semibold text-foreground mb-6">Internal Lead History</h3>
          <div className="space-y-6">
            {lead.history.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {i < lead.history.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-semibold text-sm text-foreground">
                    {entry.event.replaceAll("_", " ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.description} • {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
