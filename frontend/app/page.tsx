import { AuthShell } from "@/components/auth-shell";
import { LeadSignupForm } from "@/components/lead-signup-form";

export default function Home() {
  return (
    <AuthShell
      headline="Powering Enterprise Growth."
      subtext="Apply once and track your application status any time you sign back in."
    >
      <LeadSignupForm />
    </AuthShell>
  );
}
