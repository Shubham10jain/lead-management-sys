"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, VISA_STATUS_LABELS, type VisaStatus } from "@/lib/api";
import { clearToken } from "@/lib/auth";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
  location: z.string().trim().min(1, "Location is required").max(200),
  visa_status: z.string().min(1, "Visa status is required"),
  interest_note: z.string().max(2000).optional(),
  resume: z
    .instanceof(File, { message: "Resume is required" })
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Only PDF, DOC, or DOCX files are accepted")
    .refine((file) => file.size <= MAX_SIZE_BYTES, "File exceeds 10MB limit"),
});

type FieldErrors = Partial<
  Record<"first_name" | "last_name" | "phone" | "location" | "visa_status" | "interest_note" | "resume", string>
>;

interface CompleteProfileFormProps {
  registeredEmail: string;
}

export function CompleteProfileForm({ registeredEmail }: CompleteProfileFormProps) {
  const router = useRouter();
  const [visaStatus, setVisaStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const resumeEntry = formData.get("resume");
    const resumeFile = resumeEntry instanceof File && resumeEntry.size > 0 ? resumeEntry : undefined;

    const values = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
      visa_status: visaStatus,
      interest_note: (formData.get("interest_note") as string) || undefined,
      resume: resumeFile,
    };

    const result = profileSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FieldErrors] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    formData.set("visa_status", visaStatus);

    try {
      await api.createMyProfile(formData);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.push("/sign-in");
        return;
      }
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Complete Profile</h2>
          <p className="text-sm text-muted-foreground">Fields marked with * are required.</p>
        </div>
        <div className="bg-muted px-4 py-2 rounded-lg border border-border flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Registered Email
          </span>
          <span className="text-sm font-mono text-foreground">{registeredEmail}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input id="first_name" name="first_name" placeholder="Enter first name" disabled={submitting} />
          {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input id="last_name" name="last_name" placeholder="Enter last name" disabled={submitting} />
          {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" disabled={submitting} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location (City, State) *</Label>
          <Input id="location" name="location" placeholder="e.g. San Francisco, CA" disabled={submitting} />
          {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visa_status">Current Visa Status *</Label>
        <Select value={visaStatus} onValueChange={(v) => setVisaStatus(v ?? "")} disabled={submitting}>
          <SelectTrigger id="visa_status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VISA_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value as VisaStatus}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.visa_status && <p className="text-sm text-destructive">{errors.visa_status}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="interest_note">What are you looking for? (optional)</Label>
        <Textarea
          id="interest_note"
          name="interest_note"
          placeholder="Tell us briefly what kind of representation you're looking for..."
          disabled={submitting}
          rows={3}
        />
        {errors.interest_note && <p className="text-sm text-destructive">{errors.interest_note}</p>}
      </div>

      <div className="space-y-2">
        <Label>Resume / CV Upload *</Label>
        <div className="relative border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all">
          <Input
            id="resume"
            name="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={submitting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="size-8 text-primary" />
          <p className="text-sm text-foreground text-center">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX up to 10MB</p>
        </div>
        {errors.resume && <p className="text-sm text-destructive">{errors.resume}</p>}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Finalizing..." : "Finalize Setup"}
        </Button>
      </div>
    </form>
  );
}
