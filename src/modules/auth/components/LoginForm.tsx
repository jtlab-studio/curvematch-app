import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../common/components/Input';
import Button from '../../common/components/Button';
import GlassPanel from '../../common/components/GlassPanel';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password);
      navigate('/match');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <GlassPanel className="w-full max-w-md mx-auto p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        
        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Enter your password"
        />

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
        >
          Login
        </Button>

        <p className="text-center text-sm">
          Don't have an account?{' '}
          <a href="/signup" className="text-accent-1 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </GlassPanel>
  );
};

export default LoginForm;
