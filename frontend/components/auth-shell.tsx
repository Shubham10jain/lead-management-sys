interface AuthShellProps {
  headline: string;
  subtext: string;
  children: React.ReactNode;
}

export function AuthShell({ headline, subtext, children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <main className="w-full max-w-[1100px] flex flex-col md:flex-row bg-card rounded-xl overflow-hidden border border-border shadow-lg">
        <section className="hidden md:flex flex-1 flex-col justify-between p-12 bg-[#091426] text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-[#0058be] rounded-lg flex items-center justify-center font-bold text-lg">
                SJ
              </div>
              <span className="text-xl font-bold tracking-tight">SJ Attorney&apos;s</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight">{headline}</h1>
              <p className="text-lg text-white/70 max-w-md">{subtext}</p>
            </div>
          </div>
          <p className="relative z-10 text-xs text-white/50">
            &copy; {new Date().getFullYear()} SJ Attorney&apos;s. All rights reserved.
          </p>
        </section>

        <section className="flex-1 flex flex-col justify-center p-8 md:p-12 bg-card">
          {children}
        </section>
      </main>
    </div>
  );
}
