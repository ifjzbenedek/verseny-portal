import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="m-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Hiba történt.</p>
          <p className="mt-1 text-muted-foreground">{this.state.error.message}</p>
          <button
            onClick={this.reset}
            className="mt-3 rounded-md bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
          >
            Újra
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
