import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20 mb-6">
            <AlertTriangle size={28} className="text-danger" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-text-secondary max-w-md mx-auto mb-8 leading-relaxed">
            A critical error occurred in the ORNAS interface. Your data is safe. You can try refreshing the application.
          </p>
          
          <div className="bg-surface border border-border rounded-lg p-4 max-w-md w-full text-left overflow-auto max-h-48 mb-8 text-xs font-mono text-text-tertiary">
            {this.state.error?.message || 'Unknown Error'}
          </div>

          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw size={16} /> Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
