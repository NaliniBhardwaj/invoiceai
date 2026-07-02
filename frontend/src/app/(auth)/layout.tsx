import Link from "next/link";

/**
 * Shared shell for /login and /register: a quiet split layout, with the
 * brand mark doing the only "branded" work on the page — the forms
 * themselves stay plain and fast to scan, per the "explain failure and
 * emptiness plainly" writing guidance.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-ink p-12 text-paper lg:flex"
        style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <Link href="/" className="text-lg font-semibold tracking-tight">
          InvoiceAI
        </Link>
        <div className="max-w-sm space-y-3">
          <p className="figure-numeric text-sm" style={{ color: "var(--slate-muted)" }}>
            CGST · SGST · IGST — calculated automatically
          </p>
          <p className="text-2xl font-medium leading-snug">
            Invoicing and GST reconciliation for Indian SMEs, with an assistant
            that actually touches your books.
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--slate-muted)" }}>
          AI Powered Financial Operations Platform
        </p>
      </div>
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
