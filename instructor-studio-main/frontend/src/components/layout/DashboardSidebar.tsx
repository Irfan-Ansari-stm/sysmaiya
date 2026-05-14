'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Award, ShoppingBag, User, Bell,
  LogOut, ChevronRight, Users, BarChart2, FileText, Briefcase,
  Settings, Globe, GraduationCap, PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { cn, getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/my-courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/certificates', label: 'Certificates', icon: Award },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { href: '/dashboard/instructor', label: 'My Courses', icon: GraduationCap },
  { href: '/dashboard/instructor/create', label: 'Create Course', icon: PlusCircle },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/enrollments', label: 'Enrollments', icon: GraduationCap },
  { href: '/admin/payments', label: 'Payments', icon: BarChart2 },
  { href: '/admin/logs', label: 'Activity Logs', icon: FileText },
];

const BLOG_NAV: NavItem[] = [
  { href: '/dashboard/blog', label: 'Blog Posts', icon: FileText },
  { href: '/dashboard/blog/create', label: 'New Post', icon: PlusCircle },
];

const HR_NAV: NavItem[] = [
  { href: '/dashboard/careers', label: 'Job Postings', icon: Briefcase },
  { href: '/dashboard/careers/create', label: 'Post a Job', icon: PlusCircle },
  { href: '/dashboard/careers/applications', label: 'Applications', icon: Users },
];

const WEBSITE_NAV: NavItem[] = [
  { href: '/dashboard/cms/settings', label: 'Site Settings', icon: Settings },
  { href: '/dashboard/cms/pages', label: 'Pages', icon: Globe },
  { href: '/dashboard/cms/faqs', label: 'FAQs', icon: FileText },
  { href: '/dashboard/cms/testimonials', label: 'Testimonials', icon: Users },
  { href: '/dashboard/cms/messages', label: 'Messages', icon: Bell },
];

export function DashboardSidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  const roles = user?.roles || [];

  const navSections: { title: string; items: NavItem[]; show: boolean }[] = [
    { title: 'Student', items: STUDENT_NAV, show: true },
    { title: 'Instructor', items: INSTRUCTOR_NAV, show: roles.some(r => ['instructor', 'admin', 'super_admin'].includes(r)) },
    { title: 'Blog', items: BLOG_NAV, show: roles.some(r => ['blog_manager', 'admin', 'super_admin'].includes(r)) },
    { title: 'HR / Careers', items: HR_NAV, show: roles.some(r => ['hr_manager', 'admin', 'super_admin'].includes(r)) },
    { title: 'Website CMS', items: WEBSITE_NAV, show: roles.some(r => ['website_manager', 'admin', 'super_admin'].includes(r)) },
    { title: 'Admin', items: ADMIN_NAV, show: roles.some(r => ['admin', 'super_admin'].includes(r)) },
  ];

  return (
    <aside className="w-64 bg-[#0A1628] border-r border-[#1E3250] h-screen flex flex-col sticky top-0 overflow-y-auto scrollbar-hide">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-[#1E3250] flex-shrink-0">
        <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm">Instructor<span className="text-orange-400">Studio</span></span>
      </Link>

      {/* User Info */}
      {user && (
        <div className="px-4 py-4 border-b border-[#1E3250]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : getInitials(`${user.first_name} ${user.last_name}`)
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-hide">
        {navSections.filter(s => s.show).map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(isActive ? 'sidebar-item-active' : 'sidebar-item', 'text-sm')}>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#1E3250]">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
