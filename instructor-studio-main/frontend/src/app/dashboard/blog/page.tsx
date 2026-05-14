'use client';
import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Eye, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '../../../lib/api-services';
import { DashboardSidebar } from '../../../components/layout/DashboardSidebar';
import { formatRelativeTime, cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/10 text-green-400',
  draft: 'bg-gray-500/10 text-gray-400',
  scheduled: 'bg-blue-500/10 text-blue-400',
  archived: 'bg-red-500/10 text-red-400',
};

export default function BlogManagerPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  // Fetch all posts (including drafts) for manager
  const { data, isLoading } = useQuery({
    queryKey: ['blog-manager', page],
    queryFn: () => blogApi.list({ page, limit: 15 }).then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => blogApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-manager'] }); toast.success('Post deleted'); },
    onError: () => toast.error('Failed to delete post'),
  });

  const confirmDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"?`)) deleteMut.mutate(id);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Blog Management</h1>
              <p className="text-white/50 text-sm">{data?.meta?.total || 0} total posts</p>
            </div>
            <Link href="/dashboard/blog/create" className="btn-primary flex items-center gap-2 text-sm">
              <PlusCircle className="w-4 h-4" /> New Post
            </Link>
          </div>

          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Title', 'Category', 'Status', 'Views', 'Published', 'Actions'].map(h => (
                    <th key={h} className="table-header text-left first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="table-row">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="table-cell">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.data?.map((post: any) => (
                  <tr key={post.id} className="table-row">
                    <td className="table-cell pl-6 max-w-xs">
                      <p className="font-medium truncate">{post.title}</p>
                      <p className="text-white/30 text-xs">{post.author_name}</p>
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-blue-500/10 text-blue-400 text-xs">{post.category}</span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge text-xs', STATUS_COLORS[post.status] || 'bg-gray-500/10 text-gray-400')}>
                        {post.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="flex items-center gap-1 text-white/50">
                        <Eye className="w-3 h-3" />{post.view_count}
                      </span>
                    </td>
                    <td className="table-cell text-white/40">
                      {post.published_at ? formatRelativeTime(post.published_at) : '—'}
                    </td>
                    <td className="table-cell pr-6">
                      <div className="flex items-center gap-2">
                        <Link href={`/blog/${post.slug}`}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/dashboard/blog/edit/${post.id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => confirmDelete(post.id, post.title)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {(data?.meta?.totalPages || 0) > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#1E3250]">
                <p className="text-sm text-white/40">{data?.meta?.total} posts</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
                  <button disabled={!data?.meta?.hasNextPage} onClick={() => setPage(p => p + 1)}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
