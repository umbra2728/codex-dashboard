import { useState } from 'react';

export function LoginScreen({ onSubmit, error, isSubmitting }) {
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(password);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="eyebrow">Local access gate</p>
        <h1>Enter the dashboard password.</h1>
        <p className="auth-copy">
          This dashboard stays localhost-only. Use the shared password to unlock live runs, approvals, and usage telemetry.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter dashboard password"
              autoFocus
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Unlocking…' : 'Unlock dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
