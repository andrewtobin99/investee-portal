"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Class-based error boundary for catching render-time errors in client
 * component subtrees (e.g. the document manager / comment thread). Route-level
 * errors are handled by Next's error.tsx convention instead.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: pipe to an error reporter (Sentry/LogRocket) instead of console.
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">
            Something went wrong displaying this section.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset}>
          Try again
        </Button>
      </div>
    );
  }
}
