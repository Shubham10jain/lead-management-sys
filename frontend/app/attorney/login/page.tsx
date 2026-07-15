import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default function AttorneyLoginPage() {
  return (
    <AuthShell
      headline="Attorney Portal."
      subtext="Securely manage your lead pipeline and outreach with enterprise-grade tools."
    >
      <LoginForm
        title="Attorney Login"
        subtitle="Enter your credentials to access the secure portal."
        crossPortalHref={{
          label: "Are you a prospect?",
          linkLabel: "Log in to your personal dashboard here",
          href: "/sign-in",
        }}
      />
    </AuthShell>
  );
}
