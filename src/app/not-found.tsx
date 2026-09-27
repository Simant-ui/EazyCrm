import Link from "next/link";
import { EazyInvoLogo } from "@/components/common/EazyInvoLogo";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        <div className="flex justify-center">
          <EazyInvoLogo size="lg" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black text-emerald-600 dark:text-emerald-400">404</h1>
          <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-700 transition-colors"
          >
            <Home size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
