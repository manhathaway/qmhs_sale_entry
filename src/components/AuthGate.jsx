import { useEffect, useState } from 'react';
import styles from './AuthGate.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const parseApiResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    const rawBody = await response.text();
    return {
        error: 'Non-JSON response received',
        rawBody,
    };
};

const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export default function AuthGate({ children }) {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const checkAuth = async () => {
        try {
            const response = await fetch(buildApiUrl('/api/auth/me'), {
                credentials: 'include',
            });

            const data = await parseApiResponse(response);

            if (!response.ok || data.error === 'Non-JSON response received') {
                throw new Error('Auth API unavailable. Make sure backend server is running and API base URL is correct.');
            }

            setAuthenticated(!!data.authenticated);
        } catch (err) {
            console.error(err);
            setAuthenticated(false);
        } finally {
            setCheckingAuth(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(buildApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await parseApiResponse(response);

            if (data.error === 'Non-JSON response received') {
                throw new Error('Auth API returned HTML instead of JSON. Check backend startup and VITE_API_BASE_URL.');
            }

            if (!response.ok || !data.authenticated) {
                throw new Error(data.error || 'Invalid credentials');
            }

            setAuthenticated(true);
            setPassword('');
        } catch (err) {
            setError(err.message || 'Unable to sign in');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(buildApiUrl('/api/auth/logout'), {
                method: 'POST',
                credentials: 'include',
            });
        } finally {
            setAuthenticated(false);
            setUsername('');
            setPassword('');
        }
    };

    if (checkingAuth) {
        return <div className={styles.centered}>Checking session...</div>;
    }

    if (!authenticated) {
        return (
            <div className={styles.loginPage}>
                <form className={styles.loginCard} onSubmit={handleSubmit}>
                    <h1 className={styles.title}>Secure Access</h1>
                    <p className={styles.subtitle}>Sign in to access QMHS tools.</p>

                    <label className={styles.label}>Username</label>
                    <input
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />

                    <label className={styles.label}>Password</label>
                    <input
                        className={styles.input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && <div className={styles.error}>{error}</div>}

                    <button className={styles.button} type="submit" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.sessionBar}>
                <button className={styles.logoutButton} type="button" onClick={handleLogout}>
                    Log Out
                </button>
            </div>
            {children}
        </div>
    );
}
