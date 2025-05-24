import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../common/components/Input';
import Button from '../../common/components/Button';
import GlassPanel from '../../common/components/GlassPanel';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  interest: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError(null);
      await signup({
        email: data.email,
        username: data.username,
        password: data.password,
        interest: data.interest,
      });
      navigate('/match');
    } catch (err) {
      setError('Failed to create account');
    }
  };

  return (
    <GlassPanel className="w-full max-w-md mx-auto p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        
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
          label="Username"
          type="text"
          {...register('username')}
          error={errors.username?.message}
          placeholder="Choose a username"
        />

        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Create a password"
        />

        <Input
          label="Confirm Password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Confirm your password"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            I'm a... (optional)
          </label>
          <select
            {...register('interest')}
            className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20"
          >
            <option value="">Select...</option>
            <option value="hiker">Hiker</option>
            <option value="cyclist">Cyclist</option>
            <option value="runner">Runner</option>
          </select>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
        >
          Sign Up
        </Button>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-accent-1 hover:underline">
            Login
          </a>
        </p>
      </form>
    </GlassPanel>
  );
};

export default SignupForm;
