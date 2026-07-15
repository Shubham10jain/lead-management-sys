"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError, STATUS_LABELS, type Lead, type LeadStats, type LeadStatus } from "@/lib/api";
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

const LIMIT = 20;

export default function AttorneyLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.listLeads(page, LIMIT, search), api.getStats()])
      .then(([leadsRes, statsRes]) => {
        setLeads(leadsRes.items);
        setTotal(leadsRes.total);
        setStats(statsRes);
      })
      .catch((err) => {
        if (handleAuthError(err)) return;
        setError(err instanceof ApiError ? err.message : "Failed to load leads.");
      })
      .finally(() => setLoading(false));
  }, [page, search, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdvanceStatus(lead: Lead) {
    const next = NEXT_STATUS[lead.status];
    if (!next) return;
    setUpdatingId(lead.id);
    try {
      await api.updateLeadStatus(lead.id, next.target);
      load();
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(err instanceof ApiError ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <nav className="text-xs text-muted-foreground mb-1">
            Home / <span className="text-primary font-semibold">Lead Management</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground">Active Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Manage and respond to inbound inquiries in real-time.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-card border border-border rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Total Leads
            </span>
            <span className="text-xl font-bold text-foreground">{stats?.total_leads ?? "—"}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 flex flex-col border-l-4 border-l-primary">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending</span>
            <span className="text-xl font-bold text-foreground">{stats?.pending ?? "—"}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Conv. Rate
            </span>
            <span className="text-xl font-bold text-primary">
              {stats ? `${stats.conversion_rate}%` : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {total} result{total === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading leads...</p>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No leads found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const next = NEXT_STATUS[lead.status];
                return (
                  <TableRow key={lead.id} className="cursor-pointer">
                    <TableCell onClick={() => router.push(`/attorney/leads/${lead.id}`)}>
                      <Link href={`/attorney/leads/${lead.id}`} className="font-semibold hover:underline">
                        {lead.first_name} {lead.last_name}
                      </Link>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/attorney/leads/${lead.id}`)}>
                      {lead.email}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/attorney/leads/${lead.id}`)}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/attorney/leads/${lead.id}`)}>
                      <Badge variant={BADGE_VARIANT[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === lead.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvanceStatus(lead);
                          }}
                        >
                          {updatingId === lead.id ? "Updating..." : next.label}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
