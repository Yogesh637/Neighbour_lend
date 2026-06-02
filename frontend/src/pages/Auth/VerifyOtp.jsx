import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyOtpSchema } from '../../features/auth/authSchemas';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../features/auth/hooks/useAuthMutations';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const verifyOtpMutation = useVerifyOtpMutation();
    const resendOtpMutation = useResendOtpMutation();

    const isLoading = verifyOtpMutation.isPending || resendOtpMutation.isPending;

    const email = location.state?.email || '';

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(verifyOtpSchema),
        defaultValues: {
            otp: '',
        }
    });

    useEffect(() => {
        if (!email) {
            setError('No email found. Redirecting to login...');
            const timer = setTimeout(() => {
                navigate('/login');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [email, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const onSubmit = (data) => {
        setError('');
        setMessage('');
        verifyOtpMutation.mutate({ email, otp: data.otp }, {
            onSuccess: () => {
                setMessage('Email verified successfully! Logging you in...');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            },
            onError: (err) => {
                setError(err.response?.data?.message || err.message || 'Verification failed. Please check the code.');
            }
        });
    };

    const handleResend = () => {
        if (!canResend) return;
        setError('');
        setMessage('');
        resendOtpMutation.mutate(email, {
            onSuccess: () => {
                setMessage('A new OTP has been sent to your email.');
                setCountdown(30);
                setCanResend(false);
            },
            onError: (err) => {
                setError(err.response?.data?.message || err.message || 'Failed to resend OTP.');
            }
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Verify Email</h2>
                
                <p style={{ marginBottom: '1.5rem', opacity: 0.8, fontSize: '0.95rem', lineHeight: '1.4' }}>
                    We've sent a 6-digit verification code to <br />
                    <strong style={{ color: '#6366f1' }}>{email || 'your email'}</strong>.
                </p>

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

                {message && (
                    <div style={{ 
                        color: '#10b981', 
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                    }}>
                        {message}
                    </div>
                )}

                {email && (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="Enter 6-Digit OTP"
                                className="input-field"
                                disabled={isLoading}
                                style={{ 
                                    letterSpacing: '8px', 
                                    textAlign: 'center', 
                                    fontSize: '1.25rem', 
                                    fontWeight: 'bold',
                                    marginBottom: '0.25rem'
                                }}
                                {...register('otp', {
                                    onChange: (e) => {
                                        // Keep only digits
                                        e.target.value = e.target.value.replace(/\D/g, '');
                                    }
                                })}
                            />
                            {errors.otp && (
                                <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'center', margin: '4px 0 0 0' }}>
                                    {errors.otp.message}
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '1rem', opacity: isLoading ? 0.6 : 1 }}
                            disabled={isLoading}
                        >
                            {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    <span style={{ opacity: 0.8 }}>Didn't receive the code? </span>
                    {canResend ? (
                        <button 
                            onClick={handleResend}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#6366f1', 
                                textDecoration: 'underline', 
                                cursor: 'pointer',
                                padding: 0,
                                fontWeight: 'bold'
                            }}
                            disabled={isLoading}
                        >
                            Resend OTP
                        </button>
                    ) : (
                        <span style={{ opacity: 0.6, fontWeight: 'bold' }}>
                            Resend in {countdown}s
                        </span>
                    )}
                </div>

                <p style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                    Back to <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyOtp;
