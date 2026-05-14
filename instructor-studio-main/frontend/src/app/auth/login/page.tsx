'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { getErrorMessage } from '../../../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  remember_me: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password, data.remember_me);
      toast.success('Welcome back!');
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#1A3C5E] to-[#0A1628] flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Instructor<span className="text-orange-400">Studio</span></span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            A Better Learning<br /><span className="text-orange-400">Journey Starts Here</span>
          </h2>
          <p className="text-white/60 text-lg mb-8">Join thousands of students learning from world-class instructors.</p>
          <div className="space-y-4">
            {[
              { stat: '10,000+', label: 'Students Enrolled' },
              { stat: '500+', label: 'Courses Available' },
              { stat: '98%', label: 'Satisfaction Rate' },
            ].map(({ stat, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-white/80"><strong className="text-white">{stat}</strong> {label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#0A1628]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Instructor<span className="text-orange-400">Studio</span></span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-white/50 mb-8">Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-orange-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" className="input pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input {...register('remember_me')} type="checkbox" id="remember" className="w-4 h-4 accent-orange-500" />
              <label htmlFor="remember" className="text-sm text-white/60 cursor-pointer">Remember me for 90 days</label>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-orange-400 hover:underline font-medium">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
