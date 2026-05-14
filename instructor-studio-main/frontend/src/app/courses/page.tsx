'use client';
import { useState } from 'react';
import { Search, Filter, Star, Users, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useCourses, useCategories } from '../../hooks';
import { Navbar } from '../../components/layout/Navbar';
import { formatPrice, formatHours, cn } from '../../lib/utils';
import type { Course } from '../../types';

const LEVELS = ['all_levels', 'beginner', 'intermediate', 'advanced'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'highest_rated', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.slug}`} className="card p-0 overflow-hidden hover:border-orange-500/40 transition-all group">
      <div className="relative h-44 bg-[#0A1628] overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/10" />
          </div>
        )}
        {course.is_free && (
          <span className="absolute top-3 left-3 badge bg-green-500 text-white text-xs font-bold">FREE</span>
        )}
        <span className="absolute top-3 right-3 badge bg-black/60 text-white/80 text-xs capitalize">
          {course.level.replace('_', ' ')}
        </span>
      </div>
      <div className="p-4">
        <p className="text-orange-400 text-xs font-medium mb-1">{course.category_name}</p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-orange-100 transition-colors">
          {course.title}
        </h3>
        <p className="text-white/40 text-xs mb-3">{course.instructor_name}</p>
        <div className="flex items-center gap-3 text-xs text-white/50 mb-3">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{course.rating_avg.toFixed(1)}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.total_students.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatHours(course.duration_hours)}</span>
        </div>
        <div className="flex items-center justify-between">
          {course.is_free ? (
            <span className="text-green-400 font-bold">Free</span>
          ) : (
            <div>
              <span className="font-bold text-orange-400">{formatPrice(course.discount_price || course.price)}</span>
              {course.discount_price && (
                <span className="text-white/30 text-xs line-through ml-2">{formatPrice(course.price)}</span>
              )}
            </div>
          )}
          <span className="text-xs text-white/30">{course.total_lessons} lessons</span>
        </div>
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState('newest');
  const [isFree, setIsFree] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCourses({
    search: search || undefined, category: category || undefined,
    level: level || undefined, sort, is_free: isFree, page, limit: 12,
  });
  const { data: categories } = useCategories();

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="section-title">Browse All Courses</h1>
          <p className="section-subtitle">Expertly crafted courses to elevate your knowledge and skills</p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search courses..." className="input pl-10 py-2.5 text-sm" />
            </div>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="input w-44 py-2.5 text-sm">
              <option value="">All Categories</option>
              {categories?.map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
              className="input w-36 py-2.5 text-sm">
              <option value="">All Levels</option>
              {LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="input w-44 py-2.5 text-sm">
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsFree(isFree === true ? undefined : true)}
                className={cn('px-4 py-2.5 rounded-xl text-sm border transition-colors',
                  isFree === true ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'border-[#1E3250] text-white/50 hover:border-white/20')}>
                Free Only
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-sm">{data?.meta?.total || 0} courses found</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-0 overflow-hidden animate-pulse">
                <div className="h-44 bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-4 bg-white/5 rounded" />
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.data.map((course: Course) => <CourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-white/40">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {(data?.meta?.totalPages || 0) > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">← Previous</button>
            <span className="btn-ghost py-2 px-4 text-sm">{page} / {data?.meta?.totalPages}</span>
            <button disabled={!data?.meta?.hasNextPage} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
