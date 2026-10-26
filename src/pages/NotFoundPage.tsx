import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Logo } from '@/components/layout/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[rgb(var(--surface-page))] p-6 text-center">
      <Logo size="lg" />
      <div>
        <p className="font-display text-6xl font-extrabold tracking-tight text-ink-200 dark:text-white/10">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-white">
          This page took the day off
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
          The page you were looking for does not exist, or it may have moved somewhere else.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => window.history.back()} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Go back
        </Button>
        <Link to="/dashboard">
          <Button leftIcon={<Compass className="h-4 w-4" />}>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
