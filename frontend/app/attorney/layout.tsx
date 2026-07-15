"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";
import { useInactivityLogout } from "@/lib/use-inactivity-logout";

export default function AttorneyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    clearToken();
    router.push("/attorney/login");
  }, [router]);

  useInactivityLogout(handleLogout);

  if (pathname === "/attorney/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-muted/40 border-r border-border p-4 gap-2">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-9 h-9 bg-[#091426] rounded-lg flex items-center justify-center text-white text-xs font-bold">
            SJ
          </div>
          <div>
            <h2 className="font-bold text-foreground leading-tight">SJ Attorney&apos;s</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Attorney Portal
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/attorney/leads"
            className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary font-medium text-sm"
          >
            Leads
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
