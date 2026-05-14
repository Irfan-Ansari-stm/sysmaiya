'use client';
import { useState } from 'react';
import { MapPin, Clock, DollarSign, Briefcase, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useJobs, useDepartments } from '../../hooks';
import { Navbar } from '../../components/layout/Navbar';
import { formatPrice, formatDate, cn } from '../../lib/utils';

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: 'bg-green-500/10 text-green-400',
  part_time: 'bg-blue-500/10 text-blue-400',
  contract: 'bg-yellow-500/10 text-yellow-400',
  internship: 'bg-purple-500/10 text-purple-400',
};

function JobCard({ job }: { job: any }) {
  return (
    <Link href={`/careers/${job.slug}`}
      className="card hover:border-orange-500/30 transition-all group flex flex-col sm:flex-row gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={cn('badge text-xs', JOB_TYPE_COLORS[job.job_type] || 'bg-gray-500/10 text-gray-400')}>
            {job.job_type.replace('_', '-')}
          </span>
          {job.is_remote && (
            <span className="badge bg-teal-500/10 text-teal-400 text-xs">Remote</span>
          )}
          {job.department_name && (
            <span className="badge bg-white/5 text-white/40 text-xs">{job.department_name}</span>
          )}
        </div>

        <h3 className="font-bold text-lg group-hover:text-orange-300 transition-colors">{job.title}</h3>

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/50">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />{job.location}
            </span>
          )}
          {(job.experience_min !== null) && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              {job.experience_min}–{job.experience_max || '∞'} years
            </span>
          )}
          {job.salary_min && (
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              {formatPrice(job.salary_min, job.salary_currency)}–{formatPrice(job.salary_max || job.salary_min * 1.5, job.salary_currency)} / yr
            </span>
          )}
          {job.application_deadline && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Apply by {formatDate(job.application_deadline, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center sm:flex-col gap-3 sm:text-right">
        <span className="text-sm text-white/30">{job.total_openings} opening{job.total_openings !== 1 ? 's' : ''}</span>
        <span className="btn-primary text-sm py-2 px-4 flex items-center gap-1 whitespace-nowrap">
          Apply Now <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

export default function CareersPage() {
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [isRemote, setIsRemote] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useJobs({
    department: department || undefined,
    type: type || undefined,
    is_remote: isRemote,
    page, limit: 10,
  });
  const { data: departments } = useDepartments();

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1A3C5E]/20 to-[#0A1628]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="section-title mb-4">Join Our Team</h1>
          <p className="section-subtitle">
            We&apos;re looking for passionate people to help us build the future of online education.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filters */}
        <div className="card mb-6 flex flex-wrap gap-3">
          <select value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }}
            className="input w-44 py-2.5 text-sm">
            <option value="">All Departments</option>
            {departments?.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            className="input w-40 py-2.5 text-sm">
            <option value="">All Types</option>
            {['full_time', 'part_time', 'contract', 'internship'].map(t => (
              <option key={t} value={t}>{t.replace('_', '-')}</option>
            ))}
          </select>
          <button onClick={() => setIsRemote(isRemote === true ? undefined : true)}
            className={cn('px-4 py-2.5 rounded-xl text-sm border transition-colors',
              isRemote === true ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'border-[#1E3250] text-white/50')}>
            Remote Only
          </button>
        </div>

        <p className="text-white/40 text-sm mb-4">{data?.meta?.total || 0} open positions</p>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-28" />
            ))}
          </div>
        ) : data?.data?.length ? (
          <div className="space-y-4">
            {data.data.map((job: any) => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          <div className="text-center py-20 card">
            <Briefcase className="w-14 h-14 text-white/10 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No open positions</h3>
            <p className="text-white/40 text-sm">Check back later for new opportunities.</p>
          </div>
        )}

        {(data?.meta?.totalPages || 0) > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">← Previous</button>
            <button disabled={!data?.meta?.hasNextPage} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
