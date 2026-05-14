'use client';
import { useState } from 'react';
import { Search, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { useBlogPosts, useBlogTags } from '../../hooks';
import { Navbar } from '../../components/layout/Navbar';
import { formatRelativeTime, cn } from '../../lib/utils';

const CATEGORIES = ['Tech', 'Design', 'Marketing', 'Business', 'Career', 'Tutorial', 'News'];
const CAT_COLORS: Record<string, string> = {
  Tech: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Design: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Marketing: 'bg-green-500/10 text-green-400 border-green-500/20',
  Business: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Career: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Tutorial: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  News: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function PostCard({ post, featured = false }: { post: any; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`}
      className={cn('card p-0 overflow-hidden hover:border-orange-500/30 transition-all group',
        featured && 'md:col-span-2')}>
      <div className={cn('bg-[#0A1628] overflow-hidden', featured ? 'h-64' : 'h-44')}>
        {post.thumbnail_url
          ? <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A3C5E] to-[#0A1628]">
              <span className="text-5xl opacity-20">📝</span>
            </div>
        }
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn('badge border text-xs', CAT_COLORS[post.category] || CAT_COLORS.Tech)}>
            {post.category}
          </span>
          {post.tags?.filter(Boolean).slice(0, 2).map((t: string) => (
            <span key={t} className="badge bg-white/5 text-white/40 text-xs">#{t}</span>
          ))}
        </div>
        <h3 className={cn('font-bold leading-snug mb-2 group-hover:text-orange-300 transition-colors',
          featured ? 'text-xl' : 'text-base line-clamp-2')}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-white/50 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-white/30">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-orange-500/20 overflow-hidden flex-shrink-0">
              {post.author_avatar
                ? <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-[8px] flex items-center justify-center h-full text-orange-400">
                    {post.author_name?.charAt(0)}
                  </span>
              }
            </div>
            <span>{post.author_name}</span>
          </div>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_min}m read</span>
          <span>·</span>
          <span>{formatRelativeTime(post.published_at)}</span>
          <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" />{post.view_count}</span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBlogPosts({
    search: search || undefined, category: category || undefined, page, limit: 9,
  });

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Latest Blog Articles</h1>
          <p className="section-subtitle">
            Insights, stories, and updates from our{' '}
            <span className="text-orange-400">instructors</span> and{' '}
            <span className="text-orange-400">digital creators</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search articles..." className="input pl-10 py-2.5 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setCategory(''); setPage(1); }}
              className={cn('px-4 py-2.5 rounded-xl text-sm border transition-colors',
                !category ? 'bg-orange-500 border-orange-500 text-white' : 'border-[#1E3250] text-white/50 hover:border-white/20')}>
              All
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCategory(c === category ? '' : c); setPage(1); }}
                className={cn('px-4 py-2.5 rounded-xl text-sm border transition-colors',
                  category === c
                    ? `${CAT_COLORS[c]} border-current`
                    : 'border-[#1E3250] text-white/50 hover:border-white/20')}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-0 animate-pulse">
                <div className="h-44 bg-white/5" />
                <div className="p-5 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                  <div className="h-4 bg-white/5 rounded" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((post: any, i: number) => (
              <PostCard key={post.id} post={post} featured={i === 0 && page === 1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 card">
            <p className="text-white/40">No articles found</p>
          </div>
        )}

        {/* Pagination */}
        {(data?.meta?.totalPages || 0) > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">← Previous</button>
            <span className="py-2 px-4 text-sm text-white/50">{page} / {data?.meta?.totalPages}</span>
            <button disabled={!data?.meta?.hasNextPage} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
