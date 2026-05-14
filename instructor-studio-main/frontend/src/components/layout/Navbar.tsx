'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Bell, Search, Menu, X, BookOpen, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useNotifications } from '../../hooks';
import { getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: notifications } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  const navLinks = [
    { href: '/courses', label: 'Courses' },
    { href: '/instructors', label: 'Instructors' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1628]/95 backdrop-blur border-b border-[#1E3250]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Instructor<span className="text-orange-400">Studio</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 hidden md:flex">
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Link href="/dashboard/notifications" className="relative btn-ghost p-2">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 btn-ghost rounded-xl px-2 py-1.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(`${user.first_name} ${user.last_name}`)
                      )}
                    </div>
                    <span className="text-sm hidden md:block">{user.first_name}</span>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-12 w-52 card z-20 p-2 space-y-1">
                        <div className="px-3 py-2 border-b border-[#1E3250] mb-1">
                          <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-orange-400" /> Dashboard
                        </Link>
                        <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-colors">
                          <User className="w-4 h-4 text-orange-400" /> Profile
                        </Link>
                        {(user.roles.includes('admin') || user.roles.includes('super_admin')) && (
                          <Link href="/admin" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-colors">
                            <LayoutDashboard className="w-4 h-4 text-purple-400" /> Admin Panel
                          </Link>
                        )}
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 transition-colors">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A1628] border-t border-[#1E3250] px-4 py-4 space-y-2">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block py-2 text-white/70 hover:text-white">
              {l.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="pt-2 flex gap-2">
              <Link href="/auth/login" className="btn-secondary flex-1 text-center text-sm">Login</Link>
              <Link href="/auth/register" className="btn-primary flex-1 text-center text-sm">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
