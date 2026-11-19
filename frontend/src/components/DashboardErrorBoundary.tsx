import React from 'react';

interface State { hasError: boolean; }

export class DashboardErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Dashboard rendering failed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <section role="alert" className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-slate-800">
        <h2 className="text-lg font-semibold">Dashboard display error</h2>
        <p className="mt-2 text-sm text-slate-600">The dashboard visualization could not be displayed. Reload the page to try again.</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Reload dashboard</button>
      </section>;
    }
    return this.props.children;
  }
}
