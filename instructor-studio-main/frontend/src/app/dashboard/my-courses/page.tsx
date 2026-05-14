'use client';
import { useState } from 'react';
import { BookOpen, Play, CheckCircle, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { useMyEnrollments } from '../../../hooks';
import { DashboardSidebar } from '../../../components/layout/DashboardSidebar';
import { formatDate, formatHours, cn } from '../../../lib/utils';

const TABS = ['active', 'completed', 'dropped'] as const;

export default function MyCoursesPage() {
  const [tab, setTab] = useState<'active' | 'completed' | 'dropped'>('active');
  const { data: enrollments, isLoading } = useMyEnrollments(tab);

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Courses</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-[#12203A] rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                  tab === t ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white')}>
                {t}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card flex gap-4 animate-pulse">
                  <div className="w-32 h-20 bg-white/5 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                    <div className="h-2 bg-white/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !enrollments?.length ? (
            <div className="text-center py-20 card">
              <BookOpen className="w-14 h-14 text-white/10 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No {tab} courses</h3>
              <p className="text-white/40 text-sm mb-6">
                {tab === 'active' ? "You haven't enrolled in any courses yet." : `You have no ${tab} courses.`}
              </p>
              {tab === 'active' && (
                <Link href="/courses" className="btn-primary inline-block text-sm">Browse Courses</Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((e: any) => (
                <div key={e.id} className="card flex flex-col sm:flex-row gap-4 hover:border-orange-500/20 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-36 h-24 bg-[#0A1628] rounded-xl overflow-hidden flex-shrink-0">
                    {e.thumbnail_url
                      ? <img src={e.thumbnail_url} alt={e.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white/10" />
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{e.title}</h3>
                        <p className="text-white/40 text-sm mt-0.5">{e.instructor_name}</p>
                      </div>
                      {e.status === 'completed' && (
                        <span className="badge bg-green-500/10 text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-white/40 mt-2">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatHours(e.duration_hours)}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{e.total_lessons} lessons</span>
                      <span>Enrolled {formatDate(e.enrolled_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/40">Progress</span>
                        <span className="font-medium text-orange-400">{e.progress_pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${e.progress_pct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 sm:w-28 flex-shrink-0 justify-end">
                    <Link href={`/courses/${e.slug}/learn`}
                      className="btn-primary text-sm py-2 px-3 flex items-center gap-1 justify-center">
                      <Play className="w-3.5 h-3.5" />
                      {e.status === 'completed' ? 'Review' : 'Continue'}
                    </Link>
                    {e.status === 'completed' && (
                      <Link href="/dashboard/certificates"
                        className="btn-secondary text-sm py-2 px-3 flex items-center gap-1 justify-center">
                        <Award className="w-3.5 h-3.5" /> Certificate
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
