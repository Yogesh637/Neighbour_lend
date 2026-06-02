import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../features/auth/authSchemas';
import { useRegisterMutation } from '../../features/auth/hooks/useAuthMutations';

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    
    const registerMutation = useRegisterMutation();
    const isLoading = registerMutation.isPending;

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            address: '',
            password: '',
        }
    });

    const onSubmit = (data) => {
        setError('');
        registerMutation.mutate(data, {
            onSuccess: () => {
                navigate('/verify-otp', { state: { email: data.email } });
            },
            onError: (err) => {
                console.error(err);
                const msg = err.response?.data?.message || err.response?.data || 'Registration failed. Backend might be unreachable or email taken.';
                setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            }
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Join Community</h2>
                {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
                <form onSubmit={handleSubmit(onSubmit)}>
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
                            type="text"
                            className="input-field"
                            placeholder="Address"
                            style={{ marginBottom: '0.25rem' }}
                            disabled={isLoading}
                            {...register('address')}
                        />
                        {errors.address && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left', margin: '0 0 0 4px' }}>
                                {errors.address.message}
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

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
