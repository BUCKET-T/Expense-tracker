import React, { useState, useEffect } from 'react';
import './login.css'; 
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../../config/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();

  

  useEffect(() => {
    document.title = "Log In | E-Tracker";
  }, []);

  const triggerBuzz = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 450);
  };

  // Handle Password Reset Email Trigger
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetSent(false);

    if (!email) {
      triggerBuzz('Please enter your email address first.');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setResetSent(true);
    } catch (err) {
      triggerBuzz(err.message || 'Unable to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle standard Email + Password submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);

    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        throw supabaseError;
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      setIsSuccess(true);
      setLoading(false);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);

    } catch (err) {
      triggerBuzz(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  // Handle OAuth provider sign-ins (Google / GitHub)
  const handleOAuthLogin = async (provider) => {
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      triggerBuzz(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card ${isSuccess ? 'card-success' : ''}`}>
        
        {/* Top Header & Logo */}
        <div className="login-header">
          <div className="login-logo-box">E</div>
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">
            Enter your credentials to access 
          </p>
        </div>

        {/* Error Alert Box */}
        {error && !isSuccess && (
          <div className={`error-banner ${shakeError ? 'buzz-vibrate' : ''}`}>
            {error}
          </div>
        )}

        {/* Password Reset Confirmation Banner */}
        {resetSent && !error && (
          <div className="error-banner" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', color: '#86efac' }}>
            Password reset link sent! Check your inbox.
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="login-form">
          
          {/* Email Input Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-icon-wrapper">
              <span className="input-field-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="form-input"
                disabled={isSuccess}
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div className="form-group">
            <div className="label-row">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              
              {/* Trigger Password Reset Mail */}
              <button
                type="button"
                onClick={handleForgotPassword}
                className="forgot-password-link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '16px' }}
                disabled={loading || isSuccess}
              >
                Forgot password?
              </button>
            </div>
            
            <div className="input-icon-wrapper">
              <span className="input-field-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
              </span>
              
              <input
                id="password"
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`form-input password-field ${shakeError ? 'buzz-vibrate input-error-style' : ''}`} 
                disabled={isSuccess}
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSuccess}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="checkbox-wrapper">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="checkbox-input"
              disabled={isSuccess}
            />
            <label htmlFor="remember-me" className="checkbox-label">
              Keep me logged in for 30 days
            </label>
          </div>

          {/* Core CTA Sign In Button */}
          <button 
            type="submit" 
            className={`btn-submit ${isSuccess ? 'btn-success' : ''}`} 
            disabled={loading || isSuccess}
          >
            {isSuccess ? (
              <>
                <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Success!
              </>
            ) : loading ? (
              'Processing...'
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Separator Line Grid */}
        <div className="divider-line-container">
          <div className="divider-line"></div>
          <span className="divider-text">Or continue with</span>
          <div className="divider-line"></div>
        </div>

        {/* Social Authentication Actions Row */}
        <div className="oauth-grid">
          <button 
            type="button" 
            className="btn-oauth"
            onClick={() => handleOAuthLogin('google')}
            disabled={isSuccess || loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.423 1.945 15.6 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.886H12.24Z"/></svg>
            Google
          </button>
          
          <button 
            type="button" 
            className="btn-oauth"
            onClick={() => handleOAuthLogin('github')}
            disabled={isSuccess || loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.024A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.293 2.747-1.024 2.747-1.024.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12c0-5.523-4.477-10-10-10Z"/></svg>
            GitHub
          </button>
        </div>

        {/* Dynamic Context Footer */}
        <p className="login-footer">
          Don't have an account?{' '}
          <Link to="/register" className="signup-redirect-link" style={isSuccess ? { pointerEvents: 'none', opacity: 0.5 } : {}}>
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}