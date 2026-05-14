'use client';

import { useState } from 'react';
import { Search, UserCheck, Ban, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUsers } from '../../../hooks';
import { DashboardSidebar } from '../../../components/layout/DashboardSidebar';
import { userApi } from '../../../lib/api-services';
import { formatRelativeTime, getInitials, ROLE_LABELS, ROLE_COLORS, STATUS_COLORS } from '../../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils';
import type { RoleType } from '../../../types';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data, isLoading } = useAdminUsers({ search: search || undefined, status: status || undefined, role: role || undefined, page, limit: 20 });
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await userApi.updateStatus(userId, newStatus);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleRoleAssign = async (userId: string, roleName: string) => {
    try {
      await userApi.assignRole(userId, roleName);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Role assigned`);
    } catch { toast.error('Failed to assign role'); }
  };

  const roles: RoleType[] = ['student', 'instructor', 'blog_manager', 'hr_manager', 'website_manager', 'admin', 'super_admin'];

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-white/50 mt-1">{data?.meta?.total || 0} total users</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name or email..." className="input pl-10 text-sm py-2.5"
                />
              </div>
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="input w-40 py-2.5 text-sm">
                <option value="">All Statuses</option>
                {['active', 'inactive', 'banned', 'pending_verification'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
                className="input w-40 py-2.5 text-sm">
                <option value="">All Roles</option>
                {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['User', 'Roles', 'Status', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="table-header text-left first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="table-row">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="table-cell">
                            <div className="h-4 bg-white/5 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : data?.data?.map((user: any) => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0 overflow-hidden">
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              : getInitials(`${user.first_name} ${user.last_name}`)
                            }
                          </div>
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-white/40 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).filter(Boolean).map((r: string) => (
                            <span key={r} className={cn('badge', ROLE_COLORS[r] || 'bg-gray-100 text-gray-700')}>
                              {ROLE_LABELS[r] || r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={cn('badge', STATUS_COLORS[user.status])}>
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell text-white/40">
                        {user.last_login_at ? formatRelativeTime(user.last_login_at) : 'Never'}
                      </td>
                      <td className="table-cell pr-6">
                        <div className="flex items-center gap-2">
                          {user.status === 'banned' ? (
                            <button onClick={() => handleStatusChange(user.id, 'active')}
                              className="flex items-center gap-1 text-xs text-green-400 hover:underline">
                              <UserCheck className="w-3 h-3" /> Unban
                            </button>
                          ) : (
                            <button onClick={() => handleStatusChange(user.id, 'banned')}
                              className="flex items-center gap-1 text-xs text-red-400 hover:underline">
                              <Ban className="w-3 h-3" /> Ban
                            </button>
                          )}
                          <button onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-1 text-xs text-orange-400 hover:underline">
                            <Shield className="w-3 h-3" /> Roles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#1E3250]">
              <p className="text-sm text-white/40">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data?.meta?.total || 0)} of {data?.meta?.total || 0}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="btn-ghost p-2 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">{page} / {data?.meta?.totalPages || 1}</span>
                <button disabled={!data?.meta?.hasNextPage} onClick={() => setPage(p => p + 1)}
                  className="btn-ghost p-2 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Role Management Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="card w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-1">Manage Roles</h3>
                <p className="text-white/50 text-sm mb-4">{selectedUser.first_name} {selectedUser.last_name}</p>
                <div className="space-y-2 mb-4">
                  {roles.map(r => {
                    const hasRole = (selectedUser.roles || []).includes(r);
                    return (
                      <div key={r} className="flex items-center justify-between py-2 border-b border-[#1E3250] last:border-0">
                        <span className={cn('badge', ROLE_COLORS[r])}>{ROLE_LABELS[r]}</span>
                        <button
                          onClick={() => handleRoleAssign(selectedUser.id, r)}
                          className={cn('text-xs px-3 py-1 rounded-lg transition-colors',
                            hasRole ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                          )}>
                          {hasRole ? 'Revoke' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setSelectedUser(null)} className="btn-secondary w-full text-sm">Close</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
