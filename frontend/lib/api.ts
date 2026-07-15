import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type VisaStatus = "citizen" | "permanent_resident" | "h1b" | "f1" | "other";
export type LeadStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  citizen: "U.S. Citizen",
  permanent_resident: "Permanent Resident (Green Card)",
  h1b: "H1-B Visa",
  f1: "F-1 (OPT/CPT)",
  other: "Other / Requires Sponsorship",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  PENDING: "Yet to be reviewed",
  IN_PROGRESS: "In Process",
  COMPLETED: "Completed",
};

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: "attorney" | "lead";
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  visa_status: VisaStatus;
  source: string;
  interest_note: string | null;
  status: LeadStatus;
  resume_filename: string;
  resume_mime_type: string | null;
  resume_size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeadHistoryEntry {
  event: string;
  description: string;
  created_at: string;
}

export interface LeadDetail extends Lead {
  history: LeadHistoryEntry[];
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadStats {
  total_leads: number;
  pending: number;
  conversion_rate: number;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
      false
    ),

  signup: (full_name: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string }>(
      "/api/v1/auth/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email, password }),
      },
      false
    ),

  forgotPassword: (email: string) =>
    request<void>(
      "/api/v1/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
      false
    ),

  resetPassword: (token: string, new_password: string) =>
    request<void>(
      "/api/v1/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password }),
      },
      false
    ),

  me: () => request<CurrentUser>("/api/v1/auth/me"),

  createMyProfile: (formData: FormData) =>
    request<Lead>("/api/v1/leads/me/profile", { method: "POST", body: formData }),

  getMyProfile: () => request<Lead>("/api/v1/leads/me"),

  updateMyProfile: (updates: Partial<Pick<Lead, "first_name" | "last_name" | "phone" | "location" | "visa_status">>) =>
    request<Lead>("/api/v1/leads/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),

  listLeads: (page = 1, limit = 20, search = "") =>
    request<LeadListResponse>(
      `/api/v1/leads?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),

  getStats: () => request<LeadStats>("/api/v1/leads/stats"),

  getLead: (id: string) => request<LeadDetail>(`/api/v1/leads/${id}`),

  updateLeadStatus: (id: string, status: LeadStatus) =>
    request<Lead>(`/api/v1/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),

  downloadResume: async (id: string, filename: string): Promise<void> => {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/v1/leads/${id}/resume`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};
