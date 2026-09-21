import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../../config/supabaseClient';
import './newUser.css';
import { useEffect } from 'react';

export default function NewUser({ onRegisterSuccess }) {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState('');
    const [shakeError, setShakeError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
      document.title = "Create New Account | E-Tracker";
    }, []);

    const triggerBuzz = (msg) => {
        setError(msg);
        setShakeError(true);
        setTimeout(() => setShakeError(false), 450);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            triggerBuzz('Passwords do not match');
            return;
        }

        const cleanedUsername = username.trim().toLowerCase();
        if (cleanedUsername.length < 3) {
            triggerBuzz('Username must be at least 3 characters long');
            return;
        }

        setLoading(true);

        try {
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .ilike('username', cleanedUsername)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingUser) {
                triggerBuzz('Username is already taken. Please choose another.');
                setLoading(false);
                return;
            }

            const { data, error: supabaseError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        username: cleanedUsername,
                    },
                },
            });

            if (supabaseError) throw supabaseError;

            // Depending on your Supabase settings (if email confirmations are disabled), 
            // signUp automatically logs the user in. You may need to sign them out 
            // immediately here if you strictly want them to type credentials on the next page.
            await supabase.auth.signOut(); 

            if (onRegisterSuccess) {
                onRegisterSuccess(data.user);
            }

            setIsSuccess(true);
            setLoading(false);

            setTimeout(() => {
                navigate('/login'); // Changed from '/dashboard'
            }, 1800);

        } catch (err) {
            triggerBuzz(err.message || 'An error occurred during registration.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className={`login-card ${isSuccess ? 'card-success' : ''}`}>
                <div className="login-header">
                    <h2 className="login-title">CREATE ACCOUNT</h2>
                    <p className="login-subtitle">
                        Sign up today to start managing your expenses
                    </p>
                </div>

                {error && !isSuccess && (
                    <div className={`error-banner ${shakeError ? 'buzz-vibrate' : ''}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Full Name</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="fullName"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="form-input"
                                disabled={isSuccess}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Username</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="john_doe99"
                                className="form-input"
                                disabled={isSuccess}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-email">Email Address</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="register-email"
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

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-password">Password</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="register-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`form-input ${
                                    shakeError && error.includes('match') ? 'buzz-vibrate input-error-style' : ''
                                }`}
                                disabled={isSuccess}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                disabled={isSuccess}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="20" height="20">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="20" height="20">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                        <div className="input-icon-wrapper">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`form-input ${
                                    shakeError && error.includes('match') ? 'buzz-vibrate input-error-style' : ''
                                }`}
                                disabled={isSuccess}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                disabled={isSuccess}
                            >
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="20" height="20">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="20" height="20">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="checkbox-wrapper">
                        <input
                            id="agree-terms"
                            type="checkbox"
                            required
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="checkbox-input"
                            disabled={isSuccess}
                        />
                        <label htmlFor="agree-terms" className="checkbox-label">
                            I agree to the Terms of Service & Privacy Policy
                        </label>
                    </div>

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
                                Account Created!
                            </>
                        ) : loading ? (
                            'Creating Account...'
                        ) : (
                            'Create Free Account'
                        )}
                    </button>
                </form>

                <div className="divider-line-container">
                    <div className="divider-line"></div>
                    <span className="divider-text">Or register with</span>
                    <div className="divider-line"></div>
                </div>

                <p className="login-footer">
                    Already have an account?{' '}
                    <Link to="/login" className="signup-redirect-link" style={isSuccess ? { pointerEvents: 'none', opacity: 0.5 } : {}}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}