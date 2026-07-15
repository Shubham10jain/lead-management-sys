import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default function LeadSignInPage() {
  return (
    <AuthShell
      headline="Welcome back."
      subtext="Sign in to check your application status or pick up where you left off."
    >
      <LoginForm
        title="Sign in"
        subtitle="Enter your credentials to access your dashboard."
        signupHref={{ label: "Create one", href: "/" }}
        crossPortalHref={{ label: "Are you an attorney?", linkLabel: "Sign in here", href: "/attorney/login" }}
      />
    </AuthShell>
  );
}
