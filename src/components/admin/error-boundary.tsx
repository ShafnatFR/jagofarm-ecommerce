"use client";

import { Component, ErrorInfo, ReactNode } from "react";

/**
 * Error Boundary sisi klien untuk menangkap error render dari komponen admin
 * tanpa menuturkan seluruh halaman. Cocok untuk OdooCategorySelect,
 * MarkdownEditor, dan komponen klien lainnya yang mungkin melempar error.
 */
interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ClientErrorBoundary]", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const error = this.state.error!;
      const reset = this.reset;
      if (fallback) return fallback(error, reset);
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-destructive bg-destructive/10">
          <p className="mb-2 text-sm font-medium text-destructive">
            Kesalahan rendering: {error.message}
          </p>
          <button
            onClick={reset}
            className="mt-2 text-xs underline text-primary hover:text-primary/80"
          >
            Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
