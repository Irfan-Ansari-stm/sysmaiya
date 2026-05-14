'use client';
import { Users, BookOpen, DollarSign, TrendingUp, GraduationCap, Activity } from 'lucide-react';
// import { useAdminStats, useRevenueStats, useActivityLogs } from '../../../hooks'; 
import { useAdminStats,useRevenueStats,useActivityLogs } from '../../hooks';
// import { DashboardSidebar } from '../../../components/layout/DashboardSidebar';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
// import { formatPrice, formatRelativeTime, ROLE_LABELS } from '../../../lib/utils';
import { formatPrice,formatRelativeTime,ROLE_LABELS } from '../../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-white/50 text-sm mt-0.5">{label}</p>
        {sub && <p className="text-xs text-green-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats } = useAdminStats();
  const { data: revenue } = useRevenueStats();
  const { data: logsData } = useActivityLogs({ limit: 10 });

  const revenueChartData = revenue?.slice(0, 6).reverse().map((r: any) => ({
    month: new Date(r.month).toLocaleDateString('en-IN', { month: 'short' }),
    revenue: parseFloat(r.revenue || 0),
    orders: parseInt(r.orders || 0),
  })) || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/50 mt-1">Platform-wide overview and insights</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users} label="Total Users" color="bg-blue-500"
              value={stats?.users?.total || 0}
              sub={`+${stats?.users?.new_this_month || 0} this month`}
            />
            <StatCard
              icon={BookOpen} label="Total Courses" color="bg-purple-500"
              value={stats?.courses?.total || 0}
              sub={`${stats?.courses?.published || 0} published`}
            />
            <StatCard
              icon={GraduationCap} label="Enrollments" color="bg-green-500"
              value={stats?.enrollments?.total || 0}
              sub={`${stats?.enrollments?.completed || 0} completed`}
            />
            <StatCard
              icon={DollarSign} label="Total Revenue" color="bg-orange-500"
              value={formatPrice(parseFloat(stats?.revenue?.total_revenue || '0'))}
              sub={`${formatPrice(parseFloat(stats?.revenue?.this_month || '0'))} this month`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="card lg:col-span-2">
              <h2 className="text-lg font-semibold mb-6">Monthly Revenue</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3250" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#12203A', border: '1px solid #1E3250', borderRadius: 8 }}
                    formatter={(v: any) => [formatPrice(v), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Platform Health</h2>
              <div className="space-y-4">
                {[
                  { label: 'Active Users', value: stats?.users?.active || 0, icon: Users, color: 'text-blue-400' },
                  { label: 'Active Enrollments', value: stats?.enrollments?.active || 0, icon: TrendingUp, color: 'text-green-400' },
                  { label: 'Draft Courses', value: stats?.courses?.drafts || 0, icon: BookOpen, color: 'text-yellow-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-[#1E3250] last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-white/60 text-sm">{label}</span>
                    </div>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" /> Recent Activity
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['User', 'Action', 'Entity', 'Time'].map(h => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logsData?.data?.map((log: any) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell">{log.user_email || 'System'}</td>
                      <td className="table-cell">
                        <code className="text-orange-400 text-xs bg-orange-500/10 px-2 py-0.5 rounded">
                          {log.action}
                        </code>
                      </td>
                      <td className="table-cell text-white/50">{log.entity_type || '—'}</td>
                      <td className="table-cell text-white/40">{formatRelativeTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
