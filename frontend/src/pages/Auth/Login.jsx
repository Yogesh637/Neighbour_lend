import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../features/auth/authSchemas';
import { useLoginMutation, useGoogleLoginMutation } from '../../features/auth/hooks/useAuthMutations';

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isGoogleConfigured, setIsGoogleConfigured] = useState(true);

    const loginMutation = useLoginMutation();
    const googleLoginMutation = useGoogleLoginMutation();

    const isLoading = loginMutation.isPending || googleLoginMutation.isPending;

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const handleGoogleCallback = async (response) => {
        setError('');
        googleLoginMutation.mutate(response.credential, {
            onSuccess: () => {
                navigate('/');
            },
            onError: (err) => {
                setError(err.response?.data?.message || err.message || 'Google authentication failed');
            }
        });
    };

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        if (!clientId || clientId.includes('your-google-client-id')) {
            setIsGoogleConfigured(false);
            return;
        }

        const initGoogle = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleCallback
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("googleSignInDiv"),
                    { theme: "outline", size: "large", width: 320 }
                );
                return true;
            }
            return false;
        };

        if (!initGoogle()) {
            const interval = setInterval(() => {
                if (initGoogle()) {
                    clearInterval(interval);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    const onSubmit = (data) => {
        setError('');
        loginMutation.mutate(data, {
            onSuccess: () => {
                navigate('/');
            },
            onError: (err) => {
                const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
                if (errorMessage === 'EMAIL_NOT_VERIFIED') {
                    setError('Email not verified. Redirecting to OTP verification...');
                    setTimeout(() => {
                        navigate('/verify-otp', { state: { email: data.email } });
                    }, 1500);
                } else {
                    setError(errorMessage);
                }
            }
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Welcome Back</h2>
                {error && (
                    <div style={{ 
                        color: '#f87171', 
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Email"
                            style={{ marginBottom: '0.25rem' }}
                            disabled={isLoading}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Password"
                            style={{ marginBottom: '0.25rem' }}
                            disabled={isLoading}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '1rem', opacity: isLoading ? 0.6 : 1 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', opacity: 0.6 }}>
                    <hr style={{ flexGrow: 1, border: 'none', borderTop: '1px solid #ccc' }} />
                    <span style={{ margin: '0 10px', fontSize: '0.85rem' }}>or</span>
                    <hr style={{ flexGrow: 1, border: 'none', borderTop: '1px solid #ccc' }} />
                </div>

                {isGoogleConfigured ? (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div id="googleSignInDiv"></div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        padding: '1.25rem',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '0.75rem',
                        backgroundColor: '#f8fafc',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        textAlign: 'left'
                    }}>
                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                            </svg>
                            Gmail Login Simulator
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
                            Google OAuth is unconfigured. Enter a Gmail address to simulate a Google OAuth sign-in/registration flow.
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="email"
                                placeholder="developer@gmail.com"
                                style={{
                                    flexGrow: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    marginBottom: 0
                                }}
                                id="mockGoogleEmail"
                                defaultValue="developer@gmail.com"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="btn-primary"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap',
                                    marginTop: 0
                                }}
                                disabled={isLoading}
                                onClick={async () => {
                                    const emailInput = document.getElementById("mockGoogleEmail");
                                    const emailVal = emailInput?.value || "developer@gmail.com";
                                    await handleGoogleCallback({ credential: "mock_token_" + emailVal });
                                }}
                            >
                                Simulate
                            </button>
                        </div>
                    </div>
                )}

                <p style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                    Don't have an account? <Link to="/register">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
