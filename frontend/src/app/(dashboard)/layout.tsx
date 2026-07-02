"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { TopBar } from "@/components/shared/top-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Closes the drawer when the route changes (covers link taps, back/
  // forward nav). Adjusted during render rather than in an effect, per
  // React's guidance for resetting state in response to a prop change —
  // avoids an extra commit-then-effect render pass for something this cheap.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-60 shrink-0 border-r border-border md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold tracking-tight">InvoiceAI</span>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-border p-3">
          <p className="truncate px-3 text-xs text-muted-foreground">{user.organizationName}</p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            style={{ background: "color-mix(in srgb, var(--ink) 40%, transparent)" }}
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-lg">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold tracking-tight">InvoiceAI</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            <div className="mt-auto border-t border-border p-3">
              <p className="truncate px-3 text-xs text-muted-foreground">{user.organizationName}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
