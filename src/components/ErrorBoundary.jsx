import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Dashboard render error', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="fatal-screen">
        <div className="fatal-card">
          <p className="eyebrow">Render fault</p>
          <h1>The dashboard hit an unexpected client error.</h1>
          <p>{this.state.error?.message || 'Unknown render failure.'}</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }
}
