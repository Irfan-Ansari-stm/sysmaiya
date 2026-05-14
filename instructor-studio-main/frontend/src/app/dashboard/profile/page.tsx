'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Shield, Monitor, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { userApi, authApi } from '../../../lib/api-services';
import { DashboardSidebar } from '../../../components/layout/DashboardSidebar';
import { getInitials, cn } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Required').max(80),
  last_name: z.string().min(1, 'Required').max(80),
  bio: z.string().max(1000).optional(),
  phone: z.string().optional(),
  country: z.string().max(60).optional(),
  city: z.string().max(80).optional(),
  timezone: z.string().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say', '']).optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8)
    .regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase')
    .regex(/[0-9]/, 'Need number').regex(/[^A-Za-z0-9]/, 'Need special char'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: "Passwords don't match", path: ['confirm_password'],
});

type ProfileTab = 'profile' | 'password' | 'sessions';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab] = useState<ProfileTab>('profile');
  const qc = useQueryClient();

  // Profile form
  const { register: regProfile, handleSubmit: handleProfile, reset, formState: { errors: profErrors, isSubmitting: profSaving } } =
    useForm({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (user) reset({ ...user, gender: user.gender || '', bio: user.bio || '', phone: user.phone || '', country: user.country || '', city: user.city || '' } as any);
  }, [user, reset]);

  const onSaveProfile = async (data: any) => {
    try {
      await userApi.updateProfile(data);
      await fetchMe();
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
  };

  // Password form
  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { errors: passErrors, isSubmitting: passSaving } } =
    useForm({ resolver: zodResolver(passwordSchema) });

  const onChangePassword = async (data: any) => {
    try {
      await authApi.changePassword(data.current_password, data.new_password);
      resetPass();
      toast.success('Password changed! Please log in again.');
    } catch { toast.error('Current password is incorrect'); }
  };

  // Sessions
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => userApi.getSessions().then(r => r.data.data.sessions),
    enabled: tab === 'sessions',
  });

  const revokeSession = async (sessionId: string) => {
    try {
      await userApi.revokeSession(sessionId);
      qc.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session revoked');
    } catch { toast.error('Failed to revoke session'); }
  };

  const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-xl font-bold overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : getInitials(`${user?.first_name} ${user?.last_name}`)
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
              <p className="text-white/50 text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#12203A] rounded-xl p-1 mb-6 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  tab === id ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white')}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <form onSubmit={handleProfile(onSaveProfile)} className="card space-y-5">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input {...regProfile('first_name')} className="input" />
                  {profErrors.first_name && <p className="text-red-400 text-xs mt-1">{profErrors.first_name.message as string}</p>}
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input {...regProfile('last_name')} className="input" />
                  {profErrors.last_name && <p className="text-red-400 text-xs mt-1">{profErrors.last_name.message as string}</p>}
                </div>
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea {...regProfile('bio')} rows={3} placeholder="Tell us about yourself..." className="input resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input {...regProfile('phone')} placeholder="+91 9876543210" className="input" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select {...regProfile('gender')} className="input">
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className="label">Country</label>
                  <input {...regProfile('country')} placeholder="India" className="input" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input {...regProfile('city')} placeholder="Mumbai" className="input" />
                </div>
              </div>
              <button type="submit" disabled={profSaving} className="btn-primary flex items-center gap-2">
                {profSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          )}

          {/* Password Tab */}
          {tab === 'password' && (
            <form onSubmit={handlePass(onChangePassword)} className="card space-y-5">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <div>
                <label className="label">Current Password</label>
                <input {...regPass('current_password')} type="password" className="input" />
                {passErrors.current_password && <p className="text-red-400 text-xs mt-1">{passErrors.current_password.message as string}</p>}
              </div>
              <div>
                <label className="label">New Password</label>
                <input {...regPass('new_password')} type="password" className="input" />
                {passErrors.new_password && <p className="text-red-400 text-xs mt-1">{passErrors.new_password.message as string}</p>}
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input {...regPass('confirm_password')} type="password" className="input" />
                {passErrors.confirm_password && <p className="text-red-400 text-xs mt-1">{passErrors.confirm_password.message as string}</p>}
              </div>
              <button type="submit" disabled={passSaving} className="btn-primary flex items-center gap-2">
                {passSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </form>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
              <div className="space-y-3">
                {sessions?.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-8">No active sessions</p>
                )}
                {sessions?.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-[#1E3250] last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.ip_address || 'Unknown IP'}</p>
                      <p className="text-xs text-white/40">{s.user_agent?.slice(0, 60) || 'Unknown browser'}</p>
                      <p className="text-xs text-white/30 mt-0.5">Created: {new Date(s.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => revokeSession(s.id)}
                      className="text-xs text-red-400 hover:underline px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
