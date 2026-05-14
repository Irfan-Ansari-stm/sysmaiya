'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '../../../lib/api-services';
import { getErrorMessage } from '../../../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  first_name: z.string().min(1, 'First name required').max(80),
  last_name: z.string().min(1, 'Last name required').max(80),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Need uppercase letter')
    .regex(/[a-z]/, 'Need lowercase letter')
    .regex(/[0-9]/, 'Need a number')
    .regex(/[^A-Za-z0-9]/, 'Need special character'),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register(data);
      setRegistered(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1628] px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your inbox!</h2>
          <p className="text-white/60 mb-6">We&apos;ve sent a verification link to your email. Click it to activate your account.</p>
          <Link href="/auth/login" className="btn-primary inline-block">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">Instructor<span className="text-orange-400">Studio</span></span>
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-white/50 text-sm mb-6">Start your learning journey today — it&apos;s free</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input {...register('first_name')} placeholder="John" className="input" />
                {errors.first_name && <p className="text-red-400 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last name</label>
                <input {...register('last_name')} placeholder="Doe" className="input" />
                {errors.last_name && <p className="text-red-400 text-xs mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <input {...register('phone')} placeholder="+91 9876543210" className="input" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'}
                  placeholder="Create a strong password" className="input pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {checks.map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-400' : 'text-white/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-white/20'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-orange-400 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
