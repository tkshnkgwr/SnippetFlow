import React, { StrictMode, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  showErrorOverlay(`Uncaught Error: ${event.message}\nAt: ${event.filename}:${event.lineno}:${event.colno}\n${event.error?.stack || ''}`);
});

window.addEventListener('unhandledrejection', (event) => {
  showErrorOverlay(`Unhandled Promise Rejection: ${event.reason?.message || event.reason}\n${event.reason?.stack || ''}`);
});

function showErrorOverlay(message: string) {
  let overlay = document.getElementById('debug-error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'debug-error-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#7f1d1d';
    overlay.style.color = '#fef2f2';
    overlay.style.padding = '20px';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = 'monospace';
    overlay.style.whiteSpace = 'pre-wrap';
    overlay.style.overflow = 'auto';
    document.body.appendChild(overlay);
  }
  overlay.textContent = message;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// @ts-ignore
class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // @ts-ignore
  props!: ErrorBoundaryProps;
  // @ts-ignore
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#991b1b', color: '#fff', minHeight: '100vh', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2>⚠️ React Error Boundary Caught an Exception:</h2>
          {/* @ts-ignore */}
          <p>{this.state.error?.toString()}</p>
          {/* @ts-ignore */}
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* @ts-ignore */}
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
