import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthScreen.css';

export default function AuthScreen() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      await signInWithMagicLink(email);
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-icon">✉️</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="auth-hint">Click the link in the email to sign in</p>
          <button
            className="auth-link-btn"
            onClick={() => setStatus('idle')}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-content">
        <h1 className="auth-title">Snap</h1>
        <p className="auth-subtitle">Baby nap scheduler</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={status === 'loading' || !email}
          >
            {status === 'loading' ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        <p className="auth-footer">
          No password needed. We'll email you a link to sign in.
        </p>
      </div>
    </div>
  );
}
