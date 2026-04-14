import { useState } from 'react';

export function SetupScreen({ onSubmit, error, isSubmitting, minimumLength = 12 }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < minimumLength) {
      setClientError(`Password must be at least ${minimumLength} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setClientError('Password confirmation does not match.');
      return;
    }

    setClientError('');
    await onSubmit(password, confirmPassword);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-card-wide">
        <p className="eyebrow">First-run setup</p>
        <h1>Protect the Codex dashboard before it starts streaming data.</h1>
        <p className="auth-copy">
          Create one local password for this machine. The first pass is read-only, but approvals, policy findings, and usage data still stay behind an auth gate.
        </p>
        <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create password"
              autoFocus
              required
            />
          </label>
          <label>
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              required
            />
          </label>
          <div className="auth-hints">
            <div>
              <strong>Stored locally.</strong>
              <span>Scrypt hash with file permissions locked to this user.</span>
            </div>
            <div>
              <strong>Session model.</strong>
              <span>Short-lived bearer session for the current browser tab.</span>
            </div>
          </div>
          {clientError || error ? <p className="form-error">{clientError || error}</p> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Securing dashboard…' : 'Create password and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
