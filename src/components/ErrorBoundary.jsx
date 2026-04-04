import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Silently log — no console.error spam in production
    if (import.meta.env.DEV) {
      console.warn('[ErrorBoundary] Caught:', error.message, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg z-50 gap-4">
          <div className="font-mono text-[11px] text-muted tracking-[0.2em]">
            [ something went wrong ]
          </div>
          <button
            className="font-mono text-[11px] text-green border border-[rgba(57,255,20,0.3)] px-6 py-2 hover:bg-[rgba(57,255,20,0.08)] transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
