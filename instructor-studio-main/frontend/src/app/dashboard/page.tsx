'use client';
import { BookOpen, Award, TrendingUp, Clock, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import { useStudentDashboard,useMyEnrollments } from '../../hooks';
import { formatDate,formatHours } from '../../lib/utils';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value ?? '—'}</p>
        <p className="text-white/50 text-sm mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats } = useStudentDashboard();
  const { data: enrollments } = useMyEnrollments('active');

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">
              Welcome back, <span className="text-gradient">{user?.first_name}</span> 👋
            </h1>
            <p className="text-white/50 mt-1">Here&apos;s what&apos;s happening with your learning</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={BookOpen} label="Active Courses" value={stats?.active_enrollments || 0} color="bg-blue-500" />
            <StatCard icon={Award} label="Completed" value={stats?.completed_courses || 0} color="bg-green-500" />
            <StatCard icon={TrendingUp} label="Certificates" value={stats?.certificates_earned || 0} color="bg-orange-500" />
            <StatCard icon={Clock} label="Avg Progress" value={stats?.avg_progress ? `${stats.avg_progress}%` : '0%'} color="bg-purple-500" />
          </div>

          {/* Active Enrollments */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Continue Learning</h2>
              <Link href="/dashboard/my-courses" className="text-orange-400 text-sm hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {!enrollments?.length ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No active courses yet</p>
                <Link href="/courses" className="btn-primary inline-block mt-4 text-sm">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 5).map((e: any) => (
                  <div key={e.id} className="flex items-center gap-4 p-4 bg-[#0A1628] rounded-xl hover:bg-[#0D1B30] transition-colors">
                    <div className="w-16 h-16 bg-[#1E3250] rounded-lg overflow-hidden flex-shrink-0">
                      {e.thumbnail_url
                        ? <img src={e.thumbnail_url} alt={e.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white/20" />
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{e.title}</h3>
                      <p className="text-white/40 text-xs mt-0.5">{e.instructor_name}</p>
                      <div className="mt-2 progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${e.progress_pct}%` }} />
                      </div>
                      <p className="text-xs text-white/40 mt-1">{e.progress_pct}% complete</p>
                    </div>
                    <Link href={`/courses/${e.slug}/learn`}
                      className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors flex-shrink-0">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
