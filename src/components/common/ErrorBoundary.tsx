import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last line of defence. A render crash shows a recoverable screen rather than a
 * blank page — the underlying error goes to the console, never to the user.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[rgb(var(--surface-page))] p-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            The page ran into an unexpected problem. Reloading usually fixes it.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Reload BarberFlow
        </Button>
      </div>
    );
  }
}
