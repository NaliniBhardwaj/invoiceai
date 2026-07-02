"use client";

import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface TopBarProps {
  onMenuClick: () => void;
}

/**
 * The search input here is intentionally inert for now — it's laid out
 * and styled as the eventual command palette trigger (Cmd+K) called for
 * by "Command Palette Ready Architecture" in the brief, wired up for
 * real once there's enough indexed data (invoices, customers) to search
 * across in a later phase.
 */
export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, clearSession } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu />
        </Button>

        <button
          type="button"
          className="hidden w-64 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground sm:flex"
        >
          <Search className="size-4" />
          Search invoices, customers…
          <kbd className="ml-auto rounded border border-border bg-card px-1.5 py-0.5 text-xs">⌘K</kbd>
        </button>

        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search">
          <Search />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user && (
          <button
            onClick={clearSession}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            title="Sign out"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          </button>
        )}
      </div>
    </header>
  );
}
