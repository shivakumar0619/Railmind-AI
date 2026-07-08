import { useNavigate } from "react-router";
import { ArrowLeft, MapPin } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 rounded-2xl bg-status-warning-muted p-6">
        <MapPin className="h-12 w-12 text-status-warning" strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="mt-2 text-lg text-text-secondary">Page not found</p>
      <p className="mt-1 max-w-md text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          Dashboard
        </button>
      </div>
    </div>
  );
}
